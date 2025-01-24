export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import * as z from 'zod';
import axios from 'axios';

export async function fetchGeckoAPIBatch(poolAddresses: string[]) {
  if (poolAddresses.length > 30) {
    throw new Error('Batch size too large');
  }
  const d = await fetchPoolDataWithRetry(poolAddresses);
  return parsePoolData(d);
}

class RateLimitedError extends Error {
  constructor() {
    super('Too many requests');
    this.name = 'RateLimitedError';
  }
}


function parsePoolData(payload: any): GeckoPoolData[] {
  if (!payload?.data) {
    throw new Error('Invalid payload');
  }
  const data = payload.data;
  const parsed: GeckoPoolData[] = [];
  for (const pool of data) {
    try {
      const poolData = PoolSchema.parse(pool);
      parsed.push(poolData);
    } catch (error: any) {
      console.error(`Error parsing pool data: ${error}`);
    }
  }
  return parsed;
}

const fetchPoolDataWithRetry = async (poolAddresses: string[], maxRetries = 5, retryDelay = 1000) => {
  let retries = 0;

  const fetchWithRetry = async () => {
    try {
      return await fetchPoolData(poolAddresses);
    } catch (error) {
      if (error instanceof RateLimitedError && retries < maxRetries) {
        retries++;
        const delay = retryDelay * 2 ** (retries - 1);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry();
      } else {
        throw error;
      }
    }
  };

  return fetchWithRetry();
};

const fetchPoolData = async (poolAddresses: string[]) => {
  try {
    const response = await axios.get(
      `https://api.geckoterminal.com/api/v2/networks/base/pools/multi/${poolAddresses.join(',')}`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );
    if (response.status !== 200) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      throw new RateLimitedError();
    } else {
      console.error('Error fetching pool data:', error);
      throw error;
    }
  }
}

const BuyStatSchema = z.object({
  buys: z.number().nullable(),
  sells: z.number().nullable(),
  buyers: z.number().nullable(),
  sellers: z.number().nullable(),
});

const TransactionsSchema = z.object({
  m5: BuyStatSchema,
  m15: BuyStatSchema,
  m30: BuyStatSchema,
  h1: BuyStatSchema,
  h24: BuyStatSchema,
});

const TimePeriodValueSchema = z.object({
  m5: z.string().nullable(),
  h1: z.string().nullable(),
  h6: z.string().nullable(),
  h24: z.string().nullable(),
});

const RelationshipDataSchema = z.object({
  id: z.string(),
  type: z.string(),
});

const RelationshipsSchema = z.object({
  base_token: z.object({
    data: RelationshipDataSchema,
  }),
  quote_token: z.object({
    data: RelationshipDataSchema,
  }),
  dex: z.object({
    data: RelationshipDataSchema,
  }),
});

const PoolSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    base_token_price_usd: z.string().nullable(),
    base_token_price_native_currency: z.string().nullable(),
    quote_token_price_usd: z.string().nullable(),
    quote_token_price_native_currency: z.string().nullable(),
    base_token_price_quote_token: z.string().nullable(),
    quote_token_price_base_token: z.string().nullable(),
    address: z.string(),
    name: z.string(),
    pool_created_at: z.string(),
    fdv_usd: z.string().nullable(),
    market_cap_usd: z.string().nullable(),
    price_change_percentage: TimePeriodValueSchema,
    transactions: TransactionsSchema,
    volume_usd: TimePeriodValueSchema,
    reserve_in_usd: z.string().nullable(),
  }),
  relationships: RelationshipsSchema,
});

export type GeckoPoolData = z.infer<typeof PoolSchema>;
