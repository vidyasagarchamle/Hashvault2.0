'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';

/**
 * Custom authentication hook using RainbowKit/Wagmi
 * 
 * This provides a unified interface for authentication throughout the app
 * It follows a similar structure to the previous Privy implementation for compatibility
 */
export function useAuth() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [ready, setReady] = useState(false);

  // Mark authentication as ready after initial render
  useEffect(() => {
    setReady(true);
  }, []);

  // Create a user object with wallet information
  const user = isConnected && address
    ? {
        wallet: {
          address: address,
        },
        id: address,
        linkedAccounts: [
          {
            type: 'wallet',
            address: address,
          }
        ],
      }
    : null;

  return {
    ready,
    authenticated: isConnected,
    user,
    login: openConnectModal,
    logout: disconnect,
    getWalletAddress: () => address,
  };
} 