import { Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../types/authRequest';
import * as notificationDbService from '../services/notificationDbService';
import { emitNotificationNewEvent } from '../services/realtimeService';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';

type ResolvePayload = {
  resolved_option_id?: number;
  resolution_evidence_url?: string;
  resolution_note?: string;
  challenge_window_ends_at?: string;
};

const toIsoOrNull = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

export const getPendingApprovals = async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('id, title, description, category, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(0, 199);

    if (error) {
      throw error;
    }

    return res.status(200).json({ data: data || [] });
  } catch (error) {
    console.error('getPendingApprovals failed', error);
    return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

export const getDueResolutions = async (_req: AuthRequest, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const { data: markets, error } = await supabase
      .from('markets')
      .select('id, title, category, status, end_date')
      .in('status', ['active', 'resolving'])
      .lte('end_date', nowIso)
      .order('end_date', { ascending: true })
      .range(0, 199);

    if (error) {
      throw error;
    }

    const ids = (markets || []).map((m) => m.id);
    const optionsMap: Record<number, Array<{ id: number; name: string }>> = {};

    if (ids.length > 0) {
      const { data: options, error: optError } = await supabase
        .from('market_options')
        .select('id, name, market_id')
        .in('market_id', ids);

      if (!optError && options) {
        for (const opt of options as Array<{ id: number; name: string; market_id: number }>) {
          const bucket = optionsMap[opt.market_id];
          if (!bucket) {
            optionsMap[opt.market_id] = [{ id: opt.id, name: opt.name }];
          } else {
            bucket.push({ id: opt.id, name: opt.name });
          }
        }
      }
    }

    const enriched = (markets || []).map((m) => ({
      ...m,
      options: optionsMap[m.id] || [],
    }));

    return res.status(200).json({ data: enriched });
  } catch (error) {
    console.error('getDueResolutions failed', error);
    return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

export const reviewMarket = async (req: AuthRequest, res: Response) => {
  try {
    const marketId = Number(req.params.id);
    if (!Number.isInteger(marketId) || marketId <= 0) {
      return res.status(400).json({ error: 'Invalid market id.' });
    }

    const action = typeof req.body?.action === 'string' ? req.body.action.trim().toLowerCase() : '';
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action. Use approve or reject.' });
    }

    const nextStatus = action === 'approve' ? 'active' : 'rejected';

    const { data, error } = await supabase
      .from('markets')
      .update({
        status: nextStatus,
      })
      .eq('id', marketId)
      .select('id, title, status')
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: `Market ${action}d successfully.`,
      data,
      action_history: {
        action,
        acted_by: req.user?.id || null,
        acted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('reviewMarket(admin) failed', error);
    return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

export const resolveMarket = async (req: AuthRequest, res: Response) => {
  try {
    const marketId = Number(req.params.id);
    if (!Number.isInteger(marketId) || marketId <= 0) {
      return res.status(400).json({ error: 'Invalid market id.' });
    }

    const payload = (req.body || {}) as ResolvePayload;
    const resolvedOptionId = Number(payload.resolved_option_id);
    const evidenceUrl = typeof payload.resolution_evidence_url === 'string' ? payload.resolution_evidence_url.trim() : '';
    const resolutionNote = typeof payload.resolution_note === 'string' ? payload.resolution_note.trim() : '';

    if (!Number.isInteger(resolvedOptionId) || resolvedOptionId <= 0) {
      return res.status(422).json({ error: 'resolved_option_id is required and must be a positive integer.' });
    }

    if (!evidenceUrl) {
      return res.status(422).json({ error: 'resolution_evidence_url is required.' });
    }

    if (!resolutionNote) {
      return res.status(422).json({ error: 'resolution_note is required.' });
    }

    const challengeWindow =
      toIsoOrNull(payload.challenge_window_ends_at) ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const resolutionPatch: Record<string, unknown> = {
      status: 'finalized',
      resolved_option_id: resolvedOptionId,
      resolved_by: req.user?.id || null,
      resolved_at: new Date().toISOString(),
      resolution_evidence_url: evidenceUrl,
      resolution_note: resolutionNote,
      challenge_window_ends_at: challengeWindow,
    };

    let data: unknown = null;

    const fullPatchResult = await supabase
      .from('markets')
      .update(resolutionPatch)
      .eq('id', marketId)
      .select('id, title, status')
      .single();

    if (fullPatchResult.error) {
      const fallbackResult = await supabase
        .from('markets')
        .update({ status: 'finalized' })
        .eq('id', marketId)
        .select('id, title, status')
        .single();

      if (fallbackResult.error) {
        throw fallbackResult.error;
      }

      data = fallbackResult.data;
    } else {
      data = fullPatchResult.data;
    }

    // Distribute winnings to winning users
    (async () => {
      const { error: payoutError } = await supabaseAdmin.rpc('handle_market_resolution', {
        p_market_id: marketId,
        p_resolved_option_id: resolvedOptionId,
      });
      if (payoutError) {
        console.error('handle_market_resolution RPC failed:', payoutError);
      }
    })();

    // Create resolution notifications asynchronously (non-blocking side effect)
    (async () => {
      const notifResult = await notificationDbService.createMarketResolutionNotifications(marketId, resolvedOptionId);
      if (notifResult.error) {
        console.error('Failed to create resolution notifications:', notifResult.error);
      } else if (notifResult.count > 0) {
        // Fetch created notifications to emit realtime events
        const { data: newNotifs } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('target_path', `/marketDetails?id=${marketId}`)
          .order('created_at', { ascending: false })
          .limit(notifResult.count);

        if (newNotifs) {
          for (const notif of newNotifs as Array<{
            id: string; user_id: string; type: string; title: string;
            body: string; target_path: string; target_signature: string;
            created_at: string; is_read: boolean;
          }>) {
            emitNotificationNewEvent(notif.user_id, {
              id: notif.id,
              type: notif.type,
              title: notif.title,
              body: notif.body,
              target_path: notif.target_path,
              target_signature: notif.target_signature || '',
              created_at: notif.created_at,
              is_read: notif.is_read,
            });
          }
        }
      }
    })();

    return res.status(200).json({
      message: 'Market resolved successfully.',
      data,
      resolution: {
        resolved_option_id: resolvedOptionId,
        resolution_evidence_url: evidenceUrl,
        resolution_note: resolutionNote,
        challenge_window_ends_at: challengeWindow,
      },
      action_history: {
        action: 'resolve',
        acted_by: req.user?.id || null,
        acted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('resolveMarket(admin) failed', error);
    return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};
