export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { env } from '~/env';
import { db } from '~/lib/db';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const clankersToUpdate = await db.clanker.findMany({
    orderBy: { 
      i_updated_at: 'desc',
    },
    take: 400,
  })

  const first = clankersToUpdate[0]!;


  return NextResponse.json({ success: first.name });
}
