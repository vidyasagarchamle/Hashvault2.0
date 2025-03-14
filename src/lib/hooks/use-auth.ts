'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [ready, setReady] = useState(false);

  // Simulate the Privy ready state
  useEffect(() => {
    setReady(true);
  }, []);

  // Create a user object similar to Privy's user object
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