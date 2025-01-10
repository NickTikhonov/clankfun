import axios from "axios";
import { env } from "~/env";

interface GraphToken {
  ca: string;
  decimals: number;
  txCount: number;
  volumeUSD: number;
  priceWETH: number;
}

interface GraphTokenResponse {
  id: string;
  decimals: string;
  txCount: string;
  untrackedVolumeUSD: string;
  whitelistPools: WhitelistPool[];
}

interface WhitelistPool {
  id: string;
  createdAtBlockNumber: string;
  sqrtPrice: string;
  token0: PoolToken;
  token1: PoolToken;
}

interface PoolToken {
  name: string;
  decimals: string;
  symbol: string;
}


function qk(ca: string) {
  ca = ca.toLowerCase();
  return `token${ca}`;
}

function buildTokenQuery(ca: string) {
  return `
${qk(ca)}: token(id:"${ca.toLowerCase()}") {
  id,
  whitelistPools(orderBy:createdAtBlockNumber, orderDirection:asc, first: 1) {
    id,
    createdAtBlockNumber
    token0 {
      name,
      symbol,
      decimals
    },
    token1 {
      name,
      symbol,
      decimals
    },
    sqrtPrice
  },
  untrackedVolumeUSD,
  txCount,
  decimals,
}
  `;
}

export async function fetchGraphUniswapBaseData(
  cas: string[],
) {
  let queryBody = ``;
  cas.forEach((c) => {
    queryBody += buildTokenQuery(c);
  });
  const queryObject = `{
    ${queryBody}
    }`;

  const {
    data: { data: tokensData },
  } = await axios.post(
    `https://gateway.thegraph.com/api/${env.GRAPH_API_KEY}/subgraphs/id/GqzP4Xaehti8KSfQmv3ZctFSjnSUYZ4En5NRsiTbvZpz`,
    { query: queryObject },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const tokens: GraphToken[] = [];
  for (const ca of cas) {
    const tokenData = tokensData[qk(ca)];
    if (tokenData !== null) {
      const token = tokenData as GraphTokenResponse;

      if (token.whitelistPools.length === 0) {
        continue;
      }
      const pool = token.whitelistPools[0]!;
      if (pool.token1.symbol !== 'WETH') {
        // WE IGNORE ALL NON-WETH POOLS FOR NOW
        continue;
      }

      const price = calculatePrice(Number(pool.sqrtPrice), Number(pool.token0.decimals), Number(pool.token1.decimals));

      tokens.push({
        ca: token.id,
        decimals: Number(token.decimals),
        txCount: Number(token.txCount),
        volumeUSD: Number(token.untrackedVolumeUSD),
        priceWETH: price,
      });
    }
  }

  return tokens
}

function calculatePrice(sqrtPriceX96: number, decimalsToken0: number, decimalsToken1: number): number {
  // Convert sqrtPrice to price
  const price = Number(sqrtPriceX96) ** 2 / (2 ** 192);
  
  // Adjust for decimals
  const decimalAdjustment = 10 ** (decimalsToken1 - decimalsToken0);
  return price * decimalAdjustment;
}