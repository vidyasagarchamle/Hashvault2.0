'use client';

import { ReactNode, useEffect } from 'react';
import { useWalletPersistence } from '@/lib/hooks/use-wallet-persistence';

interface WalletPersistenceProviderProps {
  children: ReactNode;
}

export function WalletPersistenceProvider({ children }: WalletPersistenceProviderProps) {
  // Use our custom hook to handle wallet persistence
  useWalletPersistence();
  
  return <>{children}</>;
} 