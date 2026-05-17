import { Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { AuthRequest } from '../types/authRequest';

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
    const { data, error } = await supabase
      .from('markets')
      .select('id, title, category, status, end_date')
      .in('status', ['active', 'resolving'])
      .lte('end_date', nowIso)
      .order('end_date', { ascending: true })
      .range(0, 199);

    if (error) {
      throw error;
    }

    return res.status(200).json({ data: data || [] });
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
