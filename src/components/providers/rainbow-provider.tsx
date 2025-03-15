'use client';

import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';

// Ensure we have a valid project ID - hardcoded for reliability
// IMPORTANT: This project ID must be replaced with a valid WalletConnect project ID
// Get your project ID at https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

// Add a warning if using the placeholder
if (projectId === 'YOUR_WALLETCONNECT_PROJECT_ID') {
  console.warn('WARNING: You are using a placeholder WalletConnect project ID. Please replace it with a valid project ID from https://cloud.walletconnect.com/');
}

// Create a hybrid storage that combines localStorage and cookies for better persistence
const hybridStorage = {
  getItem: (key: string) => {
    // Try localStorage first, then fallback to cookies
    if (typeof window !== 'undefined') {
      const localValue = localStorage.getItem(key);
      if (localValue) return localValue;
      
      // Try sessionStorage as fallback
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue) return sessionValue;
    }
    
    // Finally try cookies (for SSR)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
      if (cookie) {
        return cookie.split('=')[1];
      }
    }
    
    return null;
  },
  setItem: (key: string, value: string) => {
    // Store in multiple places for redundancy
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        sessionStorage.setItem(key, value);
      } catch (e) {
        console.warn('Error storing wallet data in storage:', e);
      }
    }
    
    // Also set as cookie with 7-day expiry for persistence
    if (typeof document !== 'undefined') {
      const date = new Date();
      date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      document.cookie = `${key}=${value};expires=${date.toUTCString()};path=/;SameSite=Strict`;
    }
  },
  removeItem: (key: string) => {
    // Remove from all storage types
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    
    // Remove cookie
    if (typeof document !== 'undefined') {
      document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
    }
  }
};

// Create a custom storage that uses our hybrid approach
const storage = createStorage({
  storage: typeof window !== 'undefined' ? hybridStorage : cookieStorage,
});

// Create the wagmi config with RainbowKit's getDefaultConfig
const config = getDefaultConfig({
  appName: 'HashVault',
  projectId: projectId,
  chains: [base, mainnet],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  // Enable auto-connect for better user experience
  ssr: true,
  storage,
});

// Create a new QueryClient for React Query with longer cache times
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      gcTime: 900000, // 15 minutes
    },
  },
});

export function RainbowKitClientProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until component is mounted to render
  useEffect(() => {
    setMounted(true);
    console.log("RainbowKitClientProvider mounted with projectId:", projectId);
    
    // Force reconnection attempt on page load
    if (typeof window !== 'undefined') {
      // Trigger reconnection with a small delay to ensure everything is loaded
      setTimeout(() => {
        const reconnectEvent = new Event('visibilitychange');
        document.dispatchEvent(reconnectEvent);
        console.log('RainbowKit triggered reconnection event');
      }, 1000);
    }
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
      <WagmiProvider config={config}>
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
          showRecentTransactions={true}
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 