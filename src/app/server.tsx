/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { env } from '~/env';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { fetchMultiPoolMarketCaps, getEthUsdPrice, getTokenBalance } from './onchain';

import { type CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { getQuote, getSwapPrice } from '~/lib/0x';
import { db } from '~/lib/db';
import Redis from 'ioredis';
import { clankerRewardsUSDAPIBatched } from '~/lib/clanker';
import { isValidCastHash } from './constants';
import { isCABlacklisted } from '~/lib/blacklist';
import { type ClankerWithDataAndBalance, type ClankerWithData, type DBClanker } from '~/lib/types';

const redis = new Redis(env.REDIS_URL);

const CACHE_EXPIRATION_SECONDS = 60; // 1 minutes

const CACHE_DISABLED = false;

async function cached(key: string): Promise<any> {
  if (CACHE_DISABLED) {
    return null;
  }
  const cachedResult = await redis.get(key);
  if (cachedResult) {
    console.log(`Cache hit for ${key}`);
    return JSON.parse(cachedResult);
  }
  return null;
}

async function cacheSet(key: string, value: any, expirationSeconds: number = CACHE_EXPIRATION_SECONDS) {
  if (CACHE_DISABLED) {
    return;
  }
  await redis.set(key, JSON.stringify(value), 'EX', expirationSeconds);
}


// Deprecated: this is being replaced with the indexer (/api/index)
export async function embueClankers(c: DBClanker[]): Promise<ClankerWithData[]> {
  c = c.filter(d => isCABlacklisted(d.contract_address) === false)
  if (c.length === 0) {
    return []
  }

  const poolAddresses = c.map(d => d.pool_address).filter(h => h !== null)
  const castHashes = c.map(d => d.cast_hash).filter(h => h !== null)

  const [mcaps, casts, rewards] = await Promise.all([
    fetchMultiPoolMarketCaps(c),
    fetchCastsNeynar(castHashes),
    clankerRewardsUSDAPIBatched(poolAddresses)
  ])

  const res = c.map((clanker, i) => {
    return {
      id: clanker.id,
      created_at: clanker.created_at.toString(),
      tx_hash: clanker.tx_hash,
      contract_address: clanker.contract_address,
      requestor_fid: clanker.requestor_fid,
      name: clanker.name,
      symbol: clanker.symbol,
      img_url: clanker.img_url,
      pool_address: clanker.pool_address,
      cast_hash: clanker.cast_hash,
      type: clanker.type ?? "unknown",
      marketCap: mcaps[clanker.pool_address]?.marketCap ?? -1,
      priceUsd: mcaps[clanker.pool_address]?.usdPrice ?? -1,
      rewardsUSD: rewards[clanker.pool_address] ?? -1,
      decimals: mcaps[clanker.pool_address]?.decimals ?? -1,
      cast: casts.find(c => c.hash === clanker.cast_hash) ?? null,
      creator: mcaps[clanker.pool_address]?.owner ?? undefined,
      nsfw: clanker.nsfw,
      volume24h: clanker.i_24h_volume ?? undefined
    }
  })
  return res
}

export async function serverFetchSwapQuote(userAddress: string, tokenAddress: string, amount: number, isSell: boolean, refAddress?: string) {
  console.log(`Fetching swap quote for token address: ${tokenAddress}, amount: ${amount}, isSell: ${isSell}`)
  return await getQuote(userAddress, tokenAddress, amount, isSell, refAddress)
}

export async function serverFetchSwapPrice(userAddress: string, tokenAddress: string, amount: number, isSell: boolean) {
  console.log(`Fetching swap price for token address: ${tokenAddress}, amount: ${amount}, isSell: ${isSell}`)
  return await getSwapPrice(userAddress, tokenAddress, amount, isSell)
}

export async function serverEthUSDPrice() {
  return getEthUsdPrice()
}

export async function serverFetchPortfolio(address: string): Promise<ClankerWithDataAndBalance[]> {
  const DUST_THRESHOLD = 0.0001

  const balances = await getTokenBalance(address)
  const contract_addresses = Object
    .entries(balances)
    .filter((e) => e[1] > DUST_THRESHOLD)
    .map((e) => e[0].toLowerCase())

  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: contract_addresses
      },
    }
  })

  const embued = await embueClankers(dbClankers)
  return embued
    .map((c) => ({ ...c, balance: balances[c.contract_address] ?? 0 }))
    .sort((a, b) => { 
      const aUsd = a.priceUsd * a.balance / 10**a.decimals
      const bUsd = b.priceUsd * b.balance / 10**b.decimals
      
      return bUsd - aUsd 
    })
}

export async function serverFetchBalance(address?: string) {
  return await getTokenBalance(address)
}

export async function serverFetchHotClankers(num?: number): Promise<ClankerWithData[]> {
  const cacheKey = `hotclankers-15`;
  if (num === undefined) {
    const cachedResult = await cached(cacheKey);
    if (cachedResult) {
      return cachedResult
    }
  }

  const updateThreshold = new Date(Date.now() - 1000 * 60 * 60 * 2)
  const dbClankers = await db.clanker.findMany({
    where: {
      i_volume_updated_at: {
        gte: updateThreshold
      }
    },
    orderBy: {
      i_24h_volume: 'desc'
    },
    take: num ?? 20
  })

  const res: ClankerWithData[] =  dbClankers.map((c) => {
    let cast: CastWithInteractions | null = null
    if (c.i_cast !== null) {
      cast = JSON.parse(c.i_cast)
    }
    return {
      id: c.id,
      created_at: c.created_at.toString(),
      tx_hash: c.tx_hash,
      contract_address: c.contract_address,
      requestor_fid: c.requestor_fid,
      name: c.name,
      symbol: c.symbol,
      img_url: c.img_url,
      pool_address: c.pool_address,
      cast_hash: c.cast_hash,
      type: c.type ?? "unknown",
      marketCap: c.i_mcap_usd ?? 0,
      priceUsd: c.i_price_usd ?? 0,
      rewardsUSD: c.i_rewards_usd ?? 0,
      decimals: c.i_decimals ?? 18,
      cast: cast,
      nsfw: c.nsfw,
      creator: c.i_owner_address ?? undefined,
      volume24h: c.i_24h_volume ?? undefined,
      priceDiff1h: c.i_price_usd_1h_diff ?? undefined
    }
  })

  if (num === undefined) {
    await cacheSet(cacheKey, res, 60 * 10);
  }
  return res
}

export async function serverSearchClankers(query: string): Promise<ClankerWithData[]> {
  query = query.trim()
  const dbClankers = await db.clanker.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          symbol: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          contract_address: {
            contains: query,
            mode: 'insensitive',
          },
        }
      ],
    },
    take: 20
  });

  if (dbClankers.length === 0) {
    return []
  }

  const out = await embueClankers(dbClankers)
  out.sort((a, b) => b.marketCap - a.marketCap)
  return out
}

export async function serverFetchNativeCoin(): Promise<ClankerWithData> {
  const ca = "0x1d008f50fb828ef9debbbeae1b71fffe929bf317"
  return await serverFetchCAStale(ca)
}

export async function serverFetchCA(ca: string): Promise<ClankerWithData> {
  ca = ca.toLowerCase()
  const cacheKey = `clanker:${ca}`;
  const cachedResult = await cached(cacheKey);
  if (cachedResult) {
    return cachedResult
  }
  const clanker = await db.clanker.findFirst({
    where: {
      contract_address: ca,
    },
  });
  if (!clanker) {
    throw new Error("CA not found in database")
  }
  const embued = await embueClankers([clanker])
  if (embued.length !== 1) {
    throw new Error("Failed to fetch clanker data")
  }
  await cacheSet(cacheKey, embued[0]!, CACHE_EXPIRATION_SECONDS);
  return embued[0]!
}

export async function serverFetchCAStale(ca: string): Promise<ClankerWithData> {
  ca = ca.toLowerCase().trim()
  const c = await db.clanker.findFirst({
    where: {
      contract_address: ca,
    }
  })

  if (!c) {
    throw new Error(`Clanker not found: ${ca}`)
  }
  return {
    id: c.id,
    created_at: c.created_at.toString(),
    tx_hash: c.tx_hash,
    contract_address: c.contract_address,
    requestor_fid: c.requestor_fid,
    name: c.name,
    symbol: c.symbol,
    img_url: c.img_url,
    pool_address: c.pool_address,
    cast_hash: c.cast_hash,
    type: c.type ?? "unknown",
    marketCap: c.i_mcap_usd ?? 0,
    priceUsd: c.i_price_usd ?? 0,
    rewardsUSD: c.i_rewards_usd ?? 0,
    decimals: c.i_decimals ?? 18,
    cast: c.i_cast ? JSON.parse(c.i_cast) : null,
    nsfw: c.nsfw,
    creator: c.i_owner_address ?? undefined,
    volume24h: c.i_24h_volume ?? undefined,
    priceDiff1h: c.i_price_usd_1h_diff ?? undefined
  }
}

export async function serverFetchTopClankers(clankfun?: boolean): Promise<ClankerWithData[]> {
  const cacheKey = clankfun ? `topclankers-cf-14` : `topclankers-14`;
  const cachedResult = await cached(cacheKey);
  if (cachedResult) {
    return cachedResult
  }

  const dbClankers = await db.clanker.findMany({
    where: {
      i_updated_at: {
        not: null
      },
      cast_hash: clankfun ? {
        equals: 'clank.fun deployment'
      } : undefined,
      i_mcap_usd: {
        gt: 0
      }
    },
    orderBy: {
      i_mcap_usd: 'desc'
    },
    take: 20
  })

  const res: ClankerWithData[] =  dbClankers.map((c) => {
    let cast: CastWithInteractions | null = null
    if (c.i_cast !== null) {
      cast = JSON.parse(c.i_cast)
    }
    return {
      id: c.id,
      created_at: c.created_at.toString(),
      tx_hash: c.tx_hash,
      contract_address: c.contract_address,
      requestor_fid: c.requestor_fid,
      name: c.name,
      symbol: c.symbol,
      img_url: c.img_url,
      pool_address: c.pool_address,
      cast_hash: c.cast_hash,
      type: c.type ?? "unknown",
      marketCap: c.i_mcap_usd ?? 0,
      priceUsd: c.i_price_usd ?? 0,
      rewardsUSD: c.i_rewards_usd ?? 0,
      decimals: c.i_decimals ?? 18,
      cast: cast,
      creator: c.i_owner_address ?? undefined,
      nsfw: c.nsfw,
      volume24h: c.i_24h_volume ?? undefined
    }
  })

  await cacheSet(cacheKey, res, 60 * 10);
  return res
}

export async function serverFetchLatest3hVolume(): Promise<ClankerWithData[]> {
  const launchThreshold = new Date(Date.now() - 1000 * 60 * 60 * 3)
  const dbClankers = await db.clanker.findMany({
    where: {
      created_at: {
        gte: launchThreshold
      },
      i_mcap_usd: {
        gt: 0
      },
      i_24h_volume: {
        gt: 0
      }
    },
    orderBy: {
      i_24h_volume: 'desc'
    },
    take: 30
  })
  console.log(`Found ${dbClankers.length} clankers with updated volume in the last 3 hours`)

  const res: ClankerWithData[] =  dbClankers.map((c) => {
    let cast: CastWithInteractions | null = null
    if (c.i_cast !== null) {
      cast = JSON.parse(c.i_cast)
    }
    return {
      id: c.id,
      created_at: c.created_at.toString(),
      tx_hash: c.tx_hash,
      contract_address: c.contract_address,
      requestor_fid: c.requestor_fid,
      name: c.name,
      symbol: c.symbol,
      img_url: c.img_url,
      pool_address: c.pool_address,
      cast_hash: c.cast_hash,
      type: c.type ?? "unknown",
      marketCap: c.i_mcap_usd ?? 0,
      priceUsd: c.i_price_usd ?? 0,
      rewardsUSD: c.i_rewards_usd ?? 0,
      decimals: c.i_decimals ?? 18,
      cast: cast,
      creator: c.i_owner_address ?? undefined,
      nsfw: c.nsfw,
      volume24h: c.i_24h_volume ?? undefined,
      priceDiff1h: c.i_price_usd_1h_diff ?? undefined
    }
  })

  return res
}

export async function serverFetchLatestClankers(cursor?: number): Promise<{ data: ClankerWithData[], nextCursor?: number }> {
  const PAGE_SIZE = 12
  const clankers = await db.clanker.findMany({
    take: PAGE_SIZE,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      created_at: 'desc'
    }
  })

  const nextCursor = clankers.length === PAGE_SIZE ? clankers[clankers.length - 1]!.id : undefined;

  const out = await embueClankers(clankers)
  return {
    data: out,
    nextCursor,
  }
}

export async function fetchParentCast(hash: string) {
  const neynar = new NeynarAPIClient(env.NEYNAR_API_KEY);
  const casts = await neynar.fetchBulkCasts([hash])
  if (casts.result.casts.length === 0) {
    return undefined
  }
  return casts.result.casts[0]
}

export async function fetchCastsNeynar(hashes: string[]) {
  hashes = hashes.filter(h => isValidCastHash(h))
  if (hashes.length === 0) {
    return []
  }
  const neynar = new NeynarAPIClient(env.NEYNAR_API_KEY);
  try {
    console.log(`Fetching ${hashes.length} casts from Neynar`)
    console.log("Hashes: ", hashes)
    const castData = (await neynar.fetchBulkCasts(hashes)).result.casts
    return castData
  } catch (e) {
    console.error(JSON.stringify(e, null, 2))
    return []
  }
}