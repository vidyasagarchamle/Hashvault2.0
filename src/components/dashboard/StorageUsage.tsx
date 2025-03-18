"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FREE_STORAGE_LIMIT } from '@/lib/constants';
import { useAuth } from '@/lib/hooks/use-auth';
import { StoragePurchase } from './StoragePurchase';
import { getWalletAddressFromUser } from '@/lib/wallet-utils';
import { storageUpdateEvent, STORAGE_UPDATED } from '@/lib/events';

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Storage information type
 */
interface StorageInfo {
  totalStorageUsed: number;
  totalAvailableStorage: number;
  filesCount: number;
}

/**
 * Storage Usage Component
 * Displays current storage usage information for the user
 */
export default function StorageUsage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [storage, setStorage] = useState<StorageInfo>({
    totalStorageUsed: 0,
    totalAvailableStorage: FREE_STORAGE_LIMIT,
    filesCount: 0
  });

  /**
   * Fetch storage information from the API
   */
  async function fetchStorage() {
    const walletAddress = getWalletAddressFromUser(user);
    if (!walletAddress) return;

    try {
      setLoading(true);
      const res = await fetch('/api/storage/info', {
        headers: { 'Authorization': walletAddress },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch storage info: ${res.status}`);
      }

      const data = await res.json();
      
      if (data && typeof data.totalStorageUsed === 'number') {
        setStorage({
          totalStorageUsed: data.totalStorageUsed,
          totalAvailableStorage: Math.max(FREE_STORAGE_LIMIT, data.totalAvailableStorage || FREE_STORAGE_LIMIT),
          filesCount: data.filesCount || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch storage info:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch storage info when user connects
  useEffect(() => {
    if (user?.wallet?.address) {
      fetchStorage();
    }
  }, [user?.wallet?.address]);

  // Listen for storage update events
  useEffect(() => {
    const handleStorageUpdate = () => {
      fetchStorage();
    };

    storageUpdateEvent.addEventListener(STORAGE_UPDATED, handleStorageUpdate);
    
    return () => {
      storageUpdateEvent.removeEventListener(STORAGE_UPDATED, handleStorageUpdate);
    };
  }, []);

  // Calculate usage percentage
  const usagePercent = (storage.totalStorageUsed / storage.totalAvailableStorage) * 100;
  const displayPercent = storage.totalStorageUsed > 0 ? Math.max(1, Math.min(100, usagePercent)) : 0;

  if (!user) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">Connect your wallet to view storage usage</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Storage Usage</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStorage}
              disabled={loading}
              className="p-1 h-auto"
              aria-label="Refresh storage info"
            >
              <RefreshCw className={cn(
                "w-4 h-4 text-gray-500",
                loading && "animate-spin"
              )} />
            </Button>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {storage.filesCount} {storage.filesCount === 1 ? 'File' : 'Files'}
            </span>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {formatBytes(storage.totalStorageUsed)} of {formatBytes(storage.totalAvailableStorage)}
            </span>
            <span>{usagePercent.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                usagePercent > 90 ? "bg-red-600" : "bg-blue-600"
              )}
              style={{ width: `${displayPercent}%` }}
              role="progressbar"
              aria-valuenow={Math.round(usagePercent)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Storage Info */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatBytes(storage.totalAvailableStorage - storage.totalStorageUsed)} available</span>
          <span>{storage.filesCount} {storage.filesCount === 1 ? 'file' : 'files'} stored</span>
        </div>

        {/* Purchase Button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowPurchase(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Purchase More Storage
        </Button>
      </div>

      {/* Purchase Modal */}
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