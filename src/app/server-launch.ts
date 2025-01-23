/* eslint-disable @typescript-eslint/no-unsafe-call */
"use server"

import axios from 'axios';

import { verifyMessage } from 'viem';
import { env } from '~/env';
import { getClankfunBalance } from './onchain';
import wordfilter from "wordfilter"
import { CLANKFUN_BALANCE_GATE } from './constants';
import { db } from '~/lib/db';

export async function serverCheckBalance(address: string) {
  const balance = await getClankfunBalance(address)

  return {
    balance,
    required: CLANKFUN_BALANCE_GATE
  }
}

type LaunchResult = {
  tokenCA: string | null,
  error: string | null
}

export async function serverLaunchToken({
  name, ticker, image, address, nonce, signature
}: {
  name: string,
  ticker: string,
  image: string | null,
  address: `0x${string}`,
  nonce: string,
  signature: any,
}): Promise<LaunchResult> {
  // throw new Error("Token deployment is disabled")
  if (wordfilter.blacklisted(name) || wordfilter.blacklisted(ticker)) {
    return { tokenCA: null, error: "Token name or ticker is inappropriate." }
  }
  const balance = await getClankfunBalance(address)
  if (balance < CLANKFUN_BALANCE_GATE) {
    return { tokenCA: null, error: "Insufficient $CLANKFUN balance" }
  }

  const valid = await verifySignature(
    nonce,
    signature,
    address
  )
  if (!valid) {
    return { tokenCA: null, error: "Invalid signature" }
  }

  // Call API
  const apiUrl = 'https://www.clanker.world/api/tokens/deploy';
  const apiKey = env.CLANKER_API_KEY

  const requestData = {
    name,
    symbol: ticker,
    image,
    requestorAddress: address,
    requestKey: nonce,
  };

  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    console.log('Token deployment response:')
    console.log(JSON.stringify(response.data, null, 2))
    if (!response.data.contract_address) {
      return { tokenCA: null, error: "Clanker could not deploy your token" }
    }
    return { tokenCA: response.data.contract_address as string, error: null }
  } catch(e: any) {
    console.error("Failed to deploy token", e.message)
    return { tokenCA: null, error: "Clanker could not deploy your token" }
  }
}

export async function serverContestLaunchToken({
  name, ticker, image, address, nonce, signature
}: {
  name: string,
  ticker: string,
  image: string | null,
  address: `0x${string}`,
  nonce: string,
  signature: any,
}): Promise<LaunchResult> {
  // throw new Error("Token deployment is disabled")
  if (wordfilter.blacklisted(name) || wordfilter.blacklisted(ticker)) {
    return { tokenCA: null, error: "Token name or ticker is inappropriate." }
  }
  const balance = await getClankfunBalance(address)
  if (balance < CLANKFUN_BALANCE_GATE) {
    return { tokenCA: null, error: "Insufficient $CLANKFUN balance" }
  }

  const valid = await verifySignature(
    nonce,
    signature,
    address
  )
  if (!valid) {
    return { tokenCA: null, error: "Invalid signature" }
  }

  const user = address.toLowerCase()

  // Check if user has already launched a token in contest
  const existingEntry = await db.contestEntry.findFirst({
    where: {
      ownerAddress: user
    }
  })
  if (existingEntry) {
    return { tokenCA: null, error: "You've already submitted an entry. Please wait until the end of this round to submit another." }
  }

  // Add a token to the contest
  await db.contestEntry.create({
    data: {
      ownerAddress: user,
      created_at: new Date(),
      name,
      symbol: ticker,
      img_url: image,
    }
  })

  return { tokenCA: "fakeca", error: null }
}

async function verifySignature(
  message: string,
  signature: any,
  address: `0x${string}`
): Promise<boolean> {
  // Recover the address from the signature
  const valid = await verifyMessage({
    address,
    message,
    signature,
  });

  return valid
}