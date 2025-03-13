'use client';

import { usePrivy } from "@privy-io/react-auth";
import { FileUpload } from "@/components/upload/file-upload";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';
import { StoragePurchase } from "@/components/dashboard/StoragePurchase";
import FileList from "@/components/files/file-list";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [isWalletReady, setIsWalletReady] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Add debug logging for Privy user state
  useEffect(() => {
    if (user) {
      console.log("FULL PRIVY USER OBJECT:", user);
      console.log("Linked Accounts:", user.linkedAccounts);
      
      // Check if any property contains an Ethereum address
      const userStr = JSON.stringify(user);
      const addressMatches = userStr.match(/"address":"(0x[a-fA-F0-9]{40})"/g);
      console.log("Found Ethereum addresses in user object:", addressMatches);
      
      console.log("Privy user authenticated:", {
        hasWallet: !!user.wallet?.address,
        hasEmbeddedWallet: !!(user as any).embeddedWallet?.address,
        hasLinkedAccounts: Array.isArray(user.linkedAccounts) && user.linkedAccounts.length > 0,
        authMethods: user.linkedAccounts?.map(acc => acc.type) || []
      });

      // Check wallet readiness
      const walletAddress = getWalletAddressFromUser(user);
      setIsWalletReady(!!walletAddress);
    }
  }, [user]);

  // Show a notification for email users about wallet creation
  useEffect(() => {
    if (user && user.email) {
      const walletAddress = getWalletAddressFromUser(user);
      if (!walletAddress) {
        toast.error(
          "Please wait while we create your embedded wallet. This may take a few moments...",
          { duration: 10000 }
        );
      } else if (!user.wallet?.address) {
        toast.success(
          "Your embedded wallet is ready for storing files.",
          { duration: 6000 }
        );
      }
    }
  }, [user]);

  if (!ready || !authenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Upload and manage your files securely.
          </p>
        </div>

        {isWalletReady ? (
          <FileUpload />
        ) : (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
            <p>Waiting for your wallet to be ready. This usually takes a few moments after login.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 