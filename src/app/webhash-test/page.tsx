'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WebHashClient } from '@/lib/webhash-client';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function WebHashTestPage() {
  const { user } = usePrivy();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.wallet?.address) {
      toast.error('Please select a file and connect your wallet');
      return;
    }

    try {
      setUploading(true);
      const client = WebHashClient.getInstance();
      
      const result = await client.uploadFile({
        file,
        walletAddress: user.wallet.address,
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress}%`);
        }
      });

      setUploadResult(result);
      toast.success('File uploaded successfully!');
      
      // Clear the form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const content = (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WebHash Upload Test</h1>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="text-sm">
              Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading || !user?.wallet?.address}
          >
            {uploading ? 'Uploading...' : 'Upload to WebHash'}
          </Button>

          {uploadResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Upload Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
} 