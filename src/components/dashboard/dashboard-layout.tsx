'use client';

import { usePrivy } from "@privy-io/react-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LogOut, Upload, Files } from "lucide-react";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';
import StorageUsage from "./StorageUsage";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = usePrivy();

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
    if (user?.email?.address) {
      return user.email.address;
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
          <div className="col-span-12 md:col-span-3 space-y-6">
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
            <StorageUsage />
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