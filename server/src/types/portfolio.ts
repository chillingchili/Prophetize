// ============================================================
// portfolio.ts — Type definitions for portfolio features
// ============================================================

// --- Portfolio Summary (Profile Header) ---
export interface PortfolioSummary {
  username: string;
  avatar_url: string | null;
  joined: string;
  balance: number;
  positions_value: number;   // sum of (shares_owned * current_price) across open markets
  net_worth: number;         // balance + positions_value
  biggest_win: number;       // highest single resolution payout from transactions
  predictions_count: number; // total rows in user_positions for this user
}

// --- Enriched Position (per card in the positions list) ---
export interface EnrichedPosition {
  id: string;
  market_option_id: string;
  market_id: string;
  market_title: string;
  market_status: string;
  side: string;              // option name e.g. "Yes" / "No"
  shares_owned: number;
  avg_entry_price: number;
  current_price: number;
  position_value: number;    // shares_owned * current_price
  unrealized_pl: number;     // position_value - (shares_owned * avg_entry_price)
  unrealized_pl_pct: number; // unrealized_pl / cost_basis * 100
  opened_at: string;
  updated_at: string;
  is_winner: boolean | null; // null = not resolved yet
}

// --- Net Worth snapshot for P/L chart ---
export interface NetWorthPoint {
  snapshot_date: string;
  net_worth: number;
  period: string;
}

// --- Transaction row for Activity tab ---
export interface ActivityTransaction {
  id: string;
  market_option_id: string;
  type: string;           // 'buy' | 'sell' | 'resolution'
  shares: number;
  price_at_time: number;
  amount: number;
  created_at: string;
  option_name: string;
  market_id: string;
  market_title: string;
}

export interface MarketOptionPosition {
  option_id: string;
  option_name: string;
  shares_owned: number;
  avg_entry_price: number;
}

export interface MarketPositionSnapshot {
  market_id: string;
  total_shares: number;
  options: MarketOptionPosition[];
  updated_at: string | null;
}

// --- Query param union types ---
export type PositionTab = "active" | "closed";
export type SortBy = "value" | "pl" | "newest";
export type TimeRange = "1D" | "1W" | "1M" | "ALL";