import { fetchTokenOwner } from "~/app/onchain";
import { db } from "../db";
import { fetchGeckoAPIBatch } from "../gecko";
import { type DBClanker, type UIClanker } from "../types";
import { fetchCastsNeynar } from "~/app/server";
import { clankerRewardsUSDAPI } from "../clanker";

async function fetchLiveData(clanker: DBClanker): Promise<UIClanker> {
  // Fetch pool data from Gecko API
  async function fetchGeckoData(c: DBClanker) {
    const poolData = await fetchGeckoAPIBatch([c.pool_address]);
    if (poolData.length === 0) {
      return null;
    }
    return poolData[0];
  }

  async function fetchCast(c: DBClanker) {
    if (!c.cast_hash?.startsWith('0x')) {
      return null;
    }

    const res = await fetchCastsNeynar([c.cast_hash]);
    return res[0];
  }

  const [poolData, cast, owner, rewards] = await Promise.all([
    fetchGeckoData(clanker),
    fetchCast(clanker),
    fetchTokenOwner(clanker),
    clankerRewardsUSDAPI(clanker.pool_address)
  ])

  const priceUsd = parseFloat(poolData?.attributes.base_token_price_usd ?? '0');
  const priceDiff = parseFloat(poolData?.attributes.price_change_percentage.h1 ?? '0');
  let mcapUsd = parseFloat(poolData?.attributes.market_cap_usd ?? '0');
  // Coingecko returns null for many smaller market caps. Calculate it based on supply instead.
  if (mcapUsd === 0 && (clanker.type === 'clanker_v2' || clanker.type === 'clanker_v3')) {
    mcapUsd = priceUsd * 100000000000;
  }
  const dayVolume = parseFloat(poolData?.attributes.volume_usd.h24 ?? "0")

  return {
    id: clanker.id,
    created_at: clanker.created_at.toISOString(),
    tx_hash: clanker.tx_hash,
    contract_address: clanker.contract_address,
    requestor_fid: clanker.requestor_fid,
    name: clanker.name,
    symbol: clanker.symbol,
    img_url: clanker.img_url,
    pool_address: clanker.pool_address,
    cast_hash: clanker.cast_hash,
    type: clanker.type ?? "N/A",
    cast: cast ?? null,
    creator: owner ?? undefined,
    nsfw: clanker.nsfw,

    decimals: clanker.i_decimals ?? 0,
    priceUsd: priceUsd,
    marketCap: mcapUsd,
    priceDiff1h: priceDiff,
    volume24h: dayVolume,
    rewardsUSD: rewards
  }
}

export async function indexBatch(contractAddresses: string[]) {
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
      const priceDiff = parseFloat(poolData?.attributes.price_change_percentage.h1 ?? '0');
      let mcapUsd = parseFloat(poolData?.attributes.market_cap_usd ?? '0');
      // Coingecko returns null for many smaller market caps. Calculate it based on supply instead.
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
          i_price_usd_1h_diff: priceDiff,
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