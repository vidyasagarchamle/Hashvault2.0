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
import { LighthouseDirectClient } from "@/lib/lighthouse-direct-client";
import { toast } from "sonner";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';

interface UploadedFile {
  _id: string;
  fileName: string;
  cid: string;
  size: string;
  lastUpdate: string;
  mimeType: string;
}

export default function FilesPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
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
    // Log the full user object for debugging
    console.log("FILES PAGE - FULL USER OBJECT:", user);

    // Get wallet address using our utility function
    const walletAddress = getWalletAddressFromUser(user);

    if (!walletAddress) {
      console.error('No wallet address available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const client = LighthouseDirectClient.getInstance();
      const uploads = await client.getUploads(walletAddress);
      
      if (uploads && Array.isArray(uploads)) {
        setFiles(uploads);
      } else {
        console.error('Invalid uploads format:', uploads);
        toast.error('Received invalid data format from storage provider');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files. Please try again later.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const url = `https://gateway.lighthouse.storage/ipfs/${file.cid}`;
      const response = await fetch(url);
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

  const handleViewFile = (file: UploadedFile) => {
    // For images, PDFs, and videos, we can use the gateway URL directly
    const directViewTypes = ['image/', 'application/pdf', 'video/'];
    const isDirectViewable = directViewTypes.some(type => file.mimeType.startsWith(type));
    
    if (isDirectViewable) {
      const url = `https://gateway.lighthouse.storage/ipfs/${file.cid}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // For other file types, trigger download
      handleDownload(file);
      toast.info('File type requires download to view');
    }
  };

  const handleCopyCid = async (cid: string) => {
    try {
      await navigator.clipboard.writeText(cid);
      setCopiedCid(cid);
      toast.success('CID copied to clipboard');
      setTimeout(() => setCopiedCid(null), 2000);
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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>CID</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No files uploaded yet
                  </TableCell>
                </TableRow>
              ) :
                files.map((file) => (
                  <TableRow key={`${file._id}-${file.cid}`}>
                    <TableCell>{file.fileName}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{file.mimeType}</TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px]" title={file.cid}>
                          {file.cid}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCid(file.cid)}
                          title="Copy CID"
                        >
                          {copiedCid === file.cid ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{file.lastUpdate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewFile(file)}
                          title="View file"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}