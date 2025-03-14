'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, FileIcon, Image, FileText, Film, Link, Music, Archive, Code, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WebHashClient } from '@/lib/webhash-client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { getWalletAddressFromUser } from '@/lib/wallet-utils';
import { useAccount } from 'wagmi';

interface FileItem {
  fileName: string;
  cid: string;
  size: string;
  mimeType: string;
  lastUpdate: string;
  formattedSize: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.startsWith('text/')) return FileText;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive;
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return Code;
  return FileIcon;
};

const getFileColor = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'text-blue-500';
  if (mimeType.startsWith('video/')) return 'text-purple-500';
  if (mimeType.startsWith('audio/')) return 'text-pink-500';
  if (mimeType.startsWith('text/')) return 'text-yellow-500';
  if (mimeType.includes('pdf')) return 'text-red-500';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'text-green-500';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return 'text-orange-500';
  return 'text-gray-500';
};

// Add this CSS class right after imports
const scrollableContainerClass = `
  h-[calc(100vh-16rem)] 
  overflow-y-auto 
  px-1
  scrollbar-none
  [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:'none']
  [scrollbar-width:'none']
`;

export function FileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { address } = useAccount();
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);

  const loadFiles = useCallback(async (walletAddress: string) => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const client = WebHashClient.getInstance();
      const files = await client.getUploads(walletAddress);
      setFiles(files);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const walletAddress = getWalletAddressFromUser(user) || address;
    
    // Only reload if wallet address has changed
    if (walletAddress && walletAddress !== currentWallet) {
      setCurrentWallet(walletAddress);
      loadFiles(walletAddress);
    }
  }, [user, address, currentWallet, loadFiles]);

  const handleDownload = async (file: FileItem) => {
    try {
      const url = `https://ipfs.io/ipfs/${file.cid}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEBHASH_API_KEY}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success('File download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('CID copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy CID');
    }
  };

  const handleView = (file: FileItem) => {
    const url = `https://ipfs.io/ipfs/${file.cid}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No files uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className={scrollableContainerClass}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-4">
        {files.map((file) => {
          const FileIconComponent = getFileIcon(file.mimeType);
          const isImage = file.mimeType.startsWith('image/');
          const fileUrl = `https://ipfs.io/ipfs/${file.cid}`;
          const iconColor = getFileColor(file.mimeType);

          return (
            <Card key={file.cid} className="overflow-hidden bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="h-48 relative bg-gray-50 dark:bg-gray-900 cursor-pointer" onClick={() => handleView(file)}>
                {isImage ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <FileIconComponent className={`w-16 h-16 ${iconColor} animate-pulse`} />
                    </div>
                    <img
                      src={fileUrl}
                      alt={file.fileName}
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.querySelector('.bg-gray-100')!.classList.remove('animate-pulse');
                      }}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <FileIconComponent className={`w-20 h-20 ${iconColor}`} />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium truncate" title={file.fileName}>
                  {file.fileName}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {file.formattedSize}
                  </p>
                  <span className="text-gray-300">•</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(file.lastUpdate).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1" title={file.cid}>
                    CID: {file.cid}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(file.cid)}
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(file)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { FileList as default }; 