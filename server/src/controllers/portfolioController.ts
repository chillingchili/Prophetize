// ============================================================
// portfolioController.ts — HTTP handlers for portfolio routes
// ============================================================

import { Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { AuthRequest } from '../types/authRequest';
import {
  getPortfolioSummary,
  getNetWorthHistory,
  getMarketPosition,
  getPositions,
  getTransactionHistory,
} from '../services/portfolioService';
import { PositionTab, SortBy, TimeRange } from '../types/portfolio';

// ─────────────────────────────────────────────────────────────
// GET /portfolio/summary
// Returns: username, avatar, joined, balance,
//          positions_value, net_worth, biggest_win, predictions_count
//
// Postman: GET http://localhost:3000/portfolio/summary
//          Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const summary = await getPortfolioSummary(userId);
    return res.status(200).json(summary);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /portfolio/chart?range=1D|1W|1M|ALL
// Returns: array of { snapshot_date, net_worth, period }
//
// Postman: GET http://localhost:3000/portfolio/chart?range=1M
//          Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
export const getChart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const range = (req.query.range as TimeRange) || 'ALL';

    const validRanges: TimeRange[] = ['1D', '1W', '1M', 'ALL'];
    if (!validRanges.includes(range)) {
      return res.status(400).json({ error: "Invalid range. Use '1D', '1W', '1M', or 'ALL'." });
    }

    const history = await getNetWorthHistory(userId, range);
    return res.status(200).json(history);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /portfolio/positions?tab=active|closed&search=&sort=value|pl|newest
// Returns: array of enriched position cards
//
// Postman: GET http://localhost:3000/portfolio/positions?tab=active&sort=pl
//          GET http://localhost:3000/portfolio/positions?tab=closed&search=patriots
//          Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
export const getPositionsList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const tab = (req.query.tab as PositionTab) || 'active';
    const search = (req.query.search as string) || '';
    const sort = (req.query.sort as SortBy) || 'newest';

    const validTabs: PositionTab[] = ['active', 'closed'];
    const validSorts: SortBy[] = ['value', 'pl', 'newest'];

    if (!validTabs.includes(tab)) {
      return res.status(400).json({ error: "Invalid tab. Use 'active' or 'closed'." });
    }
    if (!validSorts.includes(sort)) {
      return res.status(400).json({ error: "Invalid sort. Use 'value', 'pl', or 'newest'." });
    }

    const positions = await getPositions(userId, tab, search, sort);
    return res.status(200).json(positions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /portfolio/activity
// Returns: full chronological transaction history
//
// Postman: GET http://localhost:3000/portfolio/activity
//          Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
export const getActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const transactions = await getTransactionHistory(userId);
    return res.status(200).json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMarketPositionByMarketId = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const marketIdRaw = req.params.marketId;
    const marketId = Number(marketIdRaw);

    if (!Number.isInteger(marketId) || marketId <= 0) {
      return res.status(400).json({ error: 'Invalid marketId' });
    }

    const snapshot = await getMarketPosition(userId, String(marketId));

    // Compute P&L for resolved markets
    let realizedPL: number | null = null;
    const { data: marketData } = await supabase
      .from('markets')
      .select('status, resolved_option_id')
      .eq('id', marketId)
      .maybeSingle();

    if (marketData && marketData.status === 'finalized' && marketData.resolved_option_id !== null) {
      const winningOptionId = Number(marketData.resolved_option_id);
      realizedPL = 0;
      for (const opt of snapshot.options) {
        const shares = opt.shares_owned;
        const avgEntry = opt.avg_entry_price;
        const isWinner = Number(opt.option_id) === winningOptionId;
        if (isWinner) {
          realizedPL += shares * (1 - avgEntry);
        } else {
          realizedPL -= shares * avgEntry;
        }
      }
    }

    // Fallback path: if direct aggregation returns zero but active positions exist,
    // derive total from enriched positions query to avoid false zeros.
    if (snapshot.total_shares <= 0) {
      const activePositions = await getPositions(userId, 'active', '', 'newest');
      const marketPositions = activePositions.filter((position) => String(position.market_id) === String(marketId));
      if (marketPositions.length > 0) {
        const totalShares = marketPositions.reduce((sum, position) => sum + Number(position.shares_owned || 0), 0);
        const latestUpdatedAt = marketPositions
          .map((position) => position.updated_at)
          .filter((value): value is string => Boolean(value))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

        return res.status(200).json({
          data: {
            ...snapshot,
            total_shares: totalShares,
            updated_at: latestUpdatedAt,
          },
          realized_pl: realizedPL,
        });
      }
    }

    return res.status(200).json({ data: snapshot, realized_pl: realizedPL });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};