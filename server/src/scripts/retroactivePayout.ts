import { supabaseAdmin } from '../config/supabaseClient';

interface Market {
  id: number;
  title: string;
  resolution_option_id: number;
}

async function main(): Promise<void> {
  console.log('=== Retroactive Payout Script ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Query all finalized markets that have a resolution_option_id set
  const { data: markets, error } = await supabaseAdmin
    .from('markets')
    .select('id, title, resolution_option_id')
    .eq('status', 'finalized')
    .not('resolution_option_id', 'is', null);

  if (error) {
    console.error('Failed to query markets:', error);
    process.exit(1);
  }

  if (!markets || markets.length === 0) {
    console.log('No finalized markets with resolution_option_id found. Nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${markets.length} finalized market(s) to process.\n`);

  const typedMarkets = markets as Market[];
  let succeeded = 0;
  let failed = 0;

  for (const market of typedMarkets) {
    console.log(`Processing market ${market.id}: "${market.title}"...`);

    try {
      const { error: rpcError } = await supabaseAdmin.rpc('handle_market_resolution', {
        p_market_id: market.id,
        p_resolved_option_id: market.resolution_option_id,
      });

      if (rpcError) {
        console.error(`  FAILED: ${rpcError.message}`);
        failed++;
      } else {
        console.log(`  SUCCEEDED`);
        succeeded++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  EXCEPTION: ${message}`);
      failed++;
    }

    // Small delay between RPC calls to avoid overwhelming the database
    if (typedMarkets.indexOf(market) < typedMarkets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const total = succeeded + failed;
  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${total} market(s)`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log(`\n  ${failed} market(s) failed. Check logs above for details.`);
    process.exit(1);
  }

  console.log('\nAll markets processed successfully.');
  process.exit(0);
}

main();
