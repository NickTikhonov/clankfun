
export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { env } from '~/env';
import { db } from '~/lib/db';
import { fetchGeckoAPIBatch } from '~/lib/gecko';

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
  const toIndex = await db.clanker.findMany({
    where: {
      i_updated_at: {
        gt: oneDayAgo
      }
    },
  })

  console.log(`Indexing 24h ${toIndex.length} clankers`);

  const batches = [];
  for (let i = 0; i < toIndex.length; i += 30) {
    batches.push(toIndex.slice(i, i + 30));
  }

  let i = 0
  for (const batch of batches) {
    console.log(`Processing batch ${i + 1} of ${batches.length}`);
    const poolAddresses = batch.map((c) => c.pool_address);
    const poolData = await fetchGeckoAPIBatch(poolAddresses);

    const promises = [];
    for (const clanker of batch) {
      const data = poolData.find((p) => p.id === `base_${clanker.pool_address.toLowerCase()}`);
      if (!data) {
        console.error(`No data found for 1h index of ${clanker.name}: pool_address(${clanker.pool_address})`);
        continue;
      }

      promises.push((async () => {
        console.log(`Updating ${clanker.name} - ${clanker.contract_address}`);
        try {
          const day_volume = parseFloat(data.attributes.volume_usd.h24 ?? "0")
          await db.clanker.update({
            where: {
              contract_address: clanker.contract_address
            },
            data: {
              i_volume_updated_at: new Date(),
              i_24h_volume: day_volume
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
