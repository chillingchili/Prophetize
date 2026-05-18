// ============================================================
// portfolioService.ts — All DB logic for portfolio features
// ============================================================

import { supabase, supabaseAdmin } from '../config/supabaseClient';
import {
  ActivityTransaction,
  EnrichedPosition,
  MarketPositionSnapshot,
  NetWorthPoint,
  PortfolioSummary,
  PositionTab,
  SortBy,
  TimeRange,
} from '../types/portfolio';

// ─────────────────────────────────────────────────────────────
// HELPER: Compute derived fields for a position
// ─────────────────────────────────────────────────────────────
function buildEnrichedPosition(raw: any): EnrichedPosition {
  const shares: number = raw.shares_owned;
  const avgEntry: number = raw.avg_entry_price;
  const currentPrice: number = raw.option_current_price;

  const position_value = shares * currentPrice;
  const cost_basis = shares * avgEntry;
  const unrealized_pl = position_value - cost_basis;
  const unrealized_pl_pct = cost_basis !== 0
    ? (unrealized_pl / cost_basis) * 100
    : 0;

  // is_winner is only meaningful once market is resolved
  let is_winner: boolean | null = null;
  if (raw.market_status === 'resolved' && raw.resolution_option_id !== null) {
    is_winner = raw.market_option_id === raw.resolution_option_id;
  }

  return {
    id: raw.id,
    market_option_id: raw.market_option_id,
    market_id: raw.market_id,
    market_title: raw.market_title,
    market_status: raw.market_status,
    side: raw.option_name,
    shares_owned: shares,
    avg_entry_price: avgEntry,
    current_price: currentPrice,
    position_value,
    unrealized_pl,
    unrealized_pl_pct,
    opened_at: raw.opened_at,
    updated_at: raw.updated_at,
    is_winner,
  };
}

// ─────────────────────────────────────────────────────────────
// A. PORTFOLIO SUMMARY
//    GET /portfolio/:userId/summary
// ─────────────────────────────────────────────────────────────
export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {

  // 1. Fetch profile row
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, avatar_url, balance, created_at')
    .eq('id', userId)
    .single();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error('Profile not found');

  // 2. Fetch all positions with their option's current_price and market status
  //    We do a two-step fetch to avoid unreliable cross-table .eq() filters:
  //    Step A — get all user_positions with joined market_options
  const { data: positions, error: posError } = await supabase
    .from('user_positions')
    .select(`
      shares_owned,
      market_option_id,
      market_options!user_positions_market_option_id_fkey(
        current_price,
        market_id,
        markets!market_options_market_id_fkey(
          status
        )
      )
    `)
    .eq('user_id', userId);

  if (posError) throw new Error(posError.message);

  // Step B — filter to only open markets in JS (safe & reliable)
  const positions_value = (positions || []).reduce((sum: number, p: any) => {
    const marketStatus = p.market_options?.markets?.status;
    if (marketStatus !== 'active') return sum; // only count open/active markets
    const price = p.market_options?.current_price ?? 0;
    return sum + p.shares_owned * price;
  }, 0);

  const net_worth = profile.balance + positions_value;

  // 3. Biggest win: highest payout from a resolution transaction
  const { data: wins, error: winError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'RESOLUTION')
    .order('amount', { ascending: false })
    .limit(1);

  if (winError) throw new Error(winError.message);
  const biggest_win = wins && wins.length > 0 ? (wins[0]?.amount ?? 0) : 0;

  // 4. Predictions count: total unique positions ever opened
  const { count, error: countError } = await supabase
    .from('user_positions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw new Error(countError.message);

  return {
    username: profile.username,
    avatar_url: profile.avatar_url,
    joined: profile.created_at,
    balance: profile.balance,
    positions_value,
    net_worth,
    biggest_win,
    predictions_count: count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────
// B. NET WORTH HISTORY (P/L Chart)
//    GET /portfolio/:userId/chart?range=1D|1W|1M|ALL
//    Uses leaderboard_snapshots (period: text, snapshot_date: date)
// ─────────────────────────────────────────────────────────────
export async function getNetWorthHistory(
  userId: string,
  range: TimeRange
): Promise<NetWorthPoint[]> {

  // Map range to the period text values stored in leaderboard_snapshots
  // Adjust these strings to match whatever your snapshot job writes
  const periodMap: Record<TimeRange, string | null> = {
    '1D': 'daily',
    '1W': 'weekly',
    '1M': 'monthly',
    'ALL': null, // no filter — return everything
  };

  const period = periodMap[range];

  let query = supabase
    .from('leaderboard_snapshots')
    .select('snapshot_date, baseline_net_worth, period')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true });

  // If not ALL, filter by period text
  if (period !== null) {
    query = query.eq('period', period);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    snapshot_date: row.snapshot_date,
    net_worth: row.baseline_net_worth,
    period: row.period,
  }));
}

// ─────────────────────────────────────────────────────────────
// C. POSITIONS LIST
//    GET /portfolio/:userId/positions?tab=active|closed&search=&sort=
// ─────────────────────────────────────────────────────────────
export async function getPositions(
  userId: string,
  tab: PositionTab,
  search: string,
  sortBy: SortBy
): Promise<EnrichedPosition[]> {

  // Fetch all positions with nested option + market data in one query
  // Using named FK hints to match your existing pattern in marketController
  const { data, error } = await supabase
    .from('user_positions')
    .select(`
      id,
      user_id,
      market_option_id,
      shares_owned,
      avg_entry_price,
      opened_at,
      updated_at,
      market_options!user_positions_market_option_id_fkey(
        name,
        current_price,
        market_id,
        markets!market_options_market_id_fkey(
          id,
          title,
          status,
          end_date,
          resolution_option_id
        )
      )
    `)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  // Determine which statuses belong to each tab
  // active tab = markets still open for trading
  // closed tab = markets that are closed, resolving, resolved, finalized, disputed
  const activeStatuses = ['active'];
  const closedStatuses = ['closed', 'resolving', 'resolved', 'disputed', 'finalized'];
  const allowedStatuses = tab === 'active' ? activeStatuses : closedStatuses;

  // Flatten nested joins + filter by tab in JS
  let rows = (data || [])
    .filter((p: any) => {
      const status = p.market_options?.markets?.status;
      return status && allowedStatuses.includes(status);
    })
    .map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      market_option_id: p.market_option_id,
      shares_owned: p.shares_owned,
      avg_entry_price: p.avg_entry_price,
      opened_at: p.opened_at,
      updated_at: p.updated_at,
      option_name: p.market_options?.name ?? '',
      option_current_price: p.market_options?.current_price ?? 0,
      market_id: p.market_options?.markets?.id ?? '',
      market_title: p.market_options?.markets?.title ?? '',
      market_status: p.market_options?.markets?.status ?? '',
      market_end_date: p.market_options?.markets?.end_date ?? '',
      resolution_option_id: p.market_options?.markets?.resolution_option_id ?? null,
    }));

  // Search filter (by market title)
  if (search && search.trim() !== '') {
    const term = search.trim().toLowerCase();
    rows = rows.filter((r: any) =>
      r.market_title.toLowerCase().includes(term)
    );
  }

  // Enrich each row with computed P/L fields
  let enriched = rows.map(buildEnrichedPosition);

  // Sort
  switch (sortBy) {
    case 'value':
      enriched.sort((a, b) => b.position_value - a.position_value);
      break;
    case 'pl':
      enriched.sort((a, b) => b.unrealized_pl - a.unrealized_pl);
      break;
    case 'newest':
    default:
      enriched.sort(
        (a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
      );
      break;
  }

  return enriched;
}

export async function getMarketPosition(
  userId: string,
  marketId: string
): Promise<MarketPositionSnapshot> {
  const parsedMarketId = Number(marketId);
  if (!Number.isInteger(parsedMarketId) || parsedMarketId <= 0) {
    return {
      market_id: String(marketId),
      total_shares: 0,
      options: [],
      updated_at: null,
    };
  }

  const { data: optionsData, error: optionsError } = await supabaseAdmin
    .from('market_options')
    .select('id, name')
    .eq('market_id', parsedMarketId);

  if (optionsError) throw new Error(optionsError.message);

  const marketOptions = (optionsData || []) as Array<{ id: number | string; name: string | null }>;
  if (marketOptions.length === 0) {
    return {
      market_id: String(parsedMarketId),
      total_shares: 0,
      options: [],
      updated_at: null,
    };
  }

  const optionIds = marketOptions
    .map((option) => Number(option.id))
    .filter((optionId) => Number.isInteger(optionId) && optionId > 0);

  if (optionIds.length === 0) {
    return {
      market_id: String(parsedMarketId),
      total_shares: 0,
      options: [],
      updated_at: null,
    };
  }

  const optionNameById = new Map<string, string>();
  for (const option of marketOptions) {
    const optionId = String(option.id ?? '').trim();
    if (!optionId) {
      continue;
    }

    optionNameById.set(optionId, String(option.name ?? 'Unknown'));
  }

  const { data: positionsData, error: positionsError } = await supabaseAdmin
    .from('user_positions')
    .select('market_option_id, shares_owned, avg_entry_price, updated_at')
    .eq('user_id', userId)
    .in('market_option_id', optionIds);

  if (positionsError) throw new Error(positionsError.message);

  const optionTotals = new Map<string, { option_name: string; shares_owned: number; total_cost: number }>();
  let latestUpdatedAt: string | null = null;

  for (const row of (positionsData || []) as Array<{ market_option_id: number | string; shares_owned: number | string; avg_entry_price: number | string; updated_at: string | null }>) {
    const optionId = String(row.market_option_id ?? '');
    if (!optionId) {
      continue;
    }

    const optionName = optionNameById.get(optionId) ?? 'Unknown';
    const sharesOwned = Number(row.shares_owned ?? 0);
    const avgPrice = Number(row.avg_entry_price ?? 0);
    const safeShares = Number.isFinite(sharesOwned) ? sharesOwned : 0;
    const safePrice = Number.isFinite(avgPrice) ? avgPrice : 0;
    const existing = optionTotals.get(optionId);

    optionTotals.set(optionId, {
      option_name: optionName,
      shares_owned: (existing?.shares_owned ?? 0) + safeShares,
      total_cost: (existing?.total_cost ?? 0) + (safeShares * safePrice),
    });

    const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;
    if (updatedAt && (!latestUpdatedAt || new Date(updatedAt) > new Date(latestUpdatedAt))) {
      latestUpdatedAt = updatedAt;
    }
  }

  const options = Array.from(optionTotals.entries()).map(([option_id, value]) => ({
    option_id,
    option_name: value.option_name,
    shares_owned: value.shares_owned,
    avg_entry_price: value.shares_owned > 0 ? value.total_cost / value.shares_owned : 0,
  }));

  const totalShares = options.reduce((sum, option) => sum + option.shares_owned, 0);

  return {
    market_id: String(parsedMarketId),
    total_shares: totalShares,
    options,
    updated_at: latestUpdatedAt,
  };
}

// ─────────────────────────────────────────────────────────────
// D. ACTIVITY — Transaction History
//    GET /portfolio/:userId/activity
// ─────────────────────────────────────────────────────────────
export async function getTransactionHistory(userId: string): Promise<ActivityTransaction[]> {

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      user_id,
      market_option_id,
      type,
      shares,
      price_at_time,
      amount,
      created_at,
      market_options!transactions_market_option_id_fkey(
        name,
        market_id,
        markets!market_options_market_id_fkey(
          id,
          title
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((t: any) => ({
    id: t.id,
    market_option_id: t.market_option_id,
    type: t.type,
    shares: t.shares,
    price_at_time: t.price_at_time,
    amount: t.amount,
    created_at: t.created_at,
    option_name: t.market_options?.name ?? '',
    market_id: t.market_options?.markets?.id ?? '',
    market_title: t.market_options?.markets?.title ?? '',
  }));
}

// ─────────────────────────────────────────────────────────────
// UTIL: Get live P/L dollar value for a user
//       Called by Socket.io when market_prices change
// ─────────────────────────────────────────────────────────────
export async function getLiveNetWorth(userId: string): Promise<number> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (profileError) throw new Error(profileError.message);

  const { data: positions, error: posError } = await supabase
    .from('user_positions')
    .select(`
      shares_owned,
      market_options!user_positions_market_option_id_fkey(
        current_price,
        markets!market_options_market_id_fkey(
          status
        )
      )
    `)
    .eq('user_id', userId);

  if (posError) throw new Error(posError.message);

  const positions_value = (positions || []).reduce((sum: number, p: any) => {
    const marketStatus = p.market_options?.markets?.status;
    if (marketStatus !== 'active') return sum;
    return sum + p.shares_owned * (p.market_options?.current_price ?? 0);
  }, 0);

  return profile.balance + positions_value;
}