'use client';

import { useEffect, useState } from 'react';
import { Download, Trash2, FileIcon, Image, FileText, Film, Link } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LighthouseDirectClient } from '@/lib/lighthouse-direct-client';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';

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
  if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return FileText;
  return FileIcon;
};

export function FileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = usePrivy();

  useEffect(() => {
    if (user?.wallet?.address) {
      loadFiles();
    }
  }, [user?.wallet?.address]);

  const loadFiles = async () => {
    try {
      if (!user?.wallet?.address) {
        console.debug('No wallet address available for loading files');
        return;
      }

      const client = LighthouseDirectClient.getInstance();
      const uploads = await client.getUploads(user.wallet.address);
      
      // Map the files to include formatted dates and sizes
      const formattedFiles = uploads.map(file => ({
        ...file,
        lastUpdate: new Date(file.updatedAt).toLocaleString(),
        formattedSize: formatFileSize(parseInt(file.size))
      }));

      setFiles(formattedFiles);
      console.debug('Files loaded:', formattedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDelete = async (cid: string) => {
    try {
      if (!user?.wallet?.address) {
        toast.error('Please connect your wallet first');
        return;
      }

      const client = LighthouseDirectClient.getInstance();
      await client.deleteFile(cid, user.wallet.address);
      await loadFiles(); // Reload the files after deletion
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (file: FileItem) => {
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('CID copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy CID');
    }
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => {
        const FileIconComponent = getFileIcon(file.mimeType);
        const isImage = file.mimeType.startsWith('image/');
        const fileUrl = `https://gateway.lighthouse.storage/ipfs/${file.cid}`;

        return (
          <Card key={file.cid} className="overflow-hidden">
            <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={file.fileName}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FileIconComponent className="w-12 h-12 text-gray-400" />
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
                  {file.lastUpdate}
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
                  onClick={() => handleDelete(file.cid)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
} 