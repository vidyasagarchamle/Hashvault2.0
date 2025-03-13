"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { StoragePurchase } from "./StoragePurchase";

interface StorageInfo {
  used: number;
  total: number;
  remaining: number;
  purchased: number;
}

// Create a custom event for storage updates
export const storageUpdateEvent = new EventTarget();
export const STORAGE_UPDATED = 'storage_updated';

export default function StorageUsage() {
  const { user } = usePrivy();
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);

  const fetchStorageInfo = async () => {
    if (!user?.wallet?.address) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/storage/info', {
        headers: {
          'Authorization': user.wallet.address
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch storage info');
      }

      const data = await response.json();
      setStorageInfo({
        used: data.totalStorageUsed,
        total: data.totalAvailableStorage,
        remaining: data.remainingStorage,
        purchased: data.totalStoragePurchased
      });
    } catch (error) {
      console.error('Error fetching storage info:', error);
      toast.error('Failed to load storage information');
    } finally {
      setLoading(false);
    }
  };

  // Listen for storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      fetchStorageInfo();
    };

    storageUpdateEvent.addEventListener(STORAGE_UPDATED, handleStorageUpdate);
    return () => {
      storageUpdateEvent.removeEventListener(STORAGE_UPDATED, handleStorageUpdate);
    };
  }, [user?.wallet?.address]);

  useEffect(() => {
    fetchStorageInfo();
  }, [user?.wallet?.address]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (!user?.wallet?.address) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">
          Please connect your wallet to view storage information.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  if (!storageInfo) return null;

  const usagePercentage = (storageInfo.used / storageInfo.total) * 100;
  const freeStorageUsed = Math.min(storageInfo.used, FREE_STORAGE_LIMIT);
  const freeStoragePercentage = (freeStorageUsed / FREE_STORAGE_LIMIT) * 100;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Storage Usage</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-100">
            Free Tier
          </span>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Free Storage ({formatBytes(FREE_STORAGE_LIMIT)})</p>
            <Progress 
              value={freeStoragePercentage} 
              className={cn(
                "h-2",
                freeStoragePercentage > 90 ? "[&>div]:bg-red-600" : "[&>div]:bg-blue-600"
              )}
            />
          </div>

          {storageInfo.purchased > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Purchased Storage ({formatBytes(storageInfo.purchased)})</p>
              <Progress 
                value={(storageInfo.used - freeStorageUsed) / storageInfo.purchased * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {formatBytes(storageInfo.remaining)} remaining
          </span>
          <span>{Math.round(usagePercentage)}% used</span>
        </div>

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