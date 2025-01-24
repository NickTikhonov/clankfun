export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchTokenOwner } from '~/app/onchain';
import { DBClanker, embueClankers, fetchCastsNeynar } from '~/app/server';
import { env } from '~/env';
import { db } from '~/lib/db';
import { fetchGeckoAPIBatch } from '~/lib/gecko';
import { fetchGraphUniswapBaseData } from '~/lib/index/uniswapGraph';

/**
 * Index API
 * 
 * This API is called by the realtime service to sync latest information for clankers that were traded in a specified time window.
 */
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

  // Start indexing here
  let contractAddresses = validatedRequestBody.data.contractAddresses.map(address => address.toLowerCase());
  contractAddresses = [...new Set(contractAddresses)]; // Deduplicate

  console.log(`Indexing ${contractAddresses.length} clankers`);

  const batches = [];
  for (let i = 0; i < contractAddresses.length; i += 30) {
    batches.push(contractAddresses.slice(i, i + 30));
  }

  for (const batch of batches) {
    await indexBatch(batch);
  }

  return NextResponse.json({ success: true });
}

async function indexBatch(contractAddresses: string[]) {
  // Indexes up to 30 tokens

  if (contractAddresses.length === 0 || contractAddresses.length > 30) { 
    throw new Error('Zero or too many addresses in batch')
  }
  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: contractAddresses
      }
    }
  })

  // Fetch pool data from Gecko API
  async function fetchGeckoData(clankers: DBClanker[]) {
    const poolAddresses = dbClankers.map(c => c.pool_address);
    const poolData = await fetchGeckoAPIBatch(poolAddresses);
    return poolData;
  }

  async function fetchMissingTokenOwners(clankers: DBClanker[]) {
    const tokenOwnersMissing = await Promise.all(dbClankers.filter(c => !c.i_owner_address).map(c => ((async () => {
      const owner = await fetchTokenOwner(c);
      return {
        contract_address: c.contract_address,
        owner
      }
    })())))
    return tokenOwnersMissing;
  }

  async function fetchMissingCasts(clankers: DBClanker[]) {
    const hashes = dbClankers.filter(c => (c.cast_hash && c.cast_hash.startsWith('0x') && !c.i_cast)).map(c => c.cast_hash!)
    return await fetchCastsNeynar(hashes);
  }

  const [geckoData, missingOwners, casts] = await Promise.all([
    fetchGeckoData(dbClankers),
    fetchMissingTokenOwners(dbClankers),
    fetchMissingCasts(dbClankers)
  ])

  for (const clanker of dbClankers) {
    try {
      console.log(`Indexing clanker ${clanker.name}`);
      const cast = casts.find(c => c.hash === clanker.cast_hash);
      const poolData = geckoData.find(d => d.id === `base_${clanker.pool_address.toLowerCase()}`);
      const ownerData = missingOwners.find(o => o.contract_address === clanker.contract_address);

      const priceUsd = parseFloat(poolData?.attributes.base_token_price_usd ?? '0');
      let mcapUsd = parseFloat(poolData?.attributes.market_cap_usd ?? '0');
      if (mcapUsd === 0 && (clanker.type === 'clanker_v2' || clanker.type === 'clanker_v3')) {
        mcapUsd = priceUsd * 100000000000;
      }
      const hourTrades = (poolData?.attributes.transactions.h1.buys ?? 0) + (poolData?.attributes.transactions.h1.sells ?? 0);

      await db.clanker.update({
        where: {
          id: clanker.id
        },
        data: {
          i_price_usd: priceUsd,
          i_mcap_usd: mcapUsd,
          i_volume_usd: 0,
          i_trades: hourTrades,
          i_decimals: 18,
          i_cast: cast ? JSON.stringify(cast) : undefined,
          i_owner_address: ownerData ? ownerData.owner : undefined,
          i_updated_at: new Date(),
        }
      })

      console.log(`Updating data for ${clanker.name}`, {
        i_price_usd: priceUsd,
        i_mcap_usd: mcapUsd,
        i_volume_usd: 0,
        i_trades: hourTrades,
        i_decimals: 18,
        i_cast: cast ? JSON.stringify(cast) : undefined,
        i_owner_address: ownerData ? ownerData.owner : undefined,
        i_updated_at: new Date(),
      })
    } catch (e: any) {
      console.error(`Error indexing clanker ${clanker.contract_address}: ${e.message}`);
    }
  }
}