import axios from "axios";
import { z } from "zod";
import { db } from "./db";
import { env } from "~/env";
import { getAddress } from 'viem'

const APIClankerSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  tx_hash: z.string(),
  contract_address: z.string(),
  requestor_fid: z.number().nullable(),
  name: z.string(),
  symbol: z.string(),
  img_url: z.string().nullable(),
  pool_address: z.string(),
  cast_hash: z.string().nullable(),
  type: z.string().nullable(),
});

const APIPageSchema = z.object({
  data: z.array(APIClankerSchema),
  hasMore: z.boolean(),
  total: z.number(),
});

function deployerByType(type: string | null) {
  const _100_b = 100 * 1000 * 1000 * 1000
  const _1_b = 1 * 1000 * 1000 * 1000
  switch (type) {
    case 'clanker_v2':
      return {
        maxSupply: _100_b
      }
    case 'clanker_v3':
      return {
        maxSupply: _100_b
      }
    case 'clanker':
      return {
        maxSupply: _100_b
      }
    case 'proxy':
      return {
        maxSupply: _100_b
      }
    case 'wow':
      return {
        maxSupply: _1_b
      }
    case 'g8':
      return {
        maxSupply: _1_b
      }
    default:
      return {
        maxSupply: null
      }
  }
}

export type APIClanker = z.infer<typeof APIClankerSchema>
export type APIPage = z.infer<typeof APIPageSchema>

export async function scrapeLatestTimeRestricted(time = 1000 * 10) {
  const latestClanker = await db.clanker.findFirst({
    orderBy: {
      created_at: 'desc'
    },
    where: {
      // Sometimes we insert clankers with a page of -1
      page: {
        not: -1
      }
    }
  })
  let page = 1
  if (latestClanker) {
    page = latestClanker.page
  }

  await scrapeClankers(page, time)
}

export async function getOrScrapeByCa(ca: string) {
  const viemFormatted = getAddress(ca)
  const existing = await db.clanker.findFirst({
    where: {
      contract_address: ca.toLowerCase()
    }
  })

  if (existing) {
    return existing
  }

  const clanker = await clankerGetAPI(viemFormatted)
  if (!clanker) {
    return null
  }

  return db.clanker.upsert({
    where: {
      id: clanker.id,
    },
    create: {
      id: clanker.id,
      created_at: new Date(clanker.created_at),
      tx_hash: clanker.tx_hash,
      contract_address: clanker.contract_address.toLowerCase(),
      requestor_fid: clanker.requestor_fid ?? 0,
      name: clanker.name,
      symbol: clanker.symbol,
      img_url: clanker.img_url,
      pool_address: clanker.pool_address,
      cast_hash: clanker.cast_hash,
      type: clanker.type,
      page: -1,
      i_mcap_usd: 37000,
      i_price_usd: 37000 / 100000000000,
      i_24h_volume: 0,
    },
    update: {},
  });
}

export async function scrapeClankers(startPage: number, maxRunTimeMs = 1000 * 40) {
  const startTimeMs = Date.now()
  let page = startPage
  while(true) {
    console.log("Fetching page", page)
    const data = await clankerListAPI('asc', page)

    const clankerPromises = data.data.map(async clanker => {
      try {
        const existing = await db.clanker.findFirst({
          where: {
            id: clanker.id
          }
        })

        if (existing) {
          console.log("Skipping existing clanker", clanker.id)
          return true
        }
      } catch (e: any) {
        console.log("Failed to find", clanker.id)
        return true
      }

      try {
        await db.clanker.create({
          data: {
            id: clanker.id,
            created_at: new Date(clanker.created_at),
            tx_hash: clanker.tx_hash,
            contract_address: clanker.contract_address.toLowerCase(),
            requestor_fid: clanker.requestor_fid ?? 0,
            name: clanker.name,
            symbol: clanker.symbol,
            img_url: clanker.img_url,
            pool_address: clanker.pool_address,
            cast_hash: clanker.cast_hash,
            type: clanker.type,
            page: page,
            i_mcap_usd: 37000,
            i_price_usd: 37000 / 100000000000,
            i_24h_volume: 0,
          }
        })
        return true
      } catch (e: any) {
        console.log("Failed to insert", clanker.id)
        return true
      }
    })

    await Promise.all(clankerPromises)
    const elapsedMs = Date.now() - startTimeMs
    if (elapsedMs > maxRunTimeMs) {
      console.log("Max runtime exceeded")
      break
    }

    if (!data.hasMore) break
    page++
  }
}

export async function clankerListAPI(sort: 'desc' | 'asc', page = 1): Promise<APIPage> {
  const res = await axios.get(`https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`);
  const data = res.data;
  const parsed = APIPageSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Failed to parse", JSON.stringify(parsed.error.errors, null, 2));
    throw new Error(`Invalid clanker data: ${parsed.error.errors.join(", ")}`);
  }
  return parsed.data
}

export async function clankerGetAPI(ca: string): Promise<APIClanker> {
  const res = await axios.get(`https://www.clanker.world/api/get-clanker-by-address?address=${ca}`, {
    headers: {
      'x-api-key': env.CLANKER_API_KEY_2,
    },
  });
  const data = res.data;
  console.log("Clanker data", data);
  const parsed = APIClankerSchema.safeParse(data.data);
  if (!parsed.success) {
    console.error("Failed to parse", JSON.stringify(parsed.error.errors, null, 2));
    throw new Error(`Invalid clanker data: ${parsed.error.errors.join(", ")}`);
  }
  return parsed.data
}

export async function clankerRewardsUSDAPI(poolAddress: string): Promise<number | undefined> {
  try {
    const res = await axios.get(`https://www.clanker.world/api/tokens/estimate-rewards-by-pool-address?poolAddress=${getAddress(poolAddress)}`, {
      headers: {
        'x-api-key': env.CLANKER_API_KEY,
      },
    });
    const data = res.data;
    return data.userRewards;
  } catch(e: any) {
    console.error("Failed to fetch clanker rewards", e.message);
    return undefined
  }
}

export async function clankerRewardsUSDAPIBatched(poolAddresses: string[]): Promise<Record<string, number>> {
  try {
    console.log("Fetching clanker rewards for ", poolAddresses.length, "pools");
    const rewardsMap: Record<string, number> = {};
    const requests = poolAddresses.map(async (poolAddress) => {
      const rewards = await clankerRewardsUSDAPI(poolAddress);
      if (rewards !== undefined) {
        rewardsMap[poolAddress] = rewards;
      }
    });
    await Promise.all(requests);
    console.log("Fetched rewards for", Object.keys(rewardsMap).length, "pools");
    return rewardsMap;
  } catch (e: any) {
    console.error("Failed to fetch clanker rewards", e.message);
    return {};
  }
}