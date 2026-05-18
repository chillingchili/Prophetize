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

  FOR rec IN
    SELECT up.user_id, up.shares_owned, up.avg_entry_price, up.market_option_id
    FROM user_positions up
    WHERE up.market_option_id = p_resolved_option_id AND up.shares_owned > 0
  LOOP
    payout := rec.shares_owned * (1.0 - rec.avg_entry_price);
    UPDATE profiles SET balance = balance + payout WHERE id = rec.user_id;
    INSERT INTO transactions (user_id, market_option_id, type, shares, price_at_time, amount)
    VALUES (rec.user_id, rec.market_option_id, 'RESOLUTION', rec.shares_owned, 1.0, payout);
    DELETE FROM user_positions WHERE user_id = rec.user_id AND market_option_id = rec.market_option_id;
  END LOOP;

  FOR rec IN
    SELECT up.user_id, up.shares_owned, up.avg_entry_price, up.market_option_id
    FROM user_positions up
    WHERE up.market_option_id = ANY(option_ids) AND up.market_option_id <> p_resolved_option_id AND up.shares_owned > 0
  LOOP
    INSERT INTO transactions (user_id, market_option_id, type, shares, price_at_time, amount)
    VALUES (rec.user_id, rec.market_option_id, 'RESOLUTION', rec.shares_owned, 0.0, 0.0);
    DELETE FROM user_positions WHERE user_id = rec.user_id AND market_option_id = rec.market_option_id;
  END LOOP;
END;
$$;