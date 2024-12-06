/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  parseUnits,
} from "viem";
import { env } from "~/env";

const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": env.OX_API_KEY,
  "0x-version": "v2",
});

const WETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
const FEE_BPS = 50 // 0.5% of the trade (total 1.5% incl. clanker's fee)

export async function getQuote(
  takerAddress: string,
  tokenAddress: string, 
  amount: number, 
  sell: boolean
) {
  const sellToken = sell ? tokenAddress : WETH_ADDRESS;
  const buyToken = sell ? WETH_ADDRESS : tokenAddress;
  const sellAmount = parseUnits(amount.toString(), 18).toString();

  const quoteParams = new URLSearchParams({
    chainId: "8453",
    sellToken: sellToken,
    buyToken: buyToken,
    sellAmount: sellAmount,
    taker: takerAddress,
    swapFeeRecipient: env.FEE_RECIPIENT,
    tradeSurplusRecipient: env.FEE_RECIPIENT,
    swapFeeBps: FEE_BPS.toString(),
    swapFeeToken: WETH_ADDRESS,
    slippageBps: "2000",
  });

  const quoteResponse = await fetch(
    "https://api.0x.org/swap/permit2/quote?" + quoteParams.toString(),
    {
      headers,
    }
  );

  const quote = await quoteResponse.json();
  console.log(quote)
  return quote
}

export async function getSwapPrice(
  takerAddress: string,
  tokenAddress: string, 
  amount: number, 
  sell: boolean
) {
  const sellToken = sell ? tokenAddress : WETH_ADDRESS;
  const buyToken = sell ? WETH_ADDRESS : tokenAddress;
  const sellAmount = parseUnits(amount.toString(), 18).toString();

  const priceParams = new URLSearchParams({
    chainId: "8453",
    sellToken: sellToken,
    buyToken: buyToken,
    sellAmount: sellAmount,
    taker: takerAddress,
  });

  const priceResponse = await fetch(
    "https://api.0x.org/swap/permit2/price?" + priceParams.toString(),
    {
      headers,
    }
  );

  const price = await priceResponse.json();
  console.log(price)
  return price
}