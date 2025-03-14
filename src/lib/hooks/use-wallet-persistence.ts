import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

/**
 * Custom hook to handle wallet persistence
 * This hook will automatically reconnect to the wallet when the page is refreshed
 */
export function useWalletPersistence() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  // Attempt to reconnect on initial load
  useEffect(() => {
    // Only try to reconnect once
    if (reconnectAttempted) return;
    
    const attemptReconnect = async () => {
      try {
        // Check if there's a previously connected wallet in localStorage
        const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
        
        // If we're not connected but have a previously connected wallet, try to reconnect
        if (!isConnected && lastConnectedWallet) {
          console.log('Attempting to reconnect to wallet:', lastConnectedWallet);
          
          // Find the connector that matches the stored wallet type
          const connector = connectors.find(c => c.id === lastConnectedWallet);
          
          if (connector) {
            // Try to reconnect using the stored connector
            await connect({ connector });
            console.log('Reconnection successful');
          } else {
            console.log('Connector not found for:', lastConnectedWallet);
          }
        }
      } catch (error) {
        console.error('Error reconnecting to wallet:', error);
      } finally {
        setReconnectAttempted(true);
      }
    };

    // Add a small delay to ensure the connectors are ready
    const timer = setTimeout(() => {
      attemptReconnect();
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, connect, connectors, reconnectAttempted]);

  // Save the current wallet type when connected
  useEffect(() => {
    if (isConnected) {
      const activeConnector = connectors.find(c => c.connected);
      if (activeConnector) {
        console.log('Saving connected wallet to localStorage:', activeConnector.id);
        localStorage.setItem('lastConnectedWallet', activeConnector.id);
      }
    }
  }, [isConnected, connectors]);

  return { isConnected };
} 