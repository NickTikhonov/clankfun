/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { env } from '~/env';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import axios from 'axios';
import { fetchMultiPoolMarketCaps, getEthUsdPrice, getTokenBalance } from './onchain';

import * as z from 'zod';
import { type CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { getQuote, getSwapPrice } from '~/lib/0x';
import { getHotClankersCA, getTopClankersCA } from '~/lib/dune';
import { db } from '~/lib/db';
import Redis from 'ioredis';
import { clankerRewardsUSDAPI, clankerRewardsUSDAPIBatched } from '~/lib/clanker';
import { CLANKFUN_CAST_HASH } from './constants';
import { isCABlacklisted } from '~/lib/blacklist';

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


const ClankerSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  tx_hash: z.string(),
  contract_address: z.string(),
  requestor_fid: z.number(),
  name: z.string(),
  symbol: z.string(),
  img_url: z.string().nullable(),
  pool_address: z.string(),
  cast_hash: z.string().nullable(),
  type: z.string(),
});

export type Clanker = z.infer<typeof ClankerSchema>
export type ClankerWithData = Clanker & { 
  marketCap: number, 
  decimals: number,
  priceUsd: number,
  rewardsUSD?: number,
  cast: CastWithInteractions | null 
  creator?: string
}

export type DBClanker = {
  symbol: string;
  type: string | null;
  name: string;
  id: number;
  created_at: Date;
  tx_hash: string;
  contract_address: string;
  requestor_fid: number;
  img_url: string | null;
  pool_address: string;
  cast_hash: string | null;
  page: number;
}

async function embueClankers(c: DBClanker[]): Promise<ClankerWithData[]> {
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
      creator: mcaps[clanker.pool_address]?.owner ?? undefined
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

export type ClankerWithDataAndBalance = ClankerWithData & { balance: number }

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

export async function serverFetchHotClankers(): Promise<ClankerWithData[]> {
  const cacheKey = `hotclankers-2`;
  const cachedResult = await cached(cacheKey);
  if (cachedResult) {
    return cachedResult
  }

  const hotClankers = await getHotClankersCA()
  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: hotClankers.map(c => c.toLowerCase())
      },
    },
    orderBy: {
      contract_address: 'asc'
    },
  })

  const res = await embueClankers(dbClankers)
  await cacheSet(cacheKey, res, 60 * 10);
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
  return await serverFetchCA(ca)
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

export async function serverFetchTopClankers(): Promise<ClankerWithData[]> {
  const cacheKey = `topclankers-2`;
  const cachedResult = await cached(cacheKey);
  if (cachedResult) {
    return cachedResult
  }

  const topDune = await getTopClankersCA()
  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: topDune.map(c => c.toLowerCase())
      },
    },
    orderBy: {
      contract_address: 'asc'
    }
  })

  const res = (await embueClankers(dbClankers)).sort((a, b) => b.marketCap - a.marketCap)
  await cacheSet(cacheKey, res, 60 * 10);
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

async function fetchCastsNeynar(hashes: string[]) {
  hashes = hashes.filter(h => h !== CLANKFUN_CAST_HASH)
  if (hashes.length === 0) {
    return []
  }
  const neynar = new NeynarAPIClient(env.NEYNAR_API_KEY);
  const castData = (await neynar.fetchBulkCasts(hashes)).result.casts
  return castData
}