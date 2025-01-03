"use client"

import {
  base,
  mainnet
} from 'wagmi/chains';
import { http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { env } from '~/env';
import { Analytics } from "@vercel/analytics/react"
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig } from '@privy-io/wagmi';
import { WagmiProvider } from '@privy-io/wagmi';

const config = createConfig({
  chains: [mainnet, base],
  transports: {
    [base.id]: http(env.NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT),
    [mainnet.id]: http(),
  }
});


const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: 'https://clank.fun/logo.png',
          walletList: ['metamask', 'wallet_connect', 'phantom', 'rainbow', 'coinbase_wallet', 'rabby_wallet'],
          walletChainType: 'ethereum-only',
        },
        walletConnectCloudProjectId: "562e09c2f744bbd6cf65d85eb7e0bb78",
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
        <Analytics />
    </PrivyProvider>
  );
}