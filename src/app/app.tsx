/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

"use client"

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { type ClankerWithData, type ClankerWithDataAndBalance, serverFetchBalance, serverFetchCA, serverFetchHotClankers, serverFetchLatestClankers, serverFetchNativeCoin, serverFetchPortfolio, serverFetchTopClankers, serverSearchClankers } from "./server";
import { type EmbedCast, type EmbedUrl, type CastWithInteractions } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { motion } from 'framer-motion';
import { ChartAreaIcon, ChartNoAxesColumnIncreasing, Coins, CoinsIcon, Link2, LucideHeart, LucideMessageCircle, LucideRotateCcw, MessageCircle, Reply, Rocket, Share, Users } from "lucide-react";
import { WithTooltip } from "./components";
import { useToast } from "~/hooks/use-toast";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { io } from 'socket.io-client';
import moment from "moment"

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
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={0}
        onAped={() => void 0}
      />
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
        {clankers.map((item, i) => (
          <ClankItem 
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
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
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
          <ClankItem
            c={clankers[0]}
            onSelect={() => setDetailClanker(clankers[0] ?? null)}
            balance={balances[clankers[0].contract_address]}
          />
        </motion.div>}
        {clankers.slice(1).map((item, i) => (
          <ClankItem 
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
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
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
        {clankers.map((item, i) => (
          <ClankItem 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            balance={item.balance}
          />
        ))}
      </motion.div>
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={0}
        onAped={() => void 0}
      />
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
        {clankers.map((item, i) => (
          <ClankItem 
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
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
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
    setDispClankers(clankers)
  }, [clankers, isHover])

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  async function processNewLiveTrade(ca: string) {
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
          <ClankItem
            c={dispClankers[0]}
            onSelect={() => setDetailClanker(dispClankers[0] ?? null)}
            balance={balances[dispClankers[0].contract_address]}
            onHover={setHover}
          />
        </motion.div>}
        {dispClankers.slice(1).map((item, i) => (
          <ClankItem
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
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
    </div>
  );
}

function formatBalance(balance: number, decimals: number) {
  balance = balance / 10 ** decimals

  // examples: 50k, 52.4m, 1.2b
  if (balance < 1000) {
    return balance.toFixed(2);
  } else if (balance < 1000000) {
    return (balance / 1000).toFixed(2) + "k";
  } else if (balance < 1000000000) {
    return (balance / 1000000).toFixed(2) + "m";
  } else {
    return (balance / 1000000000).toFixed(2) + "b";
  }
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

export function ClankItem({ 
  c, 
  onSelect, 
  balance,
  onHover,
  withoutCast,
  noLink = false,
}: { 
  c: ClankerWithData, 
  onSelect?: () => void, 
  balance?: number,
  onHover?: (isHovered: boolean) => void
  withoutCast?: boolean
  noLink?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(false)
  }

  return (
    <motion.a
      className={`item_bg relative cursor-pointer ${isHovered ? 'border border-white/30 z-10' : 'border border-transparent'} overflow-hidden`}
      href={noLink ? '#' : `/t/${c.contract_address}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      whileHover={{
        rotate: 2,
        scale: 1.05
      }}
    >
      <motion.div
        animate={moment(c.created_at).isBefore(moment().subtract(10, 'minutes')) ? { opacity: 1 } : { opacity: [0, 1, 0], transition: { repeat: Infinity, duration: 1 } }}
        className={`absolute right-1 md:right-3 top-1 md:top-3 font-medium text-xs uppercase ${moment(c.created_at).isBefore(moment().subtract(10, 'minutes')) ? 'text-white/50' : 'text-cyan-400'}`}
      >
        {moment(c.created_at).fromNow()}
      </motion.div>
      <div className="item_image flex items-center justify-center relative">
        {c.img_url ? <img src={c.img_url} alt="" className="w-full h-full object-contain" /> : 
        <div className="bg-purple-500 w-full h-full grid place-items-center text-[8px] md:text-base">
          ${c.symbol}
        </div>}
        {(balance && (c.priceUsd * balance / 10**c.decimals) > 0.01) ? <BalanceView balance={balance} decimals={c.decimals} priceUsd={c.priceUsd} /> : null}
      </div>
      <div className="item_content flex-grow">
        <div className="item_content_info font-bold w-full">
          <div className="item_content_title overflow-hidden">
            <div className="item_title_tagline truncate">
              ${c.symbol}
            </div>
            <div className={`text-clip item_title_title text-[18px] md:text-[28px]`}>
              {c.name}
            </div>
          </div>
          <div className="item_content_stats">
            <div className="item_stat text-[#4EE7FB]">
              <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 7C0 3.41015 2.91015 0.5 6.5 0.5C10.0899 0.5 13 3.41015 13 7C13 10.5899 10.0899 13.5 6.5 13.5C2.91015 13.5 0 10.5899 0 7ZM7.15 2.775V3.83038C7.67263 3.96262 8.13377 4.25347 8.43433 4.66913L8.8152 5.19586L7.76175 5.95759L7.38088 5.43087C7.23966 5.23557 6.92472 5.05 6.5 5.05H6.31944C5.73784 5.05 5.525 5.4042 5.525 5.55556V5.60517C5.525 5.73339 5.62193 5.9487 5.94915 6.07959L7.53365 6.71339C8.22716 6.99079 8.775 7.61009 8.775 8.39483C8.775 9.35231 8.00995 9.99936 7.15 10.1909V11.225H5.85V10.1696C5.32737 10.0374 4.86623 9.74653 4.56567 9.33087L4.1848 8.80414L5.23825 8.04241L5.61912 8.56913C5.76034 8.76443 6.07528 8.95 6.5 8.95H6.61854C7.2344 8.95 7.475 8.57359 7.475 8.39483C7.475 8.26661 7.37807 8.0513 7.05085 7.92041L5.46634 7.28661C4.77284 7.00921 4.225 6.38991 4.225 5.60517V5.55556C4.225 4.60395 4.99809 3.97038 5.85 3.79765V2.775H7.15Z" fill="#4EE7FB"/>
              </svg>
              <div className="item_stat_text">
                {formatPrice(c.marketCap)}
              </div>
            </div>
            {c.cast && 
            <WithTooltip text="Engagement: # likes, recasts and replies">
              <motion.div
                animate={c.cast.reactions.likes_count + c.cast.reactions.recasts_count + c.cast.replies.count > 100 ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 1 } } : {}}
                className="item_stat text-[#6BFFBC]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.38852 0L0 6.93116H3.03896L1.97694 12L12 2.88798H8.12353L9.81779 0H3.38852Z" fill="#6BFFBC"/>
                </svg>
                <div className="item_stat_text text-[#6BFFBC]">
                  {c.cast.reactions.likes_count + c.cast.reactions.recasts_count + c.cast.replies.count}
                </div>
              </motion.div>
            </WithTooltip>
            }
            {c.rewardsUSD ? <WithTooltip text="Creator rewards">
              <motion.div
                className="item_stat text-[#FF83EC]"
              >
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g id="vector">
                  <path d="M0 13.5V7.72222H5.04178C4.51243 8.31942 3.91696 8.83191 3.21947 9.28207L2.61266 9.67371L3.39593 10.8873L4.00275 10.4957C4.66749 10.0667 5.25241 9.58794 5.77778 9.05085V13.5H0Z" fill="#FF83EC"/>
                  <path d="M7.22222 9.05085V13.5H13V7.72222H7.95822C8.48757 8.31942 9.08304 8.83191 9.78053 9.28207L10.3873 9.67371L9.60407 10.8873L8.99725 10.4957C8.33251 10.0667 7.74759 9.58794 7.22222 9.05085Z" fill="#FF83EC"/>
                  <path d="M4.33333 5.07407C4.33333 5.73886 4.87225 6.27778 5.53704 6.27778H5.77778V6.03704C5.77778 5.37225 5.23886 4.83333 4.57407 4.83333C4.44112 4.83333 4.33333 4.94112 4.33333 5.07407Z" fill="#FF83EC"/>
                  <path d="M7.22222 6.03704V6.27778H7.46296C8.12775 6.27778 8.66667 5.73886 8.66667 5.07407C8.66667 4.94112 8.55888 4.83333 8.42593 4.83333C7.76114 4.83333 7.22222 5.37225 7.22222 6.03704Z" fill="#FF83EC"/>
                  <path d="M9.82236 6.27778C10.007 5.91663 10.1111 5.50751 10.1111 5.07407C10.1111 4.14337 9.35663 3.38889 8.42593 3.38889C7.99249 3.38889 7.58337 3.49302 7.22222 3.67764V0.5H13V6.27778H9.82236Z" fill="#FF83EC"/>
                  <path d="M4.57407 3.38889C5.00751 3.38889 5.41663 3.49302 5.77778 3.67764V0.5H0V6.27778H3.17764C2.99302 5.91663 2.88889 5.50751 2.88889 5.07407C2.88889 4.14337 3.64337 3.38889 4.57407 3.38889Z" fill="#FF83EC"/>
                  </g>
                </svg>
                <div className="item_stat_text">
                  ${formatPrice(c.rewardsUSD)}
                </div>
              </motion.div>
            </WithTooltip> : null}
          </div>
        </div>
        <div className="item_content_line w-full"/>
        {c.cast && !withoutCast ? (
            <div className="item_content_user w-full">
                <a href={`https://warpcast.com/${c.cast.author.username}/${c.cast.hash.slice(0, 10)}`} target="_blank" rel="noopener noreferrer" className="item_content_user w-full">
                  <CastCard cast={c.cast} />
                </a>
            </div>
        ) : <div className="item_content_user flex-grow"/>}
      </div>
    </motion.a>
  )
}

export function ClankItemGhost() {
  return (
    <motion.div
      className={`item_bg relative cursor-pointer 'border border-transparent' overflow-hidden`}
    >
      <motion.div
        className={`absolute right-1 md:right-3 top-1 md:top-3 font-medium text-xs uppercase`}
      >
      </motion.div>
      <div className="item_image flex items-center justify-center relative">
        <div className="bg-white/10 w-full h-full grid place-items-center text-[8px] md:text-base">
        </div>
      </div>
      <div className="item_content flex-grow">
        <div className="item_content_info font-bold w-full">
          <div className="item_content_title overflow-hidden">
            <div className="item_title_tagline truncate">
            </div>
            <div className={`text-clip item_title_title text-[18px] md:text-[28px]`}>
            </div>
          </div>
        </div>
        <div className="item_content_line w-full"/>
      </div>
    </motion.div>
  )
}

function BalanceView({ balance, decimals, priceUsd }: { balance: number, decimals: number, priceUsd: number }) {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-bl from-pink-500 to-purple-500  text-white p-1 grid place-items-center">
      <span className="hidden md:block text-xs">you own ${formatPrice(priceUsd * balance / 10**decimals)}</span>
      <span className="md:hidden text-xs">${formatPrice(priceUsd * balance / 10**decimals)} 💰</span>
    </div>
  )
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
      <div className="fixed bottom-0 left-0 w-full bg-[#090F11] z-[9] p-2 md:hidden flex justify-center">
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
    <div className={`w-full max-w-[400px] flex justify-start gap-2 ${className ? className : ""}`}>
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

import { useAccount } from "wagmi";
import { SwapInterface } from "./swap";
import { Input } from "~/components/ui/input";
import { debounce, set } from "lodash";
import { CastCard } from "./components/CastCard";
import { ClankfunLogo } from "./components/Logo";
import { FButton } from "./components/FButton";
import { FConnectButton } from "./components/FConnectButton";
import { FInput, FSearchInput } from "./components/FInput";
import { PriceInput } from "~/components/ui/priceinput";
import Link from "next/link";
import { LaunchView } from "./components/LaunchView";
import { type Referral, serverFetchReferral } from "./server-referral";
import { track } from "@vercel/analytics/react";
import { FSnow } from "./components/FSnow";

function BuyModal({ 
  clanker, 
  onOpenChange,
  apeAmount,
  onAped,
}: { 
  clanker: ClankerWithData | null, 
  onOpenChange: (visible: boolean) => void 
  apeAmount: number | null
  onAped: () => void
}) {
  return (
    <Dialog open={clanker !== null} onOpenChange={() => {
      console.log('closing modal')
      onOpenChange(false)
    }}>
      <DialogContent className="max-w-[90%]">
        <DialogHeader>
          <VisuallyHidden.Root>
            <DialogTitle>Trade {clanker?.name}</DialogTitle>
          </VisuallyHidden.Root>
        </DialogHeader>
        <div className="h-full w-full flex flex-col lg:flex-row gap-4">
          {clanker?.pool_address && <iframe 
            className="hidden lg:block rounded-lg w-full h-[700px]"
            id="geckoterminal-embed" 
            title="GeckoTerminal Embed" 
            src={`https://www.geckoterminal.com/base/pools/${clanker?.pool_address}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0`}
            allow="clipboard-write"
          >
          </iframe>}
          {clanker && <div className="flex-grow flex flex-col gap-4">
            <div className="h-20 justify-start items-center gap-3 inline-flex">
              {clanker.img_url ? 
              <img className="w-20 h-20 relative rounded-[3px] border border-white/5" src={clanker.img_url ?? ""} />
              : 
              <div className="bg-purple-500 w-20 h-20 grid place-items-center text-xs">
                ${clanker.symbol}
              </div>}
              <div className="grow shrink basis-0 flex-col justify-start items-start gap-4 inline-flex overflow-hidden">
                <div className="self-stretch h-[49px] flex-col justify-start items-start gap-2 flex overflow-hidden">
                  <div className="self-stretch text-[#b3a1ff] text-[13px] font-medium   leading-[13px] truncate">${clanker.symbol}</div>
                  <div className="self-stretch text-white text-[28px] font-medium   leading-7 truncate">{clanker.name}</div>
                </div>
                <div className="self-stretch justify-start items-center gap-4 inline-flex">
                  <div className="justify-start items-center gap-1 flex">
                    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M0 7C0 3.41015 2.91015 0.5 6.5 0.5C10.0899 0.5 13 3.41015 13 7C13 10.5899 10.0899 13.5 6.5 13.5C2.91015 13.5 0 10.5899 0 7ZM7.15 2.775V3.83038C7.67263 3.96262 8.13377 4.25347 8.43433 4.66913L8.8152 5.19586L7.76175 5.95759L7.38088 5.43087C7.23966 5.23557 6.92472 5.05 6.5 5.05H6.31944C5.73784 5.05 5.525 5.4042 5.525 5.55556V5.60517C5.525 5.73339 5.62193 5.9487 5.94915 6.07959L7.53365 6.71339C8.22716 6.99079 8.775 7.61009 8.775 8.39483C8.775 9.35231 8.00995 9.99936 7.15 10.1909V11.225H5.85V10.1696C5.32737 10.0374 4.86623 9.74653 4.56567 9.33087L4.1848 8.80414L5.23825 8.04241L5.61912 8.56913C5.76034 8.76443 6.07528 8.95 6.5 8.95H6.61854C7.2344 8.95 7.475 8.57359 7.475 8.39483C7.475 8.26661 7.37807 8.0513 7.05085 7.92041L5.46634 7.28661C4.77284 7.00921 4.225 6.38991 4.225 5.60517V5.55556C4.225 4.60395 4.99809 3.97038 5.85 3.79765V2.775H7.15Z" fill="#4EE7FB"/>
                    </svg>
                    <div className="text-[#4ee6fb] text-sm font-medium   leading-[14px]">${formatPrice(clanker.marketCap)}</div>
                  </div>
                  {clanker.cast && <div className="justify-start items-center gap-[3px] flex">
                    <div className="text-[#6affbc] text-sm font-medium   uppercase leading-[14px] flex gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.38852 0L0 6.93116H3.03896L1.97694 12L12 2.88798H8.12353L9.81779 0H3.38852Z" fill="#6BFFBC"/>
                      </svg>
                      {clanker.cast.reactions.likes_count + clanker.cast.reactions.recasts_count + clanker.cast.replies.count}
                    </div>
                  </div>}
                </div>
              </div>
            </div>
            {clanker.cast && 
            <a href={`https://warpcast.com/${clanker.cast.author.username}/${clanker.cast.hash.slice(0, 10)}`} target="_blank" rel="noreferrer">
              <CastCard cast={clanker.cast} withText/>
            </a>
            }
            {clanker && <SwapInterface 
              clanker={clanker} 
              apeAmount={apeAmount} 
              onAped={onAped}
              onSwapComplete={() => onOpenChange(false)}
              refAddress={null}
            />}
          </div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TradeApp({
  clanker,
  referrer
}: {
  clanker: ClankerWithData
  referrer: Referral | null
}) {
  const { toast } = useToast()
  const { address } = useAccount()
  const [referTrade, setReferral] = useState<{
    id: string
    numTrades: number
  } | null>(null)

  async function onTradeComplete() {
    if (!address || !clanker.contract_address) return
    const res = await serverFetchReferral({
      address: address,
      contract_address: clanker.contract_address
    })
    setReferral(res)
  }

  function tweetIntentUrl() {
    const text = `I just bought $${clanker.symbol} on @clankfun\n`
    const url = `https://clank.fun/t/${clanker.contract_address}?r=${referTrade?.id}`

    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  }

  function farcasterIntentURL() {
    const text = `I just bought $${clanker.symbol}`
    const url = `https://clank.fun/t/${clanker.contract_address}?r=${referTrade?.id}`

    return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`
  }


  return (
    <div className="h-full w-full flex flex-col lg:flex-row gap-4">
      {clanker?.pool_address && <iframe 
        className="hidden lg:block rounded-lg w-full h-[700px]"
        id="geckoterminal-embed" 
        title="GeckoTerminal Embed" 
        src={`https://www.geckoterminal.com/base/pools/${clanker?.pool_address}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0`}
        allow="clipboard-write"
        style={{ height: `calc(100vh - 150px)` }}
      >
      </iframe>}
      <div className="flex flex-col gap-4 lg:w-[350px] flex-none">
        <div className="h-20 justify-start items-center gap-3 inline-flex">
          {clanker.img_url ? 
          <img className="w-20 h-20 relative rounded-[3px] border border-white/5" src={clanker.img_url ?? ""} />
          : 
          <div className="bg-purple-500 w-20 h-20 grid place-items-center text-xs">
            ${clanker.symbol}
          </div>}
          <div className="grow shrink basis-0 flex-col justify-start items-start gap-4 inline-flex overflow-hidden">
            <div className="self-stretch h-[49px] flex-col justify-start items-start gap-2 flex overflow-hidden">
              <div className="self-stretch text-[#b3a1ff] text-[13px] font-medium   leading-[13px] truncate">${clanker.symbol}</div>
              <div className="self-stretch text-white text-[28px] font-medium leading-7 truncate">{clanker.name}</div>
            </div>
            <div className="self-stretch justify-start items-center gap-4 inline-flex">
              <div className="justify-start items-center gap-1 flex">
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 7C0 3.41015 2.91015 0.5 6.5 0.5C10.0899 0.5 13 3.41015 13 7C13 10.5899 10.0899 13.5 6.5 13.5C2.91015 13.5 0 10.5899 0 7ZM7.15 2.775V3.83038C7.67263 3.96262 8.13377 4.25347 8.43433 4.66913L8.8152 5.19586L7.76175 5.95759L7.38088 5.43087C7.23966 5.23557 6.92472 5.05 6.5 5.05H6.31944C5.73784 5.05 5.525 5.4042 5.525 5.55556V5.60517C5.525 5.73339 5.62193 5.9487 5.94915 6.07959L7.53365 6.71339C8.22716 6.99079 8.775 7.61009 8.775 8.39483C8.775 9.35231 8.00995 9.99936 7.15 10.1909V11.225H5.85V10.1696C5.32737 10.0374 4.86623 9.74653 4.56567 9.33087L4.1848 8.80414L5.23825 8.04241L5.61912 8.56913C5.76034 8.76443 6.07528 8.95 6.5 8.95H6.61854C7.2344 8.95 7.475 8.57359 7.475 8.39483C7.475 8.26661 7.37807 8.0513 7.05085 7.92041L5.46634 7.28661C4.77284 7.00921 4.225 6.38991 4.225 5.60517V5.55556C4.225 4.60395 4.99809 3.97038 5.85 3.79765V2.775H7.15Z" fill="#4EE7FB"/>
                </svg>
                <div className="text-[#4ee6fb] text-sm font-medium   leading-[14px]">${formatPrice(clanker.marketCap)}</div>
              </div>
              {clanker.cast && <div className="justify-start items-center gap-[3px] flex">
                <div className="text-[#6affbc] text-sm font-medium   uppercase leading-[14px] flex gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.38852 0L0 6.93116H3.03896L1.97694 12L12 2.88798H8.12353L9.81779 0H3.38852Z" fill="#6BFFBC"/>
                  </svg>
                  {clanker.cast.reactions.likes_count + clanker.cast.reactions.recasts_count + clanker.cast.replies.count}
                </div>
              </div>}
              {clanker.rewardsUSD ? <WithTooltip text="Creator rewards">
                <motion.div
                  className="item_stat text-[#FF83EC]"
                >
                  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="vector">
                    <path d="M0 13.5V7.72222H5.04178C4.51243 8.31942 3.91696 8.83191 3.21947 9.28207L2.61266 9.67371L3.39593 10.8873L4.00275 10.4957C4.66749 10.0667 5.25241 9.58794 5.77778 9.05085V13.5H0Z" fill="#FF83EC"/>
                    <path d="M7.22222 9.05085V13.5H13V7.72222H7.95822C8.48757 8.31942 9.08304 8.83191 9.78053 9.28207L10.3873 9.67371L9.60407 10.8873L8.99725 10.4957C8.33251 10.0667 7.74759 9.58794 7.22222 9.05085Z" fill="#FF83EC"/>
                    <path d="M4.33333 5.07407C4.33333 5.73886 4.87225 6.27778 5.53704 6.27778H5.77778V6.03704C5.77778 5.37225 5.23886 4.83333 4.57407 4.83333C4.44112 4.83333 4.33333 4.94112 4.33333 5.07407Z" fill="#FF83EC"/>
                    <path d="M7.22222 6.03704V6.27778H7.46296C8.12775 6.27778 8.66667 5.73886 8.66667 5.07407C8.66667 4.94112 8.55888 4.83333 8.42593 4.83333C7.76114 4.83333 7.22222 5.37225 7.22222 6.03704Z" fill="#FF83EC"/>
                    <path d="M9.82236 6.27778C10.007 5.91663 10.1111 5.50751 10.1111 5.07407C10.1111 4.14337 9.35663 3.38889 8.42593 3.38889C7.99249 3.38889 7.58337 3.49302 7.22222 3.67764V0.5H13V6.27778H9.82236Z" fill="#FF83EC"/>
                    <path d="M4.57407 3.38889C5.00751 3.38889 5.41663 3.49302 5.77778 3.67764V0.5H0V6.27778H3.17764C2.99302 5.91663 2.88889 5.50751 2.88889 5.07407C2.88889 4.14337 3.64337 3.38889 4.57407 3.38889Z" fill="#FF83EC"/>
                    </g>
                  </svg>
                  <div className="item_stat_text">
                    ${formatPrice(clanker.rewardsUSD)}
                  </div>
                </motion.div>
              </WithTooltip> : null}
            </div>
          </div>
        </div>
        {clanker.cast && 
        <a href={`https://warpcast.com/${clanker.cast.author.username}/${clanker.cast.hash.slice(0, 10)}`} target="_blank" rel="noreferrer">
          <CastCard cast={clanker.cast} withText/>
        </a>
        }
        {referTrade && <div className="p-2 flex flex-col gap-2 bg-white/10 rounded-xl w-full md:max-w-[360px]">
          <div className="flex gap-2 items-center">
            <p className="text-lg font-bold">
              Share your trade to earn
            </p>
            <CoinsIcon size={14} />
          </div>
          <p className="text-sm">
            Share the unique URL below to
            let others know you bought ${clanker.symbol} and earn 0.5% on every copy trade made
            through your link
          </p>
          <FInput 
            value={`https://clank.fun/t/${clanker.contract_address}?r=${referTrade.id}`}
            onChange={() => void 0}
            placeholder=""
          />
          <div className="flex flex-col gap-2">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex-grow flex flex-col">
                <FButton primary onClick={() => {
                  window.open(tweetIntentUrl(), "_blank")
                  track("Clicked X ref share")
                }}>
                  Share on X
                </FButton>
              </div>
              <div className="flex-grow flex flex-col">
                <FButton primary onClick={() => {
                  window.open(farcasterIntentURL(), "_blank")
                  track("Clicked FC ref share")
                }}>
                  Share on Farcaster
                </FButton>
              </div>
            </div>
            <FButton 
              onClick={() => {
                navigator.clipboard.writeText(`https://clank.fun/t/${clanker.contract_address}?r=${referTrade.id}`)
                toast({
                  title: "Copied",
                  description: "Copied referral link to clipboard",
                })
                track("Copied ref link")
              }}
            >
              Copy Link
            </FButton>
          </div>
        </div>}
        <SwapInterface 
          clanker={clanker} 
          apeAmount={null} 
          onAped={() => void 0}
          onSwapComplete={onTradeComplete}
          refAddress={referrer?.walletAddress ?? null}
        />
      </div>
    </div>
  )
}

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
      <ClankItemGhost />
      <ClankItemGhost />
      <ClankItemGhost />
      <ClankItemGhost />
      <ClankItemGhost />
      <ClankItemGhost />
    </div>
  )
}

function AnonCast({ cast, isParent }: { cast: CastWithInteractions, isParent?: boolean }) {
  const [parent, setParent] = useState<CastWithInteractions | null>(null);

  async function fetchParent(cast: CastWithInteractions) {
    return
    // if (!cast.parent_hash) {
    //   return
    // }
    // const parent = await fetchParentCast(cast.parent_hash)
    // if (parent) {
    //   setParent(parent)
    // }
  }

  useEffect(() => {
    if (isParent) return
    void fetchParent(cast)
  }, [cast, isParent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.05,
        repeat: 4,
        repeatType: "reverse",
      }}
      className="w-full"
    >
      <div style={!isParent ? {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "10px",
        width: "100%",
      }: { width: "100%"}} className="w-full">
        {parent && (
          <AnonCast cast={parent} isParent />
        )}
        {parent && (
          <div className="h-2"/>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "8px",
          }}
          className="w-full"
        >
          {parent && (
            <Reply size={24} style={{ transform: "rotate(180deg)" }} className="flex-none" />
          )}
          <a
            href={`https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-none"
          >
            <img
              src={cast.author.pfp_url}
              alt=""
              className="w-8 h-8 rounded-full flex-none"
            />
          </a>
          <a
            href={`https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <div className="w-full">
              <div className="w-full">
                <div className="w-full font-bold">
                  {cast.author.display_name}
                </div>
                <div className="w-full flex items-center text-white/50 text-sm mb-2">
                  {cast.author.follower_count}
                  <Users size={16} className="ml-1" />
                </div>
                {cast.text && (
                  <p className="text-white leading-tight text-xs">{cleanText(cast.text)}</p>
                )}
                {false && cast.embeds.map((embed, i) => {
                  if (embed.hasOwnProperty('cast')) {
                    const c = (embed as EmbedCast).cast;
                    return <div className="px-4 py-2 border border-white/20 rounded mt-2" key={i}>{cleanText(c.text)}</div>
                  } else {
                    const c = (embed as EmbedUrl)
                    if (c.metadata?.image) {
                      return (
                        <img
                          key={i}
                          src={c.url}
                          alt=""
                          className="max-w-[600px] w-full mt-4 mb-1"
                        />
                      );
                    } else {
                      return null
                    }
                  }
                })}
              </div>
              <div className="w-full flex items-center gap-2 text-gray-500 text-sm mt-2">
                <ReactionStat icon={<LucideHeart size={16} />} count={cast.reactions.likes_count} id={cast.hash} />
                <ReactionStat icon={<LucideRotateCcw size={16} />} count={cast.reactions.recasts_count} id={cast.hash} />
                <ReactionStat icon={<LucideMessageCircle size={16} />} count={cast.replies.count} id={cast.hash} />
                <span className="flex-grow"></span>
                <span>{new Date(cast.timestamp).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric' })}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </motion.div>
  )
}