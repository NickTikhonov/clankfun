export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { embueClankers } from '~/app/server';
import { env } from '~/env';
import { db } from '~/lib/db';
import { fetchGraphUniswapBaseData } from '~/lib/index/uniswapGraph';

/**
 * Index API
 * 
 * This API is called by the realtime service to sync latest information for clankers that were traded in a specified time window.
 */
const INDEX_INTERVAL_SECONDS = 60 * 5

const RequestSchema = z.object({
  contractAddresses: z.array(z.string())
})

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const requestBody = await request.json();
  const validatedRequestBody = RequestSchema.safeParse(requestBody);
  if (!validatedRequestBody.success) {
    return NextResponse.json({ error: validatedRequestBody.error.issues }, { status: 400 });
  }

  let contractAddresses = validatedRequestBody.data.contractAddresses.map(address => address.toLowerCase());
  contractAddresses = [...new Set(contractAddresses)]; // Deduplicate

  const batches = [];
  for (let i = 0; i < contractAddresses.length; i += 10) {
    batches.push(contractAddresses.slice(i, i + 10));
  }

  const batchPromises = batches.map(async (batch) => {
    await indexBatch(batch);
  });

  await Promise.all(batchPromises);

  return NextResponse.json({ success: true });
}

async function indexBatch(contractAddresses: string[]) {
  if (contractAddresses.length === 0) {
    return
  }
  if (contractAddresses.length > 10) { 
    throw new Error('Too many contract addresses')
  }
  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: contractAddresses
      }
    }
  })

  const [graphResponse, embued] = await Promise.all([
    fetchGraphUniswapBaseData(dbClankers.map(c => c.contract_address)),
    embueClankers(dbClankers)
  ]);

  for (const clanker of dbClankers) {
    try {
      const graphToken = graphResponse.find((t: any) => t.ca === clanker.contract_address);
      if (!graphToken) {
        console.log(`No graph data found for ${clanker.contract_address}`);
        continue
      }
      const embuedData = embued.find((c: any) => c.contract_address === clanker.contract_address);
      if (!embuedData) {
        console.log(`No embued data found for ${clanker.contract_address}`);
        continue
      }

      let ownerAddress = null
      if (embuedData.creator) {
        ownerAddress = embuedData.creator
      } else if (embuedData.cast?.author.verified_addresses?.eth_addresses && embuedData.cast.author.verified_addresses.eth_addresses.length > 0) {
        ownerAddress = embuedData.cast.author.verified_addresses.eth_addresses[0]
      }

      await db.clanker.update({
        where: {
          id: clanker.id
        },
        data: {
          i_mcap_usd: embuedData.marketCap,
          i_volume_usd: graphToken.volumeUSD,
          i_trades: graphToken.txCount,
          i_decimals: graphToken.decimals,
          i_price_usd: embuedData.priceUsd,
          i_rewards_usd: embuedData.rewardsUSD,
          i_cast: embuedData.cast ? JSON.stringify(embuedData.cast) : null,
          i_owner_address: ownerAddress,
          i_updated_at: new Date()
        }
      })
    } catch (e: any) {
      console.error(`Error indexing clanker ${clanker.contract_address}: ${e.message}`);
    }
  }
}