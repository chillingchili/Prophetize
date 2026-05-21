-- Migration: fix payout pipeline
--
-- Changes:
-- 1. Drop existing transactions_type_check constraint (BUY, SELL) and recreate allowing BUY, SELL, PAYOUT, LOSS
-- 2. Add resolved_by (uuid FK) and resolved_at (timestamptz) columns to markets table
-- 3. Replace handle_market_resolution function with corrected payout formula and transaction types
--    - Winner: payout = FLOOR(shares_owned * 1.0, 2) — full stake returned, floored to 2dp
--    - Winner transaction type = 'PAYOUT' (not 'RESOLUTION')
--    - Loser transaction type = 'LOSS' (not 'RESOLUTION'), amount = 0.0
--
-- Safe to run: all operations use IF EXISTS / IF NOT EXISTS / CREATE OR REPLACE

-- 1. Fix check constraint to allow PAYOUT and LOSS
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('BUY', 'SELL', 'PAYOUT', 'LOSS'));

-- 2. Add missing columns to markets table
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);

ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- 3. Replace handle_market_resolution with corrected payout logic
CREATE OR REPLACE FUNCTION handle_market_resolution(
  p_market_id BIGINT,
  p_resolved_option_id BIGINT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  option_ids BIGINT[];
  rec RECORD;
  payout NUMERIC;
BEGIN
  SELECT ARRAY_AGG(id) INTO option_ids
  FROM market_options
  WHERE market_id = p_market_id;

  -- Winners: receive full stake as payout (not profit)
  FOR rec IN
    SELECT up.user_id, up.shares_owned, up.market_option_id
    FROM user_positions up
    WHERE up.market_option_id = p_resolved_option_id AND up.shares_owned > 0
  LOOP
    payout := TRUNC(rec.shares_owned * 1.0, 2);
    UPDATE profiles SET balance = balance + payout WHERE id = rec.user_id;
    INSERT INTO transactions (user_id, market_option_id, type, shares, price_at_time, amount)
    VALUES (rec.user_id, rec.market_option_id, 'PAYOUT', rec.shares_owned, 1.0, payout);
    DELETE FROM user_positions WHERE user_id = rec.user_id AND market_option_id = rec.market_option_id;
  END LOOP;

  -- Losers: record LOSS transaction, clear positions
  FOR rec IN
    SELECT up.user_id, up.shares_owned, up.market_option_id
    FROM user_positions up
    WHERE up.market_option_id = ANY(option_ids) AND up.market_option_id <> p_resolved_option_id AND up.shares_owned > 0
  LOOP
    INSERT INTO transactions (user_id, market_option_id, type, shares, price_at_time, amount)
    VALUES (rec.user_id, rec.market_option_id, 'LOSS', rec.shares_owned, 0.0, 0.0);
    DELETE FROM user_positions WHERE user_id = rec.user_id AND market_option_id = rec.market_option_id;
  END LOOP;
END;
$$;
