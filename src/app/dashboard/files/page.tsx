'use client';

import { usePrivy } from "@privy-io/react-auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Copy, Check } from "lucide-react";
import { WebHashClient } from "@/lib/webhash-client";
import { toast } from "sonner";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';
import { Card } from "@/components/ui/card";

interface FileItem {
  fileName: string;
  cid: string;
  size: string;
  mimeType: string;
  lastUpdate: string;
}

export default function FilesPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCid, setCopiedCid] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated) {
      loadFiles();
    }
  }, [authenticated]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const client = WebHashClient.getInstance();
      const files = await client.getUploads(user?.wallet?.address || '');
      setFiles(files);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCopy = async (cid: string) => {
    try {
      await navigator.clipboard.writeText(cid);
      setCopiedCid(cid);
      setTimeout(() => setCopiedCid(null), 2000);
      toast.success('CID copied to clipboard');
    } catch (error) {
      console.error('Error copying CID:', error);
      toast.error('Failed to copy CID');
    }
  };

  if (!ready || !authenticated) {
    return null;
  }

  const walletAddress = getWalletAddressFromUser(user);
  const isWalletReady = !!walletAddress;

  if (!isWalletReady) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Files</h2>
            <p className="text-muted-foreground">
              View and manage your uploaded files.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
            <p>Waiting for your wallet to be ready. This usually takes a few moments after login.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Files</h2>
          <p className="text-muted-foreground">
            View and manage your uploaded files.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.cid} className="p-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-medium truncate" title={file.fileName}>
                  {file.fileName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.lastUpdate}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1" title={file.cid}>
                    CID: {file.cid}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(file.cid)}
                  >
                    {copiedCid === file.cid ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const url = `${process.env.NEXT_PUBLIC_WEBHASH_API_URL}/ipfs/${file.cid}`;
                      const authUrl = `${url}?authorization=${process.env.NEXT_PUBLIC_WEBHASH_API_KEY}`;
                      window.open(authUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}