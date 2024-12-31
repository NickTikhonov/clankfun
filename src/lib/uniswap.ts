import axios from "axios";
import { env } from "~/env";

type VolumeTokenData = {
  id: string;
  name: string;
  address: string;
  symbol: string;
  market: {
    totalValueLocked: {
      id: string;
      value: number;
      currency: string;
    };
    price: {
      id: string;
      value: number;
      currency: string;
    };
    volume24H: {
      id: string;
      value: number;
      currency: string;
    };
  };
};

type TxCountTokenData = {
  id: string;
  txCount: string;
};

type TokensMetadatType = Record<string, Record<string | symbol, number>>

function volumeQueryBuilder(token: string, key: string) {
  return `
    
  ${key}: token(
    chain: BASE
    address: "${token}"
  ) {
    id
    name
    address
    symbol
    market(currency: USD) {
      totalValueLocked {
        id
        value
        currency
      }
      price {
        id
        value
        currency
      }
      volume24H: volume(duration: DAY) {
        id
        value
        currency
      }
    }
  }
  `;
}

function txCountQueryBuilder(token: string, key: string) {
  return `
    
  ${key}:token(id: "${token}") {
    id
    txCount
  }
  `;
}

export async function uniswapTokenTxCount(
  clankers: { contract_address: string }[],
) {
  let queryBody = ``;
  clankers.forEach((c, index) => {
    queryBody += txCountQueryBuilder(c.contract_address, `token${index}`);
  });
  const queryObject = `{
    ${queryBody}
    }`;
  const tokensMetadata: TokensMetadatType = {};

  const {
    data: { data: tokensData },
  } = await axios.post<{ data: Record<string, TxCountTokenData> }>(
    env.UNISWAP_GRAPH_URL,
    { query: queryObject },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  Object.entries(tokensData).forEach(([key, value]) => {
    tokensMetadata[key] = {
      txCount: parseFloat(value?.txCount || "0"),
    };
  });
  return tokensMetadata;
}
export async function uniswapTokensVolume(
  clankers: { contract_address: string }[],
) {
  let queryBody = ``;
  clankers.forEach((c, index) => {
    queryBody += volumeQueryBuilder(c.contract_address, `token${index}`);
  });
  const queryObject = `{
    ${queryBody}
    }`;
  const tokensMetadata: TokensMetadatType = {};

  const {
    data: { data: tokensData },
  } = await axios.post<{ data: Record<string, VolumeTokenData> }>(
    env.UNISWAP_INTERFACE_URL,
    { query: queryObject },
    {
      headers: {
        "Content-Type": "application/json",
        origin: "https://app.uniswap.org",
      },
    },
  );

  Object.entries(tokensData).forEach(([key, value]) => {
    tokensMetadata[key] = {
      volume24H: value?.market?.volume24H?.value || 0,
    };
  });
  return tokensMetadata;
}
