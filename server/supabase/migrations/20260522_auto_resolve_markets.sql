-- Migration: auto-resolution of expired markets via pg_cron
--
-- Creates a database function that finds expired markets and resolves
-- them automatically, then schedules it via pg_cron.
--
-- Requirements:
--   1. pg_cron extension must be enabled via Supabase dashboard
--      (Project Settings → Database → Extensions → enable pg_cron)
--   2. The handle_market_resolution RPC must exist (from 20260521 migration)

-- 1. Auto-resolve expired markets function
CREATE OR REPLACE FUNCTION auto_resolve_expired_markets()
RETURNS TABLE(
  market_id BIGINT,
  market_title TEXT,
  resolved_option_id BIGINT,
  resolution TEXT,
  error TEXT
) AS $$
DECLARE
  market_record RECORD;
  option_record RECORD;
  max_shares NUMERIC;
  total_trades NUMERIC;
  resolved_option_id BIGINT;
  resolution_text TEXT;
  error_text TEXT;
BEGIN
  FOR market_record IN
    SELECT id, title
    FROM markets
    WHERE status = 'active'
      AND end_date < NOW()
    ORDER BY end_date ASC
  LOOP
    BEGIN
      -- Find the option with the most shares
      SELECT
        mo.id AS option_id,
        COALESCE(SUM(up.shares_owned), 0) AS total_shares
      INTO option_record
      FROM market_options mo
      LEFT JOIN user_positions up ON up.market_option_id = mo.id
      WHERE mo.market_id = market_record.id
      GROUP BY mo.id
      ORDER BY total_shares DESC
      LIMIT 1;

      max_shares := option_record.total_shares;
      resolved_option_id := NULL;
      resolution_text := 'skipped';
      error_text := NULL;

      IF max_shares = 0 THEN
        -- No trades on this market — log and skip
        resolution_text := 'no_trades';
        RAISE NOTICE 'auto_resolve: market "%" skipped (no trades)', market_record.title;
      ELSE
        -- Check for ties: is the top option unique?
        SELECT COUNT(*) INTO total_trades
        FROM (
          SELECT mo.id
          FROM market_options mo
          LEFT JOIN user_positions up ON up.market_option_id = mo.id
          WHERE mo.market_id = market_record.id
          GROUP BY mo.id
          HAVING COALESCE(SUM(up.shares_owned), 0) = max_shares
        ) AS tied_options;

        IF total_trades > 1 THEN
          -- Tie — log and skip for admin intervention
          resolution_text := 'tie';
          RAISE NOTICE 'auto_resolve: market "%" skipped (tie — % options tied)', market_record.title, total_trades;
        ELSE
          -- Clear winner — resolve
          resolved_option_id := option_record.option_id;

          PERFORM handle_market_resolution(market_record.id, resolved_option_id);

          resolution_text := 'resolved';
          RAISE NOTICE 'auto_resolve: market "%" resolved to option %', market_record.title, resolved_option_id;
        END IF;
      END IF;

      -- Return row
      market_id := market_record.id;
      market_title := market_record.title;
      resolved_option_id := COALESCE(resolved_option_id, 0);
      resolution := resolution_text;
      error := error_text;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      market_id := market_record.id;
      market_title := market_record.title;
      resolved_option_id := 0;
      resolution := 'error';
      error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule via pg_cron (runs every hour)
-- Note: Requires pg_cron extension to be enabled
SELECT cron.schedule(
  'auto-resolve-markets',
  '0 * * * *',
  $$SELECT auto_resolve_expired_markets()$$
);
