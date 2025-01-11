
export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { env } from '~/env';
import { db } from '~/lib/db';
import { fetchGraphUniswapBaseData } from '~/lib/index/uniswapGraph';

// There is a block every 2 seconds. 
function blocksAgo(block: number, agoSeconds: number): number {
  return block - Math.floor(agoSeconds / 2);
}

async function getLatestBlock(): Promise<number> {
  const url = `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const body = JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "eth_blockNumber",
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  })
  const data = await res.json()
  return parseInt(data.result, 16);
}

// Takes all the clankers that were indexed in the 24 hours (i.e. traded in last 24h)
// Then fetches and updates their volume data.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const block = await getLatestBlock()
  const block24hAgo = blocksAgo(block, 24 * 60 * 60)

  const toIndex = await db.clanker.findMany({
    where: {
      i_updated_at: {
        gt: oneDayAgo
      }
    },
  })

  // Process in batches of 20
  const batches = [];
  for (let i = 0; i < toIndex.length; i += 50) {
    batches.push(toIndex.slice(i, i + 50));
  }

  let i = 0
  for (const batch of batches) {
    console.log(`Processing batch ${i + 1} of ${batches.length}`);
    const cas = batch.map((c) => c.contract_address.toLowerCase());

    const latest = await fetchGraphUniswapBaseData(cas);
    const dayAgo = await fetchGraphUniswapBaseData(cas, block24hAgo);

    const promises = [];
    for (const clanker of batch) {
      const token = latest.find((t: any) => t.ca === clanker.contract_address);
      const token24hAgo = dayAgo.find((t: any) => t.ca === clanker.contract_address);

      if (!token || !token24hAgo) {
        console.log(`No graph data found for ${clanker.contract_address}`);
        continue
      }

      promises.push((async () => {
        try {
          await db.clanker.update({
            where: {
              contract_address: clanker.contract_address
            },
            data: {
              i_volume_updated_at: new Date(),
              i_24h_volume: token.volumeUSD - token24hAgo.volumeUSD
            }
          })
        } catch(e) {
          console.error(`Failed to update ${clanker.contract_address}`);
          console.error(e);
        }
      })())

      console.log(`Updating batch ${i + 1} of ${batches.length}`);
      await Promise.all(promises);
      console.log(`Updated batch ${i + 1} of ${batches.length}`);
    }

    i++
  }

  return NextResponse.json({ success: toIndex.length });
}
