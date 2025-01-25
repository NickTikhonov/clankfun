/* eslint-disable @typescript-eslint/no-unsafe-call */
"use server"

import { env } from '~/env';
import { db } from '~/lib/db';
import { Redis } from 'ioredis';
import { PrivyClient } from '@privy-io/server-auth'
import { serverFetchCAStale } from './server';
import { type UIClanker } from '~/lib/types';

const redis = new Redis(env.REDIS_URL);
const privy = new PrivyClient(env.NEXT_PUBLIC_PRIVY_APP_ID, env.PRIVY_APP_SECRET)

const CONTEST_WINNER_CA_KEY = 'contest_winner_ca';

type ContestEntry = {
  symbol: string;
  id: string;
  created_at: Date;
  name: string;
  img_url: string | null;
  ownerAddress: string;
  votes: {
    id: string;
    address: string;
    entryId: string;
  }[];
}

export type ContestInfo = {
  entries: ContestEntry[]
  winner: UIClanker | null
}

export async function serverVoteForContestEntry(entryId: string, authToken: string): Promise<boolean> {
  let userId: string | null = null;
  try {
    console.log('Verifying token', authToken)
    const verifiedClaims = await privy.verifyAuthToken(authToken);
    userId = verifiedClaims.userId
  } catch (error: any) {
    console.log(`Token verification failed with error ${error}.`);
    return false
  } 

  const entry = await db.contestEntry.findUnique({
    where: {
      id: entryId
    }
  })
  if (!entry) return false

  await db.contestVote.upsert({
    where: {
      address: userId,
    },
    create: {
      entryId: entryId,
      address: userId,
    },
    update: {
      entryId: entryId,
    }
  })

  return true
}

export async function serverFetchContest(): Promise<ContestInfo> {
  const lastLaunchedCa = await redis.get(CONTEST_WINNER_CA_KEY);

  const entries = await db.contestEntry.findMany({
    include: {
      votes: true
    },
    orderBy: {
      votes: {
        _count: 'desc'
      }
    }
  })

  let winner: UIClanker | null = null
  if (lastLaunchedCa) {
    try {
      winner = await serverFetchCAStale(lastLaunchedCa.toLowerCase())
    } catch(e) {
      console.error('Failed to fetch last winner', e)
    }
  }

  return {
    entries: entries,
    winner: winner
  }
}
