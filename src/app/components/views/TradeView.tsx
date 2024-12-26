"use client"

import { useState } from "react";
import { type ClankerWithData } from "@/app/server";
import { motion } from 'framer-motion';
import { CoinsIcon } from "lucide-react";
import { WithTooltip } from "../../components";
import { useToast } from "~/hooks/use-toast";
import { type Referral, serverFetchReferral } from "../../server-referral";
import { useAccount } from "wagmi";
import { SwapInterface } from "~/app/swap";
import { FButton } from "../FButton";
import { track } from "@vercel/analytics/react";
import { FInput } from "../FInput";
import { CastCard } from "../CastCard";
import { formatPrice } from "~/lib/utils";

export function TradeView({
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
