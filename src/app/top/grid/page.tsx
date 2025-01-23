// Do not cache this page

// Set cache to 'no-store' to prevent Vercel from caching this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { serverFetchHotClankers } from "~/app/server";

type Params = Promise<{ca: string}>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ 
  params,
  searchParams
}: { 
  params: Params
  searchParams: SearchParams
}) {
  const data = await serverFetchHotClankers(200)
  console.log(data.length)
  return (
    <div className="w-full flex flex-wrap items-start justify-start p-4 bg-purple-500">
      {data.filter((c) => c.img_url).map((clanker) => (
        <a href={`/t/${clanker.contract_address.toLowerCase()}`} key={clanker.contract_address} className="p-0">
          <img
            key={clanker.contract_address}
            src={clanker.img_url ?? ""}
            alt={clanker.name}
            className="w-[50px] h-[50px] object-cover"
          />
        </a>
      ))}
    </div>
  )
}