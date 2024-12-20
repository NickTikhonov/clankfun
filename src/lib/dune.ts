/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { DuneClient } from "@duneanalytics/client-sdk";
import { Redis } from "ioredis";
import { env } from "~/env";

const dune = new DuneClient(env.DUNE_API_KEY);
const redis = new Redis(env.REDIS_URL);

const CACHE_EXPIRATION_SECONDS = 3600; // 1 hour

async function getCachedOrFetchFromDune(queryId: number, cacheKey: string): Promise<string[]> {
  const cachedResult = await redis.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for ${cacheKey}`);
    return JSON.parse(cachedResult);
  }

  const query_result = await dune.getLatestResult({ queryId });
  const rows = query_result.result?.rows;
  if (!rows) {
    throw new Error("Failed to query dune");
  }

  const contractAddresses = rows
    .filter((r) => r.contract_address !== null)
    .map((r) => r.contract_address) as string[];

  await redis.set(cacheKey, JSON.stringify(contractAddresses), "EX", CACHE_EXPIRATION_SECONDS);
  return contractAddresses;
}

export async function getHotClankersCA(): Promise<string[]> {
  return getCachedOrFetchFromDune(4358090, "dune_hot_clankers");
}

export async function getTopClankersCA(): Promise<string[]> {
  return getCachedOrFetchFromDune(4358063, "dune_top_clankers");
}