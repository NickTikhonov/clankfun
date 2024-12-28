// Do not cache this page

// Set cache to 'no-store' to prevent Vercel from caching this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Nav } from "~/app/app";
import { getOrScrapeByCa } from "~/lib/clanker";
import { serverFetchCA } from "~/app/server";
import { track } from "@vercel/analytics/server";
import { type Metadata } from "next";
import { type Referral, serverFetchReferralById } from "~/app/server-referral";
import { TradeView } from "~/app/components/views/TradeView";

type Params = Promise<{ca: string}>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ 
  params,
  searchParams
}: { 
  params: Params
  searchParams: SearchParams
}) {
  const { ca } = await params
  await getOrScrapeByCa(ca)
  const data = await serverFetchCA(ca)
  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}