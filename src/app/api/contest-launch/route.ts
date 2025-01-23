export const maxDuration = 300
export const dynamic = 'force-dynamic';

import axios from 'axios';
import Redis from 'ioredis';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { embueClankers } from '~/app/server';
import { env } from '~/env';
import { db } from '~/lib/db';
import { fetchGraphUniswapBaseData } from '~/lib/index/uniswapGraph';
const redis = new Redis(env.REDIS_URL);

const CONTEST_WINNER_CA_KEY = 'contest_winner_ca';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // Get the clanker
  const w = await db.contestEntry.findFirst({
    orderBy: {
      votes: {
        _count: 'desc',
      }
    },
  });

  if (!w) {
    console.log('No contest entries found - contest will continue.');
    return NextResponse.json({ success: true });
  }

  // Create the clanker
  const apiUrl = 'https://www.clanker.world/api/tokens/deploy';
  const apiKey = env.CLANKER_API_KEY

  const randomString = Math.random().toString(36).substring(7);

  const requestData = {
    name: w.name,
    symbol: w.symbol,
    image: w.img_url,
    requestorAddress: w.ownerAddress,
    requestKey: randomString,
  };

  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    console.log('Token deployment response:')
    console.log(JSON.stringify(response.data, null, 2))
    if (!response.data.contract_address) {
      console.error("Failed to deploy constest token", response.data)
      return NextResponse.json({ success: true });
    }

    const tokenCA = response.data.contract_address as string;
    await redis.set(CONTEST_WINNER_CA_KEY, tokenCA.trim().toLowerCase());

    await db.contestVote.deleteMany({})
    await db.contestEntry.deleteMany({})
    return NextResponse.json({ success: true });
  } catch(e: any) {
    console.error(JSON.stringify(e, null, 2))
    console.error("Failed to deploy contest token", e.message)
    return NextResponse.json({ success: true });
  }
}
