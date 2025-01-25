/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ethers } from 'ethers';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { env } from '~/env';
import { Alchemy, Network, Utils } from 'alchemy-sdk';

const provider = new ethers.JsonRpcProvider(env.NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT);

import { BigNumber } from '@ethersproject/bignumber';
import { erc20Abi, getAddress } from 'viem';
import { CLANKFUN_CA } from './constants';

import V2Token from './abi/ClankerTokenV2.json'
import V3Token from './abi/ClankerTokenV3.json'
import { DBClanker } from '~/lib/types';

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(settings);

export async function getClankfunBalance(address?: string): Promise<number> {
  if (!address) return 0
  const url = `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const body = JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params: [
          address,
          [
            CLANKFUN_CA
          ]
      ]
  });

  const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
  })
  const data = await res.json()
  

  const balance = parseInt(BigNumber.from(data.result.tokenBalances[0].tokenBalance).toString())
  return balance / (10 ** 18)
}

export async function getTokenBalance(address?: string): Promise<Record<string, number>> {
  if (!address) return {}
  const url = `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const body = JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params: [
          address,
          "erc20"
      ]
  });

  const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
  })
  const data = await res.json()
  const balances = data.result.tokenBalances.reduce((acc: any, curr: any) => {
    // const balance = ethers.formatEther(parseInt(curr.tokenBalance).toString())
    const balance = parseInt(BigNumber.from(curr.tokenBalance).toString())
    acc[curr.contractAddress.toLowerCase()] = balance;
    return acc;
  }, {});

  return balances
}

export async function getEthUsdPrice(): Promise<number> {
  const poolAddress = "0x4200000000000000000000000000000000000006"; // e.g., WETH-USDC pool address
  const poolData = await alchemy.prices.getTokenPriceByAddress([{ network: Network.BASE_MAINNET, address: poolAddress }]);
  return poolData.data[0]!.prices[0]!.value as unknown as number;
}

function calculatePrice(sqrtPriceX96: bigint, decimalsToken0: number, decimalsToken1: number): number {
    // Convert sqrtPrice to price
    const price = Number(sqrtPriceX96) ** 2 / (2 ** 192);
    
    // Adjust for decimals
    const decimalAdjustment = 10 ** (decimalsToken1 - decimalsToken0);
    return price * decimalAdjustment;
}

async function fetchTokenDataV0V1(tokenAddress: string, poolAddress: string, ethPrice: number): Promise<TokenData> {
  // console.log(`V0/V1: Fetching market cap for pool ${poolAddress}`);
  try {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider) as any
    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      provider
    ) as any;

    const [slot0, decimals, supply] = await Promise.all([
      poolContract.slot0(),
      tokenContract.decimals(),
      tokenContract.totalSupply()
    ]);

    const sqrtPriceX96 = slot0.sqrtPriceX96;
    const intDecimals = parseInt(decimals.toString());
    const intSupply = parseInt(ethers.formatUnits(supply))
    const price = calculatePrice(sqrtPriceX96 as bigint, 18, intDecimals);
    const priceUsd = price * ethPrice;
    const marketCap = priceUsd * intSupply;
    return {
      marketCap,
      usdPrice: priceUsd,
      decimals: intDecimals,
      owner: null
    }
  } catch(e: any) {
    console.log(`Error fetching market cap for pool ${poolAddress}: ${e}`);
    return {
      marketCap: 0,
      usdPrice: 0,
      decimals: 0,
      owner: null
    };
  }
}

async function fetchTokenOwnerV2(tokenAddress: string): Promise<string> {
  const tokenContract = new ethers.Contract(tokenAddress, V2Token.abi, provider) as any
  const deployer = await tokenContract.deployer();
  return getAddress(deployer)
}

async function fetchTokenOwnerV3(tokenAddress: string): Promise<string> {
  const tokenContract = new ethers.Contract(tokenAddress, V3Token.abi, provider) as any
  const deployer = await tokenContract.deployer();
  return getAddress(deployer)
}

export async function fetchTokenOwner(clanker: DBClanker): Promise<string | null> {
  if (clanker.type === "clanker_v3") {
    return fetchTokenOwnerV3(clanker.contract_address)
  } else if (clanker.type === "clanker_v2") {
    return fetchTokenOwnerV2(clanker.contract_address)
  } else {
    return null
  }
}

async function fetchTokenDataV2(tokenAddress: string, poolAddress: string, ethPrice: number): Promise<TokenData> {
  // console.log(`V2: Fetching market cap for pool ${poolAddress}`);
  try {
    const tokenContract = new ethers.Contract(tokenAddress, V2Token.abi, provider) as any
    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      provider
    ) as any;

    const [slot0, decimals, supply, deployer] = await Promise.all([
      poolContract.slot0(),
      tokenContract.decimals(),
      tokenContract.totalSupply(),
      tokenContract.deployer()
    ]);

    const sqrtPriceX96 = slot0.sqrtPriceX96;
    const intDecimals = parseInt(decimals.toString());
    const intSupply = parseInt(ethers.formatUnits(supply))
    const price = calculatePrice(sqrtPriceX96 as bigint, 18, intDecimals);
    const priceUsd = price * ethPrice;
    const marketCap = priceUsd * intSupply;
    return {
      marketCap,
      usdPrice: priceUsd,
      decimals: intDecimals,
      owner: getAddress(deployer)
    }
  } catch(e: any) {
    console.log(`Error fetching market cap for pool ${poolAddress}: ${e}`);
    return {
      marketCap: 0,
      usdPrice: 0,
      decimals: 0,
      owner: null
    };
  }
}

type TokenData = {
  marketCap: number;
  usdPrice: number;
  decimals: number;
  owner: string | null
}

export async function fetchMultiPoolMarketCaps(c: DBClanker[]): Promise<Record<string, TokenData>> {
  const ethPrice = await getEthUsdPrice();
  const marketCapPromises = c.map((clanker, i) => {
    if (clanker.type === "clanker_v2") {
      return fetchTokenDataV2(clanker.contract_address, clanker.pool_address, ethPrice)
    } else {
      return fetchTokenDataV0V1(clanker.contract_address, clanker.pool_address, ethPrice)
    }
  });
  const marketCaps = await Promise.all(marketCapPromises);
  return Object.fromEntries(
    c.map((c, index) => [c.pool_address, marketCaps[index]!])
  );
}