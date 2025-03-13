'use client';

import { usePrivy } from "@privy-io/react-auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { FileUpload } from "@/components/upload/file-upload";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

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
    }
  }, [user]);

  // Show a notification for email users
  useEffect(() => {
    if (user && user.email && !user.wallet?.address) {
      const walletAddress = getWalletAddressFromUser(user);
      if (walletAddress) {
        toast.info(
          "You're signed in with email. A virtual wallet has been created for you to store files.",
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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upload Files</h2>
          <p className="text-muted-foreground">
            Securely store and manage your files with HashVault.
          </p>
        </div>
        
        <FileUpload />
      </div>
    </DashboardLayout>
  );
} 