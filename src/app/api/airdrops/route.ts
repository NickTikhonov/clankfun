export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '~/lib/db';
import { fetchGraphUniswapBaseData } from '~/lib/index/uniswapGraph';
import { formatPrice } from '~/lib/utils';

export async function GET(request: Request) {
  const data = await db.tradeReferral.findMany({});
  const wallets = [...new Set(data.map((d) => d.walletAddress))];

  // const clankfunClankers = await db.clanker.findMany({
  //   where: {
  //     cast_hash: {
  //       contains: 'clank.fun'
  //     },
  //     i_updated_at: {
  //       not: null
  //     }
  //   },
  // });

  // console.log(`Found ${clankfunClankers.length} clankers`);

  // // Process 50 batches at once
  // const batches = [];
  // for (let i = 0; i < clankfunClankers.length; i += 50) {
  //   batches.push(clankfunClankers.slice(i, i + 50));
  // }

  // let total = 0
  // for (const batch of batches) {
  //   console.log(`Processing batch of ${batch.length} clankers`);
  //   const data = await fetchGraphUniswapBaseData(batch.map((c) => c.contract_address));
    
  //   for (const item of data) {
  //     const volume = item.volumeUSD
  //     console.log(`Volume ${volume}`);
  //     total += volume
  //   }
  // }

  // console.log(`Total volume ${formatPrice(total)}`, total);
  return NextResponse.json({ total: wallets.length, wallets });
}
