export const maxDuration = 300; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '~/lib/db';

export async function GET(request: Request) {
  const data = await db.tradeReferral.findMany({});
  const wallets = [...new Set(data.map((d) => d.walletAddress))];
  return NextResponse.json({ total: wallets.length, wallets });
}
