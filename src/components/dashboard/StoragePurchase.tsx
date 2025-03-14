"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { STORAGE_PLAN_SIZE, STORAGE_PLAN_PRICE } from '@/lib/constants';
import { storageUpdateEvent, STORAGE_UPDATED } from "./StorageUsage";
import { parseUnits } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { useAuth } from "@/lib/hooks/use-auth";

// USDT Contract address on Base network
const USDT_CONTRACT_ADDRESS = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"; // Base USDT address

// ERC20 transfer function ABI
const ERC20_TRANSFER_ABI = [
  {
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface StoragePurchaseProps {
  onClose: () => void;
}

export function StoragePurchase({ onClose }: StoragePurchaseProps) {
  const { ready } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!ready || !isConnected || !address || !walletClient) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      
      // USDT has 6 decimals on Base
      const usdtDecimals = 6;
      
      // Convert USD price to USDT amount with proper decimals
      // For USDT, 1 USDT = 1 USD, so the conversion is straightforward
      const usdtAmount = parseUnits(STORAGE_PLAN_PRICE.toString(), usdtDecimals);
      
      console.log(`Sending ${STORAGE_PLAN_PRICE} USDT`);
      
      // Send USDT transaction using the ERC20 transfer function
      const txHash = await walletClient.writeContract({
        address: USDT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [
          process.env.NEXT_PUBLIC_PAYMENT_ADDRESS as `0x${string}`,
          usdtAmount
        ]
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
          transactionHash: txHash,
          paymentMethod: 'USDT',
          network: 'Base'
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
          <p>• Payment will be processed in USDT on the Base network</p>
          <p>• Make sure your wallet is connected to the Base network</p>
        </div>
      </div>
    </Card>
  );
} 