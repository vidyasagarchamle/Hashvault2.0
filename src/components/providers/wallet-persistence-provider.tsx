'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useWalletPersistence } from '@/lib/hooks/use-wallet-persistence';
import { useAccount } from 'wagmi';

interface WalletPersistenceProviderProps {
  children: ReactNode;
}

export function WalletPersistenceProvider({ children }: WalletPersistenceProviderProps) {
  const [initialized, setInitialized] = useState(false);
  // Use our custom hook to handle wallet persistence
  const { isConnected, reconnectSuccess } = useWalletPersistence();
  const { address } = useAccount();
  
  // Log connection status changes
  useEffect(() => {
    if (initialized) {
      console.log('Wallet connection status changed:', isConnected ? 'connected' : 'disconnected');
      if (isConnected && address) {
        console.log('Connected wallet address:', address);
      }
    } else {
      setInitialized(true);
    }
  }, [isConnected, address, initialized]);
  
  // Log reconnection success
  useEffect(() => {
    if (reconnectSuccess) {
      console.log('Wallet reconnection was successful');
    }
  }, [reconnectSuccess]);
  
  // Force reconnection attempt when the component mounts
  useEffect(() => {
    // Attempt to reconnect on initial load
    const attemptReconnect = () => {
      if (typeof window !== 'undefined') {
        // Trigger a visibility change event to force reconnection
        const reconnectEvent = new Event('visibilitychange');
        document.dispatchEvent(reconnectEvent);
        console.log('Triggered reconnection event');
      }
    };
    
    // Add a delay to ensure everything is loaded
    const timer = setTimeout(() => {
      attemptReconnect();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <>{children}</>;
} 