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
  const [reconnectSuccess, setReconnectSuccess] = useState(false);

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
              setReconnectSuccess(true);
            } catch (connectError: any) {
              console.warn('Could not automatically reconnect:', connectError);
              // Don't clear storage on first failure - we'll try again on visibility change
              if (connectError.message?.includes('User rejected')) {
                // Only clear if user explicitly rejected
                localStorage.removeItem('lastConnectedWallet');
                localStorage.removeItem('lastConnectedAddress');
              }
            }
          } else {
            console.log('Connector not found for:', lastConnectedWallet);
            // Clear invalid connector from storage
            localStorage.removeItem('lastConnectedWallet');
            localStorage.removeItem('lastConnectedAddress');
          }
        } else if (isConnected) {
          console.log('Already connected, no need to reconnect');
          setReconnectSuccess(true);
        }
      } catch (error) {
        console.error('Error in reconnection process:', error);
      } finally {
        setReconnectAttempted(true);
      }
    };

    // Add a delay to ensure the connectors are ready
    const timer = setTimeout(() => {
      attemptReconnect();
    }, 2500); // Increased delay to ensure RainbowKit is fully initialized

    // Also attempt reconnect when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking connection status');
        if (!isConnected && !reconnectSuccess) {
          console.log('Not connected, attempting reconnect');
          attemptReconnect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connect, connectors, reconnectAttempted, reconnectSuccess]);

  // Save the current wallet type when connected
  useEffect(() => {
    if (isConnected && address) {
      const activeConnector = connectors.find(c => c.connected);
      if (activeConnector) {
        console.log('Saving connected wallet to localStorage:', activeConnector.id, 'address:', address);
        localStorage.setItem('lastConnectedWallet', activeConnector.id);
        localStorage.setItem('lastConnectedAddress', address);
        
        // Also save to sessionStorage for more reliable persistence
        sessionStorage.setItem('lastConnectedWallet', activeConnector.id);
        sessionStorage.setItem('lastConnectedAddress', address);
      }
    }
  }, [isConnected, connectors, address]);

  // Listen for wallet disconnection events
  useEffect(() => {
    if (!isConnected) {
      // If disconnected, update the UI accordingly
      console.log('Wallet disconnected');
      
      // Check if this was an intentional disconnect
      const wasConnected = localStorage.getItem('lastConnectedWallet');
      if (wasConnected) {
        console.log('Unexpected disconnect, will attempt to reconnect on next visibility change');
      }
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
          
          // Also save to sessionStorage for more reliable persistence
          sessionStorage.setItem('lastConnectedWallet', activeConnector.id);
          sessionStorage.setItem('lastConnectedAddress', address);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, connectors, address]);

  return { isConnected, reconnectSuccess };
} 