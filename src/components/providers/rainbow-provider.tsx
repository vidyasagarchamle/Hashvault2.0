'use client';

import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useState, useEffect } from 'react';

// Ensure we have a valid project ID - hardcoded for reliability
const projectId = 'c6c9bacd35167d2e3c2ed97d3a51a7c0';

// Create the wagmi config
const config = getDefaultConfig({
  appName: 'HashVault',
  projectId: projectId,
  chains: [base, mainnet],
  ssr: true,
});

// Create a new QueryClient for React Query
const queryClient = new QueryClient();

export function RainbowKitClientProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until component is mounted to render
  useEffect(() => {
    setMounted(true);
    console.log("RainbowKitClientProvider mounted with projectId:", projectId);
  }, []);

  // Don't render anything until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        <div className="text-white text-center">
          <div className="animate-pulse mb-4">Loading wallet connection...</div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider
          theme={theme === 'dark' ? darkTheme({
            accentColor: '#ffffff',
            accentColorForeground: '#000000',
            borderRadius: 'medium',
          }) : lightTheme({
            accentColor: '#000000',
            accentColorForeground: '#ffffff',
            borderRadius: 'medium',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
} 