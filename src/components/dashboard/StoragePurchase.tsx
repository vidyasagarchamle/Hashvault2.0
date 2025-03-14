"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { STORAGE_PLAN_SIZE, STORAGE_PLAN_PRICE } from '@/lib/constants';
import { storageUpdateEvent, STORAGE_UPDATED } from "./StorageUsage";
import { parseEther } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { useAuth } from "@/lib/hooks/use-auth";

interface StoragePurchaseProps {
  onClose: () => void;
}

export function StoragePurchase({ onClose }: StoragePurchaseProps) {
  const { ready } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  const fetchEthPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      return null;
    }
  };

  const handlePurchase = async () => {
    if (!ready || !isConnected || !address || !walletClient) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      
      // Get current ETH price
      const currentEthPrice = await fetchEthPrice();
      if (!currentEthPrice) {
        throw new Error('Failed to fetch ETH price');
      }
      
      // Convert USD price to ETH
      const ethAmount = STORAGE_PLAN_PRICE / currentEthPrice;
      console.log(`Converting $${STORAGE_PLAN_PRICE} to ETH: ${ethAmount} ETH`);
      
      // Convert ETH amount to Wei
      const priceInWei = parseEther(ethAmount.toFixed(18));
      
      // Send transaction
      const txHash = await walletClient.sendTransaction({
        to: process.env.NEXT_PUBLIC_PAYMENT_ADDRESS as `0x${string}`,
        value: priceInWei,
      });
      
      toast.info('Transaction submitted, waiting for confirmation...');
      
      // Call the storage purchase API
      const purchaseResponse = await fetch('/api/storage/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': address
        },
        body: JSON.stringify({
          transactionHash: txHash
        })
      });

      if (!purchaseResponse.ok) {
        throw new Error('Failed to process storage purchase');
      }

      toast.success('Successfully purchased additional storage!');
      
      // Trigger storage update
      storageUpdateEvent.dispatchEvent(new Event(STORAGE_UPDATED));
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Storage purchase error:', error);
      toast.error('Failed to purchase storage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatStorage = (bytes: number) => {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)}GB`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Purchase Additional Storage</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <p className="text-sm text-gray-500">
          Extend your storage capacity with our premium plan
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium">{formatStorage(STORAGE_PLAN_SIZE)} Storage Plan</h4>
              <p className="text-sm text-gray-500">Additional storage space</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">${STORAGE_PLAN_PRICE}</p>
              <p className="text-xs text-gray-500">One-time payment</p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handlePurchase}
            disabled={loading || !ready || !isConnected || !address || !walletClient}
          >
            {loading ? 'Processing...' : 'Purchase Now'}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>• Storage space is added to your account immediately after purchase</p>
          <p>• One-time payment, no recurring fees</p>
          <p>• Purchase multiple plans if you need more space</p>
          <p>• Payment will be processed in ETH at current market rate</p>
        </div>
      </div>
    </Card>
  );
} 