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
export type ClankerWithData = {
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
  priceDiff1h?: number;
  volume24h?: number;
  rewardsUSD?: number;
}

export type ClankerWithDataAndBalance = ClankerWithData & { balance: number }


