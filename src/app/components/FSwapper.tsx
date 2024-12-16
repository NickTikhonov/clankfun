"use client";

"use client"

import { FButton } from "./FButton";

type FFromProps = {
  a?: string;
  value: string;
  onChange: (value: string) => void;
  tokenName: string;
  tokenImage: string;
  onPercentageClick: (percentage: number) => void;
}

export function FFromInput({ a, value, onChange, tokenName, tokenImage, onPercentageClick }: FFromProps) {
  return (
    <div className="self-stretch p-2.5 bg-white/10 rounded-[14px] flex flex-col justify-start items-start gap-3">
      <div className="text-white text-[15px] font-medium   leading-[15px]">From</div>
      <div className="flex justify-start items-center gap-3">
        <input
          className="text-white text-3xl font-medium leading-[30px] bg-transparent outline-none w-full max-w-[1000px]"
          placeholder="0.00"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex flex-none justify-center items-center gap-1 pl-1 pr-2 bg-white/10 rounded-[32px]">
          <img
            className="w-[22px] h-[22px] rounded-[48px]"
            src={tokenImage}
            alt={`${tokenName} logo`}
          />
          <div className="text-white text-[15px] font-medium leading-[15px]">{tokenName}</div>
        </div>
      </div>
      <div className="self-stretch h-[0px] border border-white/5"></div>
      <div className="flex flex-none gap-2 text-xs">
        <FButton faded onClick={() => onPercentageClick(25)}>25%</FButton>
        <FButton faded onClick={() => onPercentageClick(50)}>50%</FButton>
        <FButton faded onClick={() => onPercentageClick(75)}>75%</FButton>
        <FButton faded onClick={() => onPercentageClick(98)}>100%</FButton>
      </div>
    </div>
  )
}

export type FToProps = {
  value: number;
  tokenName: string;
  tokenImage: string;
}

export function FToInput({ value, tokenName, tokenImage }: FToProps) {
  return (
    <div className="w-full p-2.5 bg-white/10 rounded-[14px] flex flex-col justify-start items-start gap-3">
      <div className="text-white text-[15px] font-medium leading-[15px]">To</div>
      <div className="flex justify-start items-center gap-3">
        <input
          className="text-white text-3xl font-medium leading-[30px] bg-transparent outline-none w-full max-w-[1000px]"
          placeholder="0.00"
          type="text"
          disabled
          value={value}
        />
        <div className="flex flex-none justify-center items-center gap-1 pl-1 pr-2 bg-white/10 rounded-[32px]">
          <img
            className="w-[22px] h-[22px] rounded-[48px]"
            src={tokenImage}
            alt={`${tokenName} logo`}
          />
          <div className="text-white text-[15px] font-medium leading-[15px]">{tokenName}</div>
        </div>
      </div>
    </div>
  )
}