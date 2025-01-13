/* eslint-disable @typescript-eslint/prefer-for-of */

export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { serverFetchLatest3hVolume } from '~/app/server';
import { env } from '~/env';
import { db } from '~/lib/db';
import { fetchGraphUniswapBaseData } from '~/lib/index/uniswapGraph';
import { postToClankfunTg } from '~/lib/telegram';
import { formatPrice } from '~/lib/utils';

// Takes all the clankers that were indexed in the 24 hours (i.e. traded in last 24h)
// Then fetches and updates their volume data.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const clankers = await serverFetchLatest3hVolume()
  const filtered = clankers.filter((c) => c.marketCap > 40000)
  if (filtered.length === 0) {
    return NextResponse.json({ success: true });
  }

  let message = "Top recent launches by market cap 👀:\n\n"
  for (let i = 0; i < filtered.length; i++) {
    const c = filtered[i]!
    message = message + `#${i + 1}: ${c.name} ($${c.symbol}) - ${formatPrice(c.marketCap)}\n`
  }

  message = message + `\n\nhttps://clank.fun/t/${filtered[0]!.contract_address.trim()}`
  await postToClankfunTg(message)
  return NextResponse.json({ success: true });
}
