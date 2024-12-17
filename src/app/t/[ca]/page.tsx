// Do not cache this page

// Set cache to 'no-store' to prevent Vercel from caching this page
export const dynamic = 'force-dynamic'
export const revalidate = 0


import { Nav, TradeApp } from "~/app/app";
import { getOrScrapeByCa } from "~/lib/clanker";
import { serverFetchCA } from "~/app/server";
import { track } from "@vercel/analytics/server";
import { type Metadata } from "next";
import { type Referral, serverFetchReferralById } from "~/app/server-referral";

type Params = Promise<{ca: string}>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: {
  params: Params
  searchParams: SearchParams
}): Promise<Metadata>  {
  const { ca } = await params
  await searchParams
  await getOrScrapeByCa(ca)
  const data = await serverFetchCA(ca)

  if (!data) {
    return {
      title: "Token not found"
    }
  }

  track("View coin", {
    ca: data.contract_address
  })

  const title = `Trade ${data.name}`
  const description = `Trade ${data.name} on clank.fun`
  return {
    title,
    description,
    openGraph: {
      images: [data.img_url ? data.img_url : 'https://clank.fun/og.png'],
      title,
      description,
      url: `https://clank.fun/t/${data.contract_address}`,
      type: 'website',
      ttl: 60 * 60 * 24 * 7
    },
    twitter: {
      title,
      description,
      images: [data.img_url ? data.img_url : 'https://clank.fun/og.png'],
    },
  }
}

export default async function Page({ 
  params,
  searchParams
}: { 
  params: Params
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const refId = (sp.r ?? null) as string | null
  console.log("REFID:", refId)
  let ref: Referral | null = null
  if (refId) {
    ref = await serverFetchReferralById({ id: refId })
    if (ref) {
      track("View referral link")
    }
  }

  const { ca } = await params
  await getOrScrapeByCa(ca)
  const data = await serverFetchCA(ca)
  if (!data) {
    return <div>Not found</div>
  }

  console.log("REF:", ref)
  return (
    <Nav refreshing={false} view="detail">
      <div className="px-2 md:px-6 flex-grow">
        <TradeApp clanker={data} referrer={ref} />
      </div>
    </Nav>
  )
}