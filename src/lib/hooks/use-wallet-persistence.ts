import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

/**
 * Custom hook to handle wallet persistence
 * This hook will automatically reconnect to the wallet when the page is refreshed
 * Updated for RainbowKit v2 and Wagmi v2
 */
export function useWalletPersistence() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  // Attempt to reconnect on initial load
  useEffect(() => {
    // Only try to reconnect once
    if (reconnectAttempted) return;
    
    const attemptReconnect = async () => {
      try {
        // Check if there's a previously connected wallet in localStorage
        const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
        const lastConnectedAddress = localStorage.getItem('lastConnectedAddress');
        
        // If we're not connected but have a previously connected wallet, try to reconnect
        if (!isConnected && lastConnectedWallet) {
          console.log('Attempting to reconnect to wallet:', lastConnectedWallet, 'address:', lastConnectedAddress);
          
          // Find the connector that matches the stored wallet type
          const connector = connectors.find(c => c.id === lastConnectedWallet);
          
          if (connector) {
            // Try to reconnect using the stored connector
            try {
              await connect({ connector });
              console.log('Reconnection successful');
            } catch (connectError) {
              console.warn('Could not automatically reconnect:', connectError);
              // Clear the stored wallet if reconnection fails
              localStorage.removeItem('lastConnectedWallet');
              localStorage.removeItem('lastConnectedAddress');
            }
          } else {
            console.log('Connector not found for:', lastConnectedWallet);
            // Clear invalid connector from storage
            localStorage.removeItem('lastConnectedWallet');
            localStorage.removeItem('lastConnectedAddress');
          }
        }
      } catch (error) {
        console.error('Error in reconnection process:', error);
      } finally {
        setReconnectAttempted(true);
      }
    };

    // Add a small delay to ensure the connectors are ready
    const timer = setTimeout(() => {
      attemptReconnect();
    }, 1500); // Increased delay to ensure RainbowKit is fully initialized

    // Also attempt reconnect when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('Page became visible, attempting reconnect');
        attemptReconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connect, connectors, reconnectAttempted]);

  // Save the current wallet type when connected
  useEffect(() => {
    if (isConnected && address) {
      const activeConnector = connectors.find(c => c.connected);
      if (activeConnector) {
        console.log('Saving connected wallet to localStorage:', activeConnector.id, 'address:', address);
        localStorage.setItem('lastConnectedWallet', activeConnector.id);
        localStorage.setItem('lastConnectedAddress', address);
      }
    }
  }, [isConnected, connectors, address]);

  // Listen for wallet disconnection events
  useEffect(() => {
    if (!isConnected) {
      // If disconnected, update the UI accordingly
      console.log('Wallet disconnected');
    }
  }, [isConnected]);

  // Handle window unload events to ensure wallet state is preserved
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isConnected) {
        // Ensure the wallet state is saved before the page unloads
        const activeConnector = connectors.find(c => c.connected);
        if (activeConnector && address) {
          localStorage.setItem('lastConnectedWallet', activeConnector.id);
          localStorage.setItem('lastConnectedAddress', address);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, connectors, address]);

  return { isConnected };
} 