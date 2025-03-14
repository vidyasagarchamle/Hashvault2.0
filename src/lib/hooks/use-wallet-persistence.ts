import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

/**
 * Custom hook to handle wallet persistence
 * This hook will automatically reconnect to the wallet when the page is refreshed
 */
export function useWalletPersistence() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Check if there's a previously connected wallet in localStorage
    const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
    
    // If we're not connected but have a previously connected wallet, try to reconnect
    if (!isConnected && lastConnectedWallet) {
      // Find the connector that matches the stored wallet type
      const connector = connectors.find(c => c.id === lastConnectedWallet);
      
      if (connector) {
        // Try to reconnect using the stored connector
        connect({ connector });
      }
    }
  }, [isConnected, connect, connectors]);

  // Save the current wallet type when connected
  useEffect(() => {
    if (isConnected) {
      const activeConnector = connectors.find(c => c.connected);
      if (activeConnector) {
        localStorage.setItem('lastConnectedWallet', activeConnector.id);
      }
    }
  }, [isConnected, connectors]);

  return { isConnected };
} 