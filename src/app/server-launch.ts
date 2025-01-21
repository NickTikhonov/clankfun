/* eslint-disable @typescript-eslint/no-unsafe-call */
"use server"

import axios from 'axios';

import { verifyMessage } from 'viem';
import { env } from '~/env';
import { getClankfunBalance } from './onchain';
import wordfilter from "wordfilter"
import { CLANKFUN_BALANCE_GATE } from './constants';

export async function serverCheckBalance(address: string) {
  const balance = await getClankfunBalance(address)

  return {
    balance,
    required: CLANKFUN_BALANCE_GATE
  }
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
}) {
  // throw new Error("Token deployment is disabled")
  if (wordfilter.blacklisted(name) || wordfilter.blacklisted(ticker)) {
    throw new Error("Token name or ticker is inappropriate. Maybe try something a bit less sus ;)")
  }
  const balance = await getClankfunBalance(address)
  if (balance < CLANKFUN_BALANCE_GATE) {
    throw new Error("Insufficient $CLANKFUN balance")
  }

  const valid = await verifySignature(
    nonce,
    signature,
    address
  )
  if (!valid) {
    throw new Error("Invalid signature")
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
      throw new Error("Failed to deploy token")
    }
    return response.data.contract_address as string
  } catch(e: any) {
    console.error("Failed to deploy token", e.message)
    throw new Error("Clanker could not deploy your token")
  }
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