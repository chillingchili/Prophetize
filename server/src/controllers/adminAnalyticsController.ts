import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';

export const getOperationsAnalytics = async (_req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [pendingRes, dueRes, resolvedRes] = await Promise.all([
      supabase.from('markets').select('id, created_at', { count: 'exact' }).eq('status', 'pending').range(0, 199),
      supabase
        .from('markets')
        .select('id, end_date', { count: 'exact' })
        .in('status', ['active', 'resolving'])
        .lte('end_date', nowIso)
        .range(0, 199),
      supabase
        .from('markets')
        .select('id, updated_at', { count: 'exact' })
        .in('status', ['finalized', 'resolved'])
        .gte('updated_at', oneDayAgo)
        .range(0, 199),
    ]);

    if (pendingRes.error || dueRes.error || resolvedRes.error) {
      throw pendingRes.error || dueRes.error || resolvedRes.error;
    }

    return res.status(200).json({
      data: {
        pending_count: pendingRes.count || 0,
        due_resolution_count: dueRes.count || 0,
        resolved_last_24h: resolvedRes.count || 0,
        throughput: [
          { label: 'Pending', value: pendingRes.count || 0 },
          { label: 'Due', value: dueRes.count || 0 },
          { label: 'Resolved 24h', value: resolvedRes.count || 0 },
        ],
      },
    });
  } catch (error) {
    console.error('getOperationsAnalytics failed', error);
    return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

export const getConflictAnalytics = async (_req: Request, res: Response) => {
  try {
    const [openRes, closedRes] = await Promise.all([
      supabase
        .from('markets')
        .select('id', { count: 'exact' })
        .in('status', ['disputed', 'challenged'])
        .range(0, 199),
      supabase
        .from('markets')
        .select('id', { count: 'exact' })
        .in('status', ['finalized', 'resolved'])
        .range(0, 199),
    ]);

    if (openRes.error || closedRes.error) {
      throw openRes.error || closedRes.error;
    }

    return res.status(200).json({
      data: {
        open_conflicts: openRes.count || 0,
        closed_conflicts: closedRes.count || 0,
        outcomes: [
          { label: 'Uphold', value: 0 },
          { label: 'Dismiss', value: 0 },
        ],
      },
    });
  } catch (error) {
    console.error('getConflictAnalytics failed', error);
    return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};
