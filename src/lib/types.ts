import { type CastWithInteractions } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { z } from "zod";


// The type returned by the prisma client
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
  nsfw: boolean;
  i_mcap_usd: number | null;
  i_volume_usd: number | null;
  i_trades: number | null;
  i_decimals: number | null;
  i_price_usd: number | null;
  i_price_usd_1h_diff: number | null;
  i_rewards_usd: number | null;
  i_cast: string | null;
  i_owner_address: string | null;
  i_updated_at: Date | null;
  i_24h_volume: number | null;
  i_30d_volume: number | null;
  i_volume_updated_at: Date | null;
}

// The type rendered by the client.
export type UIClanker = {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  requestor_fid: number;
  name: string;
  symbol: string;
  img_url: string | null;
  pool_address: string;
  cast_hash: string | null;
  type: string;
  cast: CastWithInteractions | null;
  creator?: string;
  nsfw: boolean;

  decimals: number;
  priceUsd: number;
  marketCap: number;
  priceDiff1h: number;
  volume24h: number;
  rewardsUSD?: number;
  trades1h?: number;
}

export function dbToUIClanker(c: DBClanker): UIClanker {
  let cast: CastWithInteractions | null = null
  if (c.i_cast !== null) {
    cast = JSON.parse(c.i_cast)
  }

  let priceDiff = c.i_price_usd_1h_diff;
  let trades1h = c.i_trades;
  if (priceDiff !== null && c.i_updated_at !== null) {
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);
    if (c.i_updated_at < oneHourAgo) {
      priceDiff = 0;
      trades1h = 0;
    }
  }

  let volume24h = c.i_24h_volume;
  if (volume24h !== null && c.i_volume_updated_at !== null) {
    const halfDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 12);
    if (c.i_volume_updated_at < halfDayAgo) {
      volume24h = 0;
    }
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
    volume24h: volume24h ?? 0,
    priceDiff1h: priceDiff ?? 0,
    trades1h: trades1h ?? 0,
  }
}

export type UIClankerAndBalance = UIClanker & { balance: number }


