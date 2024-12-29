/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

"use client"

import { motion } from 'framer-motion';
import { ChartAreaIcon, ChartNoAxesColumnIncreasing, Coins, Link2, MessageCircle, Rocket, Share } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { io } from 'socket.io-client';
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "~/components/ui/dialog";
import { WithTooltip } from "./components";
import { type ClankerWithData, type ClankerWithDataAndBalance, serverFetchBalance, serverFetchCA, serverFetchHotClankers, serverFetchLatestClankers, serverFetchNativeCoin, serverFetchPortfolio, serverFetchTopClankers, serverSearchClankers } from "./server";

type NavPage = "latest" | "hot" | "top" | "search" | "launch" | "detail" | "portfolio"

function shareUrl() {
  const url = new URL("https://warpcast.com/~/compose")
  url.searchParams.append("text", "Loving this slick new clanker app! 🔥")
  url.searchParams.append("embeds[]", "https://clank.fun")

  return url.toString()
}

function cleanText(text: string) {
  const cleaned = text.split(" ").map((word) => {
    if (word.length > 15) {
      return word.slice(0, 15) + "...";
    }
    return word;
  }).join(" ");

  if (cleaned.length > 200) {
    return cleaned.slice(0, 200) + "...";
  }
  return cleaned;
}

export type AppProps = {
  initialView?: NavPage
}

export function App({
  initialView = "hot"
}: AppProps) {
  const [view, setView] = useState<NavPage>(initialView);
  const [searchQuery, setSearchQuery] = useState<string>("")

  let feed
  if (view === "search") {
    feed = <SearchResults query={searchQuery}/>
  } else if (view === "latest") {
    feed = <LatestFeed/>
  } else if (view === "top") {
    feed = <TopFeed/>
  } else if (view === "launch"){
    feed =  <LaunchView />
  } else if (view === "portfolio"){
    feed = <Portfolio/>
  } else {
    feed = <HotFeed/>
  }

  return (
    <Nav 
      refreshing={false} 
      view={view} 
      setView={setView} 
      setSearchQuery={setSearchQuery}
    >
      <div className="md:hidden px-2">
        <ClankfunShill/>
      </div>
      <div className="fixed bottom-10 right-10 hidden md:block z-[30]">
        <ClankfunShill/>
      </div>
      <div className="pb-2 px-2 pt-4 lg:px-6 lg:pb-6">
        {feed}
      </div>
    </Nav>
  );
}

function ClankfunShill() {
  const [data, setData] = useState<ClankerWithData | null>(null)
  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)

  useEffect(() => {
    async function fetchClankfun() {
      const data = await serverFetchNativeCoin()
      setData(data)
    }
    void fetchClankfun()
  }, [])

  return (
    <div>
      <motion.div
        className="w-full h-10 p-1 bg-[#7962d9] rounded-[11px] flex justify-center items-center gap-6 cursor-pointer"
        onClick={() => { 
          setDetailClanker(data)
          window.open(`https://clank.fun/t/${data?.contract_address}`)
        }}
        whileHover={{
          scale: 1.05,
          rotate: 2,
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex justify-start items-center gap-1.5 flex-grow">
          {data && <img src={data?.img_url ?? ""} alt="Clankfun Logo" className="w-8 h-8 rounded" />}
          <div className="flex justify-start items-center gap-2 flex-grow">
            <div className="text-white flex-grow text-sm font-semibold   uppercase leading-[14px]">$clankfun</div>
            {data && <div className="text-white/70 text-sm font-medium   leading-[14px]">${formatPrice(data.marketCap)}</div>}
          </div>
        </div>
        <div className="flex justify-start items-center gap-1">
          <a href="https://dexscreener.com/base/0x1d008f50fb828ef9debbbeae1b71fffe929bf317" target="_blank" rel="noopener noreferrer">
            <WithTooltip text="View on DexScreener">
              <div className="w-[30px] h-[30px] px-[9px] bg-[#080d0f]/10 rounded-lg flex justify-center items-center gap-1">
                <ChartAreaIcon size={24} />
              </div>
            </WithTooltip>
          </a>
          <a href="https://t.me/clankfun" target="_blank" rel="noopener noreferrer">
            <WithTooltip text="Join the community">
              <div className="w-[30px] h-[30px] px-[9px] bg-[#080d0f]/10 rounded-lg flex justify-center items-center gap-1">
                <MessageCircle size={24} />
              </div>
            </WithTooltip>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

function SearchResults({ query }: { query: string }) {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [searching, setSearching] = useState(false);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  useEffect(() => {
    const fetchClankers = async () => {
      setClankers([])
      setSearching(true);
      const data = await serverSearchClankers(query);
      setClankers(data);
      setSearching(false);
    };

    void fetchClankers();
  }, [query]);

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  return (
    <div className="w-full">
      {searching && (
        <Loader text={`Searching for ${query}`} />
      )}
      {!searching && clankers.length === 0 && (
        <div className="w-full h-20 grid place-items-center">
          No results found for &quot;{query}&quot;
        </div>
      )}
      <motion.div className="w-full h-full clanker_grid">
        {filterBlacklisted(clankers).map((item, i) => (
          <ClankerCard 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            balance={balances[item.contract_address]}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <a href={shareUrl()} className="w-full">
          <Button className="w-full mb-4" disabled={searching}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
    </div>
  );
}

export function LatestFeed() {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | undefined>(1);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  useEffect(() => {
    const fetchClankers = async () => {
      setRefreshing(true);
      const res = await serverFetchLatestClankers();
      setClankers(res.data);
      setNextCursor(res.nextCursor);
      setRefreshing(false);
    };

    const interval = setInterval(() => {
      console.log('Fetching latest clankers')
      void periodFetchLatest()
    }, 1000 * 15)

    void fetchClankers();

    return () => {
      clearInterval(interval)
    }
  }, []);

  async function periodFetchLatest() {
    const res = await serverFetchLatestClankers();
    setClankers((prevClankers) => mergeFront(prevClankers, res.data));
  }

  function mergeFront(clankers: ClankerWithData[], newClankers: ClankerWithData[]) {
    return newClankers.concat(clankers.filter(c => !newClankers.find(nc => nc.contract_address === c.contract_address)))
  }

  async function fetchMore() {
    if (!nextCursor) {
      return
    }
    setRefreshing(true)
    const res = await serverFetchLatestClankers(nextCursor);
    setClankers(prevClankers => [...prevClankers, ...res.data]);
    setNextCursor(res.nextCursor);
    setRefreshing(false)
  }

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  return (
    <div className="w-full">
      {clankers.length === 0 && (
        <Loader text="Loading new clankers" />
      )}
      <motion.div className="w-full h-full clanker_grid">
        {clankers[0] && <motion.div
          key={clankers[0].contract_address}
          animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.4 }}
        >
          <ClankerCard
            c={clankers[0]}
            onSelect={() => setDetailClanker(clankers[0] ?? null)}
            balance={balances[clankers[0].contract_address]}
          />
        </motion.div>}
        {clankers.slice(1).map((item, i) => (
          <ClankerCard 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            balance={balances[item.contract_address]}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <Button className="w-full" onClick={fetchMore} disabled={refreshing}>
          Load more
        </Button>
        <a href={shareUrl()} className="w-full">
          <Button variant="secondary" className="w-full mb-4" disabled={refreshing}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
    </div>
  );
}

export function Portfolio() {
  const [clankers, setClankers] = useState<ClankerWithDataAndBalance[]>([]);
  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [refreshing, setRefreshing] = useState(false);
  const { address } = useAccount()

  useEffect(() => {
    const fetchClankers = async () => {
      if (!address) return
      setRefreshing(true);
      const data = await serverFetchPortfolio(address);
      setClankers(data);
      setRefreshing(false);
    };

    void fetchClankers();
  }, [address]);

  return (
    <div className="w-full">
      {!address && (
        <div className="w-full h-20 grid place-items-center">
          <div className="flex items-center gap-2 p-4 rounded bg-white/10"> 
            <Link2 size={24} className="flex-none" />
            Connect your wallet to view your portfolio
          </div>
        </div>
      )}
      {refreshing && (
        <Loader text="Loading top clankers"  />
      )}
      <motion.div className="w-full h-full clanker_grid">
        {filterBlacklistedWithBlanace(clankers).map((item, i) => (
          <ClankerCard 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            balance={item.balance}
          />
        ))}
      </motion.div>
    </div>
  );
}

export function TopFeed() {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  useEffect(() => {
    const fetchClankers = async () => {
      setRefreshing(true);
      const data = await serverFetchTopClankers();
      setClankers(data);
      setRefreshing(false);
    };

    void fetchClankers();
  }, []);

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  return (
    <div className="w-full">
      {clankers.length === 0 && (
        <Loader text="Loading top clankers"  />
      )}
      <motion.div className="w-full h-full clanker_grid">
        {filterBlacklisted(clankers).map((item, i) => (
          <ClankerCard 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            balance={balances[item.contract_address]}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <a href={shareUrl()} className="w-full">
          <Button  className="w-full mb-4" disabled={refreshing}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
    </div>
  );
}

export function HotFeed() {
  const [isHover, setHover] = useState<boolean>(false);
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [dispClankers, setDispClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isHover) {
      return;
    }
    setDispClankers(filterBlacklisted(clankers))
  }, [clankers, isHover])

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  async function processNewLiveTrade(ca: string) {
    if (isCABlacklisted(ca)) {
      console.log('Ignoring blacklisted contract address:', ca)
      return;
    }
    ca = ca.toLowerCase()
    const existing = clankers.find(c => c.contract_address.toLowerCase() === ca)
    if (existing) {
      // bump existing to the top of clankers
      setClankers(prevClankers => [existing, ...prevClankers.filter(c => c.contract_address.toLowerCase() !== existing.contract_address.toLowerCase())])
    } else {
      const data = await serverFetchCA(ca)
      setClankers(prevClankers => [data, ...prevClankers.filter(c => c.contract_address.toLowerCase() !== data.contract_address.toLowerCase()).slice(0, 39)])
    }
  }

  useEffect(() => {
    const fetchClankers = async () => {
      setRefreshing(true);
      const data = await serverFetchHotClankers();
      setClankers(data);
      setRefreshing(false);
    };

    void fetchClankers();

    // Connect to the socket.io server
    const socket = io('https://rt.clank.fun');
    console.log('Connecting to clank.fun socket.io server');

    // Listen for new clankers
    socket.on('clankers', (clanker) => {
      console.log('New trade:', clanker.contract_address);
      if (isHover) {
        console.log('Ignoring new trade, user is currently hovering over a clanker');
        return;
      }
      void processNewLiveTrade(clanker.contract_address);
    });

    // Clean up the socket connection on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  return (
    <div className="w-full">
      {dispClankers.length === 0 && (
        <Loader text="Loading hot clankers"  />
      )}
      <motion.div className="w-full h-full clanker_grid">
        {dispClankers[0] && <motion.div
          key={dispClankers[0].contract_address}
          animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.4 }}
        >
          <ClankerCard
            c={dispClankers[0]}
            onSelect={() => setDetailClanker(dispClankers[0] ?? null)}
            balance={balances[dispClankers[0].contract_address]}
            onHover={setHover}
          />
        </motion.div>}
        {dispClankers.slice(1).map((item, i) => (
          <ClankerCard
            key={i + 1}
            c={item}
            onSelect={() => setDetailClanker(item)}
            balance={balances[item.contract_address]}
            onHover={setHover}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <a href={shareUrl()} className="w-full">
          <Button  className="w-full mb-4" disabled={refreshing}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  // examples: 50k, 52.4m, 1.2b
  if (price < 1000) {
    return price.toFixed(2);
  } else if (price < 1000000) {
    return (price / 1000).toFixed(2) + "k";
  } else if (price < 1000000000) {
    return (price / 1000000).toFixed(2) + "m";
  } else {
    return (price / 1000000000).toFixed(2) + "b";
  }
}

export function Nav({ 
  refreshing, 
  view, 
  setView,
  setSearchQuery,
  children,
}: { 
  refreshing: boolean, 
  view: NavPage, 
  setView?: (view: NavPage) => void  
  setSearchQuery?: (query: string) => void
  children: ReactNode
}) {
  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-[#090F11] pb-32 md:pb-0">
      <nav className="w-full flex flex-col sticky top-0 bg-[#090F11] pb-2 z-[9] p-2 lg:pt-6 lg:px-6">
        <div className="flex items-center gap-2 mb-2 md:mb-4 text-white">
          <Link className="flex flex-none" href="/">
            <ClankfunLogo />
          </Link>
          <div className="flex-grow"/>
          <Explainer refreshing={refreshing} />
          <Link href="/launch">
            <FButton primary>
              <span className="hidden md:block">
                Launch a Coin
              </span>
              <span className="md:hidden">
                Launch
              </span>
            </FButton>
          </Link>
          <FConnectButton />
        </div>
        <div className="w-full flex gap-2">
          <NavLinks view={view} className="hidden md:block"/>
          <div className="flex-grow flex md:justify-end w-full">
            {setSearchQuery && <ClankerSearch 
              selected={view === "search"}
              onQueryUpdate={(v) => {
                setSearchQuery(v)
                if (v.length > 0) {
                  setView && setView("search")
                }
              }} />}
          </div>
        </div>
      </nav>
      {children}
      <div className="fixed bottom-0 left-0 w-full bg-[#090F11] z-[9] p-2 md:hidden flex justify-center pb-4">
        <NavLinks view={view} className="md:hidden justify-center"/>
      </div>
      <FSnow />
    </div>
  )
}

function NavLinks({
  view,
  className
}: {
  view: NavPage,
  className?: string
}) {
  return (
    <div className={`w-full max-w-[400px] flex items-center justify-start gap-2 ${className ? className : ""}`}>
      <Link href="/">
        <FButton
          selected={view === "hot"}
        >
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9.10404 2.348C8.46709 1.69763 7.83232 1.19243 7.35708 0.849635C6.91481 0.530615 6.46744 0.269066 5.99657 0L3.69571 3.28695L2.75578 2.34703L2.26863 2.83418C0.76379 4.33902 0 6.42514 0 8.00283C0 11.2974 2.60446 14 5.85604 14C9.10762 14 11.7121 11.2974 11.7121 8.00283C11.7121 5.57276 10.3643 3.63485 9.10404 2.348ZM5.85604 12.6221C6.85484 12.6221 7.66452 11.6979 7.66452 10.5578C7.66452 8.87117 5.85604 7.79948 5.85604 7.79948C5.85604 7.79948 4.04756 8.87117 4.04756 10.5578C4.04756 11.6979 4.85724 12.6221 5.85604 12.6221Z" fill="white"/>
          </svg>
          Hot
        </FButton>
      </Link>
      <Link href="/top">
        <FButton
          selected={view === "top"}
        >
          <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.37858 0C4.19768 0 3.01801 0.473334 2.13755 1.41249C1.25337 2.35562 0.711914 3.72238 0.711914 5.44444C0.711914 8.04593 2.5574 10.1907 4.27559 11.6101C5.15564 12.3371 6.05282 12.9161 6.77213 13.3158C7.13163 13.5155 7.45427 13.6746 7.71505 13.7863C7.84467 13.8419 7.96776 13.8895 8.07782 13.9248C8.16175 13.9516 8.32177 14 8.48969 14C8.65762 14 8.81763 13.9516 8.90156 13.9248C9.01163 13.8895 9.13471 13.8419 9.26433 13.7863C9.52512 13.6746 9.84776 13.5155 10.2073 13.3158C10.9266 12.9161 11.8237 12.3371 12.7038 11.6101C14.422 10.1907 16.2675 8.04593 16.2675 5.44444C16.2675 3.72238 15.726 2.35562 14.8418 1.41249C13.9614 0.473334 12.7817 0 11.6008 0C10.4695 0 9.56421 0.339812 8.94364 0.678303C8.77084 0.772558 8.61918 0.867188 8.48969 0.955253C8.3602 0.867188 8.20854 0.772558 8.03574 0.678303C7.41518 0.339812 6.50985 0 5.37858 0Z" fill="white"/>
          </svg>
          Top
        </FButton>
      </Link>
      <Link href="/new">
        <FButton
          selected={view === "latest"}
        >
          <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.267578 7C3.76758 5.6875 5.95508 3.5 7.26758 0C8.58008 3.5 10.7676 5.6875 14.2676 7C10.7676 8.3125 8.58008 10.5 7.26758 14C5.95508 10.5 3.76758 8.3125 0.267578 7Z" fill="white"/>
          </svg>
          New
        </FButton>
      </Link>
      <Link href="/portfolio">
        <FButton
          selected={view === "portfolio"}
        >
          <Coins size={16} className="flex-none" />
          Portfolio
        </FButton>
      </Link>
    </div>
  )
}

export default function ClankerSearch({
  selected,
  onQueryUpdate, 
}: {
  selected: boolean
  onQueryUpdate: (q: string) => void
}) {

  const [query, setQuery] = useState("")
  const debouncedQueryUpdate = useCallback(
    debounce((q: string) => onQueryUpdate(q), 500),
    []
  )

  useEffect(() => {
    debouncedQueryUpdate(query)
  }, [query, debouncedQueryUpdate])

  return (
    <div className="space-y-2 w-full flex md:justify-end">
      <FSearchInput 
        value={query}
        onChange={(e) => setQuery(e)}
      />
    </div>
  );
}


function Logo() {
  return (
    <div className="w-12 h-12 rounded grid place-items-center text-3xl bg-slate-900">
      <motion.div
        animate={{ rotateX: [-60, 40], rotateY: [-40, 60] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="relative"
      >
        <motion.div
          animate={{ rotateX: [40, -40], rotateY: [40, -40], x: [-2, 2], y: [-2, 2] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 text-red-500/30"
        >
          <ChartNoAxesColumnIncreasing />
        </motion.div>
        <motion.div
          animate={{ rotateX: [-60, 60], rotateY: [-40, 40], x: [2, -2], y: [2, -2] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 text-green-500/30"
        >
          <ChartNoAxesColumnIncreasing />
        </motion.div>
        <div>
          <ChartNoAxesColumnIncreasing />
        </div>
      </motion.div>
    </div>
  )
}

const ReactionStat = ({ icon: Icon, count, id }: { icon: React.ReactNode, count: number, id: string }) => {
  const prevCount = useRef(count);
  const prevId = useRef(id);

  const shouldAnimate = prevCount.current !== count && prevId.current === id;

  useEffect(() => {
    prevCount.current = count;
    prevId.current = id;
  }, [count, id]);

  return (
    <motion.div
      style={{ display: "flex", alignItems: "center", gap: "4px" }}
      animate={{ scale: shouldAnimate ? 1.2 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={shouldAnimate ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        {Icon}
      </motion.div>
      <span>{count}</span>
    </motion.div>
  );
};

import { debounce } from "lodash";
import Link from "next/link";
import { useAccount } from "wagmi";
import { filterBlacklisted, filterBlacklistedWithBlanace, isCABlacklisted } from "~/lib/blacklist";
import { ClankerCard, ClankerCardGhost } from "./components/ClankerCard";
import { FButton } from "./components/FButton";
import { FConnectButton } from "./components/FConnectButton";
import { FSearchInput } from "./components/FInput";
import { FSnow } from "./components/FSnow";
import { LaunchView } from "./components/LaunchView";
import { ClankfunLogo } from "./components/Logo";
import { usePrivy } from '@privy-io/react-auth';

function Explainer({ refreshing }: { refreshing: boolean }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const hasSeenExplainer = localStorage.getItem('hasSeenExplainer');
    if (!hasSeenExplainer) {
      setIsDialogOpen(true);
      localStorage.setItem('hasSeenExplainer', 'true');
    }
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <FButton>
          <span className="hidden md:block">
            What is this?
          </span>
          <span className="md:hidden">
            ???
          </span>
        </FButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] flex flex-col">
        <DialogHeader>
          <ClankfunLogo />
        </DialogHeader>
        <div className="text-white text-lg md:text-[38px] font-semibold md:leading-[38px]">Launch and trade the hottest coins on Base.</div>
        <div className="flex flex-col gap-2 text-sm text-white/80">
          <div className="flex items-center gap-4"><Rocket size={16} className="flex-none" />Every coin launches as an ERC-20 on Base with a $34.76k marketcap. No bonding curve. Trade on Uniswap immediately.</div>
          <div className="flex items-center gap-4"><Rocket size={16} className="flex-none"/>Devs earn ~0.4% of trading volume via LP fees. Launched a coin that trades $1m volume? You earn around $4k in fees.</div>
          <div className="flex items-center gap-4"><Rocket size={16} className="flex-none"/>Share trades made on clank.fun and earn 0.5% off every copytrade.</div>
        </div>
        <div className="flex flex-col">
          <a href="https://clanker.world" target="_blank" rel="noreferrer" className="text-[#b3a1ff] text-[15px] font-normal   underline leading-[18px]">Learn about the Clanker protocol</a>
          <a href="https://t.me/clankfun" target="_blank" rel="noreferrer" className="text-[#4ee6fb] text-[15px] font-normal   underline leading-[18px]">Join our active TG community</a>
        </div>
        <FButton primary onClick={() => setIsDialogOpen(false)}>
          Start trading
          <Rocket size={16} className="ml-2" />
        </FButton>
      </DialogContent>
    </Dialog>
  )
}

function Loader({
  text
}: {
  text?: string
}) {
  return (
    <div className="w-full h-full clanker_grid animate-pulse">
      <ClankerCardGhost />
      <ClankerCardGhost />
      <ClankerCardGhost />
      <ClankerCardGhost />
      <ClankerCardGhost />
      <ClankerCardGhost />
    </div>
  )
}
