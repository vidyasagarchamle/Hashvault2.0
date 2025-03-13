'use client';

import { PrivyProvider } from "@privy-io/react-auth";
import { useTheme } from "next-themes";

export function PrivyClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet", "google", "apple"],
        appearance: {
          theme: theme === "dark" ? "dark" : "light",
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