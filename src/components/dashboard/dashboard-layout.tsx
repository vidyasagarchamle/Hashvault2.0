'use client';

import { usePrivy } from "@privy-io/react-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LogOut, Upload, Files } from "lucide-react";
import { useEffect, useState } from "react";
import { LighthouseDirectClient } from "@/lib/lighthouse-direct-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';

interface StorageStats {
  usedStorage: number;  // in bytes
  totalStorage: number; // in bytes
  percentageUsed: number;
}

const FREE_TIER_LIMIT = 1 * 1024 * 1024 * 1024; // 1GB in bytes

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = usePrivy();
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usedStorage: 0,
    totalStorage: FREE_TIER_LIMIT,
    percentageUsed: 0
  });

  useEffect(() => {
    // Log the full user object for debugging
    console.log("DASHBOARD LAYOUT - FULL USER OBJECT:", user);

    // Get wallet address using our utility function
    const walletAddress = getWalletAddressFromUser(user);
    
    if (walletAddress) {
      loadStorageStats(walletAddress);
    }
  }, [user]);

  const loadStorageStats = async (walletAddress: string) => {
    try {
      if (!walletAddress) {
        console.debug('No wallet address available for loading storage stats');
        return;
      }

      console.debug('Loading storage stats for wallet:', walletAddress);
      const client = LighthouseDirectClient.getInstance();
      const uploads = await client.getUploads(walletAddress);
      
      // Calculate total storage used
      const totalUsed = uploads.reduce((acc: number, file: any) => {
        const sizeInBytes = parseInt(file.size, 10) || 0;
        return acc + sizeInBytes;
      }, 0);

      const stats = {
        usedStorage: totalUsed,
        totalStorage: FREE_TIER_LIMIT,
        percentageUsed: (totalUsed / FREE_TIER_LIMIT) * 100
      };

      console.debug('Storage stats calculated:', stats);
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
      // Set default stats on error
      setStorageStats({
        usedStorage: 0,
        totalStorage: FREE_TIER_LIMIT,
        percentageUsed: 0
      });
    }
  };

  const formatStorage = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getUserDisplayName = () => {
    // If user has a wallet, show the wallet address
    if (user?.wallet?.address) {
      return `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`;
    }
    
    // If user has an embedded wallet, show that address
    if ((user as any)?.embeddedWallet?.address) {
      return `${(user as any).embeddedWallet.address.slice(0, 6)}...${(user as any).embeddedWallet.address.slice(-4)}`;
    }
    
    // If user has linked accounts with a wallet, show that address
    const linkedWalletAddress = user?.linkedAccounts?.find(account => account.type === 'wallet')?.address;
    if (linkedWalletAddress) {
      return `${linkedWalletAddress.slice(0, 6)}...${linkedWalletAddress.slice(-4)}`;
    }
    
    // Get deterministic wallet address
    const walletAddress = getWalletAddressFromUser(user);
    if (walletAddress) {
      // For email users, show email instead of the deterministic address
      if (user?.email?.address) {
        return user.email.address;
      }
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }
    
    // If user has an email, show that
    if (user?.email) {
      if (typeof user.email === 'string') {
        return user.email;
      } else if (user.email.address) {
        return user.email.address;
      } else {
        // Find any property that looks like an email
        for (const key in user.email) {
          const value = user.email[key];
          if (typeof value === 'string' && value.includes('@')) {
            return value;
          }
        }
      }
    }
    
    // Default fallback
    return 'User';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size={40} />
              <h1 className="text-xl font-semibold">HashVault</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {getUserDisplayName()}
              </span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-gray-600 hover:text-red-600 dark:text-gray-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                <li>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="/dashboard">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </a>
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="/dashboard/files">
                      <Files className="w-4 h-4 mr-2" />
                      My Files
                    </a>
                  </Button>
                </li>
              </ul>
            </nav>

            {/* Storage Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Storage Usage</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-100">
                  Free Tier
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(storageStats.percentageUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{formatStorage(storageStats.usedStorage)} used</span>
                <span>{formatStorage(storageStats.totalStorage)} free tier limit</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 