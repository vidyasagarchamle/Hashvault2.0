'use client';

import { PrivyProvider } from "@privy-io/react-auth";

export function PrivyClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a hardcoded app ID if the environment variable is not available
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clrz1v1ij00yt9s2ggpkn1g9y";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet", "google", "apple"],
        appearance: {
          theme: "dark",
          accentColor: "#000000",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        },
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: {
              default: {
                http: ['https://eth.llamarpc.com']
              }
            }
          }
        ]
      }}
    >
      {children}
    </PrivyProvider>
  );
} 