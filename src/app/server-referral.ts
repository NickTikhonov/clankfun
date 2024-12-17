"use server"

/* eslint-disable @typescript-eslint/no-unsafe-call */
import { getAddress } from "viem";
import { db } from "~/lib/db";

export type Referral = {
  id: string
  walletAddress: string
  contractAddress: string
  numTrades: number
}

export async function serverFetchReferralById({
  id
}: {
  id: string
}): Promise<Referral | null> {
  const referral = await db.tradeReferral.findFirst({
    where: {
      id
    }
  })
  return referral
}

export async function serverFetchReferral({
  address,
  contract_address
}: {
  address: string,
  contract_address: string
}): Promise<Referral> {
  address = getAddress(address)
  contract_address = contract_address.toLowerCase()

  const existing = await db.tradeReferral.findFirst({
    where: {
      walletAddress: address,
      contractAddress: contract_address
    }
  })
  if (existing) {
    return existing
  }

  const newReferral = await db.tradeReferral.create({
    data: {
      walletAddress: address,
      contractAddress: contract_address
    }
  })
  return newReferral
}