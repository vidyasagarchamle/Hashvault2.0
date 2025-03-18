'use client';

import { FileUpload } from "@/components/upload/file-upload";
import FileList from "@/components/files/file-list";
import { StoragePurchase } from "@/components/dashboard/StoragePurchase";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAccount } from "wagmi";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';

interface DashboardContentProps {
  view: 'upload' | 'files';
  onViewChange?: (view: 'upload' | 'files') => void;
}

export function DashboardContent({ view, onViewChange }: DashboardContentProps) {
  const { user } = useAuth();
  const { address } = useAccount();
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [showStoragePurchase, setShowStoragePurchase] = useState(true);

  useEffect(() => {
    if (user) {
      const walletAddress = getWalletAddressFromUser(user) || address;
      setIsWalletReady(!!walletAddress);
    } else if (address) {
      setIsWalletReady(true);
    }
  }, [user, address]);

  const handleUploadComplete = () => {
    // Switch to the files view when upload is complete
    if (onViewChange) {
      onViewChange('files');
    }
  };

  if (!isWalletReady) {
    return (
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-300">Please connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div>
      {view === 'upload' ? (
        <>
          <FileUpload onUploadComplete={handleUploadComplete} />
          {showStoragePurchase && (
            <div className="mt-8">
              <StoragePurchase onClose={() => setShowStoragePurchase(false)} />
            </div>
          )}
        </>
      ) : (
        <FileList />
      )}
    </div>
  );
} 