"use client"

import { type CastWithInteractions } from "@neynar/nodejs-sdk/build/neynar-api/v2"
import { WithTooltip } from "../components"

type Props = {
  cast: CastWithInteractions  
  withText?: boolean
}

const castInfoStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '0px',
  gap: '2px',
  flex: 'none',
  order: 0,
  flexGrow: 0,
}

const castInfoTextStyle = {
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '11px',
  lineHeight: '100%',
  color: 'rgba(255, 255, 255, 0.3)',
  flex: 'none',
  order: 1,
  flexGrow: 0,
};

function truncate(str: string, n: number) {
  return (str.length > n) ? str.substr(0, n-1) + '...' : str;
}

export function CastCard({
  cast,
  withText
}: Props) {
  return(
    <WithTooltip text="View on Warpcast">
    <div style={{
      display: 'flex',
      flexDirection: 'row', 
      alignItems: 'center',
      padding: 0,
      gap: 8,
      margin: '0 auto',
      width: '100%',
      borderRadius: 5,
      flex: 'none',
      alignSelf: 'stretch',
      flexGrow: 0,
    }}>
      <img
        src={cast.author.pfp_url}
        alt={cast.author.username}
        className="w-8 h-8 rounded-full object-cover flex-none order-0"
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0px',
        gap: '6px',
        flex: 'none',
        order: 1,
        flexGrow: 1,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '4px',
          flex: 'none',
          order: 0,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          <div className="text-white font-normal text-[14px] leading-[14px] flex-none order-0">
            {truncate(cast.author.display_name ?? "", 15)}
          </div>
          {/* <div className="text-white/50 font-normal text-[14px] leading-[14px] flex-none order-1">
            @{truncate(cast.author.username ?? "", 10)}
          </div> */}
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
          flex: 'none',
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          <div style={castInfoStyle as any}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 10.2002C2.66789 8.96148 4.25351 8.2002 6 8.2002C7.74649 8.2002 9.33211 8.96148 10.5 10.2002M8.25 3.9502C8.25 5.19284 7.24264 6.2002 6 6.2002C4.75736 6.2002 3.75 5.19284 3.75 3.9502C3.75 2.70755 4.75736 1.7002 6 1.7002C7.24264 1.7002 8.25 2.70755 8.25 3.9502Z" stroke="white" strokeOpacity="0.3"/>
            </svg>
            <p style={castInfoTextStyle as any}>
              {cast.author.follower_count}
            </p>
          </div>
          <div style={castInfoStyle as any}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 5C10.5 7.875 6.375 10 6 10C5.625 10 1.5 7.875 1.5 5C1.5 3 2.75 2 4 2C5.25 2 6 2.75 6 2.75C6 2.75 6.75 2 8 2C9.25 2 10.5 3 10.5 5Z" stroke="white" strokeOpacity="0.3"/>
            </svg>
            <p style={castInfoTextStyle as any}>
              {cast.reactions.likes_count}
            </p>
          </div>
          <div style={castInfoStyle as any}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6C2 8.20914 3.79086 10 6 10C7.26319 10 8.4152 9.41446 9.15577 8.5M10 6C10 3.79086 8.20914 2 6 2C4.73681 2 3.5848 2.58554 2.84424 3.5M2.5 2V4H4.5M9.50592 10V8H7.50592" stroke="white" strokeOpacity="0.3"/>
            </svg>
            <p style={castInfoTextStyle as any}>
              {cast.reactions.recasts_count}
            </p>
          </div>
          <div style={castInfoStyle as any}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.75 6C10.75 3.5 8.90278 2 6 2C3.09722 2 1.25 3.5 1.25 6C1.25 6.64716 1.69711 7.7448 1.76828 7.91543C1.77479 7.93102 1.78123 7.94525 1.78705 7.96112C1.83578 8.09402 2.03156 8.79111 1.25 9.82196C2.30556 10.322 3.42655 9.5 3.42655 9.5C4.20213 9.90771 5.12495 10 6 10C8.90278 10 10.75 8.5 10.75 6Z" stroke="white" strokeOpacity="0.3"/>
            </svg>
            <p style={castInfoTextStyle as any}>
              {cast.replies.count}
            </p>
          </div>
        </div>
        {/* <div className="w-full">
          {withText && (
            cast.text  
          )}
        </div> */}
      </div>
    </div>
    </WithTooltip>
  )
}