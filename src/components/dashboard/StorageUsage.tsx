"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { StoragePurchase } from "./StoragePurchase";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAccount } from "wagmi";
import { getWalletAddressFromUser } from "@/lib/wallet-utils";
import { RefreshCw } from "lucide-react";

interface StorageInfo {
  used: number;
  total: number;
  remaining: number;
  purchased: number;
}

// Create a custom event for storage updates
export const storageUpdateEvent = new EventTarget();
export const STORAGE_UPDATED = 'storage_updated';

// Default storage info for fallback
const DEFAULT_STORAGE_INFO: StorageInfo = {
  used: 0,
  total: FREE_STORAGE_LIMIT,
  remaining: FREE_STORAGE_LIMIT,
  purchased: 0
};

export default function StorageUsage() {
  const { user } = useAuth();
  const { address } = useAccount();
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(DEFAULT_STORAGE_INFO);
  const [loading, setLoading] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);
  
  // Use a ref to track the last fetch time to prevent excessive calls
  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 10000; // 10 seconds minimum between fetches

  // Get wallet address for display
  const walletAddress = getWalletAddressFromUser(user) || address;

  // Function to fetch storage info
  async function fetchStorageInfo(force = false) {
    if (!walletAddress) {
      console.log("No wallet address available for storage info");
      return;
    }
    
    // Check if we've fetched recently and this isn't a forced refresh
    const now = Date.now();
    if (!force && now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
      console.log("Skipping fetch - too soon since last fetch");
      return;
    }
    
    // Update last fetch time
    lastFetchTime.current = now;

    try {
      if (isMounted.current) {
        setRefreshing(true);
      }
      
      console.log("Fetching storage info with address:", walletAddress);
      // Try to fetch from API
      const response = await fetch('/api/storage/info', {
        headers: {
          'Authorization': walletAddress
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch storage info');
      }

      const data = await response.json();
      console.log("Storage info received:", data);
      
      if (isMounted.current) {
        setStorageInfo({
          used: data.totalStorageUsed || 0,
          total: data.totalAvailableStorage || FREE_STORAGE_LIMIT,
          remaining: data.remainingStorage || FREE_STORAGE_LIMIT,
          purchased: data.totalStoragePurchased || 0
        });
        setApiError(false);
      }
    } catch (error) {
      console.error('Error fetching storage info:', error);
      
      if (isMounted.current) {
        setApiError(true);
      }
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }

  // Listen for storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      fetchStorageInfo(true);
    };

    storageUpdateEvent.addEventListener(STORAGE_UPDATED, handleStorageUpdate);
    return () => {
      storageUpdateEvent.removeEventListener(STORAGE_UPDATED, handleStorageUpdate);
    };
  }, [walletAddress]);

  // Fetch on initial mount and when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchStorageInfo(true);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [walletAddress]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (!walletAddress) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please connect your wallet to view storage information.
        </p>
      </Card>
    );
  }

  // Calculate usage percentages
  const usagePercentage = (storageInfo.used / storageInfo.total) * 100;
  const freeStorageUsed = Math.min(storageInfo.used, FREE_STORAGE_LIMIT);
  const freeStoragePercentage = (freeStorageUsed / FREE_STORAGE_LIMIT) * 100;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Storage Usage</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchStorageInfo(true)} 
              disabled={refreshing}
              className="p-1 h-auto"
            >
              <RefreshCw className={cn(
                "w-4 h-4 text-gray-500",
                refreshing && "animate-spin"
              )} />
            </Button>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-100">
              Free Tier
            </span>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                Using estimated storage data. API connection failed.
              </div>
            )}

            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Free Storage ({formatBytes(FREE_STORAGE_LIMIT)})
                </p>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      freeStoragePercentage > 90 ? "bg-red-600" : "bg-blue-600"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, freeStoragePercentage))}%` }}
                  ></div>
                </div>
              </div>

              {storageInfo.purchased > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Purchased Storage ({formatBytes(storageInfo.purchased)})
                  </p>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (storageInfo.used - freeStorageUsed) / storageInfo.purchased * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {formatBytes(storageInfo.remaining)} remaining
              </span>
              <span>{Math.round(usagePercentage)}% used</span>
            </div>
          </>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowPurchase(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Purchase More Storage
        </Button>
      </div>

      {showPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <StoragePurchase onClose={() => setShowPurchase(false)} />
          </div>
        </div>
      )}
    </Card>
  );
} 