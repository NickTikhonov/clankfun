import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '~/env';

/**
 * Index API
 * 
 * This API is called by the realtime service to sync latest information for clankers that were traded in a specified time window.
 */

const INDEX_INTERVAL_SECONDS = 60 * 5

const RequestSchema = z.object({
  contractAddresses: z.array(z.string())
})

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const requestBody = await request.json();
  const validatedRequestBody = RequestSchema.safeParse(requestBody);
  if (!validatedRequestBody.success) {
    return NextResponse.json({ error: validatedRequestBody.error.issues }, { status: 400 });
  }

  const contractAddresses = validatedRequestBody.data.contractAddresses;

  return NextResponse.json({ contractAddresses });
}