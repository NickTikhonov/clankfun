/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client"

import { useState } from "react";
import { type ClankerWithData } from "../server";
import { motion } from 'framer-motion';
import { WithTooltip } from "../components";
import moment from "moment"
import { CastCard, ENSCard } from "./CastCard";

export function ClankerCard({ 
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
        {!withoutCast ? (
          <UserCard c={c} />
        ) : 
          <div className="item_content_user flex-grow"/>
        }
      </div>
    </motion.a>
  )
}

function UserCard({ c }: { c: ClankerWithData }) {
  if (c.cast) return (
    <div className="item_content_user w-full">
      <a href={`https://warpcast.com/${c.cast.author.username}/${c.cast.hash.slice(0, 10)}`} target="_blank" rel="noopener noreferrer" className="item_content_user w-full">
        <CastCard cast={c.cast} />
      </a>
    </div>
  )

  if (c.creator) return (
    <div className="item_content_user w-full">
      <a href={`https://basescan.org/address/${c.creator}`} target="_blank" rel="noopener noreferrer">
        <ENSCard address={c.creator as any}/>
      </a>
    </div>
  )

  return (
    <div className="item_content_user flex-grow"/>
  )
}

export function ClankerCardGhost() {
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

