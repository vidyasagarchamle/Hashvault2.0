'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { LighthouseDirectClient } from '@/lib/lighthouse-direct-client';
import { getWalletAddressFromUser } from '@/lib/wallet-utils';
import { Button } from '@/components/ui/button';

export default function TestUpload() {
  const { user } = usePrivy();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const walletAddress = getWalletAddressFromUser(user);
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');
      setProgress(0);
      const client = LighthouseDirectClient.getInstance();
      
      console.log('Starting upload test with file:', {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type
      });

      const uploadResult = await client.uploadFile({
        file,
        walletAddress,
        onProgress: (p) => {
          setProgress(p);
          console.log(`Upload progress: ${p.toFixed(1)}%`);
        }
      });

      console.log('Upload completed:', uploadResult);
      setResult(uploadResult);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
    }
  };

  const handleMultiUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const walletAddress = getWalletAddressFromUser(user);
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');
      setProgress(0);
      const client = LighthouseDirectClient.getInstance();
      
      // Create multiple copies of the file for testing
      const files = [file, file, file, file, file];
      console.log('Starting multi-upload test with files:', files.length);

      const results = await client.uploadFiles(files, walletAddress, (p) => {
        setProgress(p);
        console.log(`Overall upload progress: ${p.toFixed(1)}%`);
      });

      console.log('Multi-upload completed:', results);
      setResult(results);
    } catch (err: any) {
      console.error('Multi-upload failed:', err);
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Upload Test Page</h1>
      
      <div className="space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <div className="space-x-4">
          <Button onClick={handleUpload} disabled={!file}>
            Test Single Upload
          </Button>
          <Button onClick={handleMultiUpload} disabled={!file}>
            Test Multi Upload (5x)
          </Button>
        </div>

        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 mt-2">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Upload Result:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 