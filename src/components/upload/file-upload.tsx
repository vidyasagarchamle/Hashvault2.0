'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileIcon, Image, Music, FileText, Video, FolderUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { WebHashClient } from '@/lib/webhash-client';
import { storageUpdateEvent, STORAGE_UPDATED } from "@/lib/events";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAccount } from "wagmi";
import { getWalletAddressFromUser } from "@/lib/wallet-utils";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { UploadIcon, FolderIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { CloudUploadIcon } from "lucide-react";

// Initialize toast on the window object
if (typeof window !== 'undefined') {
  (window as any).toast = toast;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  relativePath?: string;
  size: string;
  isFolder: boolean;
}

// Utility function to format bytes into human readable format
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { user } = useAuth();
  const { address } = useAccount();
  const router = useRouter();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    // Check if this is a folder upload
    const isFolder = Array.from(fileList).some(file => 
      file.webkitRelativePath && file.webkitRelativePath.includes('/')
    );

    if (isFolder) {
      try {
        // Get folder name from the first file
        const firstFile = Array.from(fileList).find(f => f.webkitRelativePath)!;
        const folderName = firstFile.webkitRelativePath.split('/')[0];
        
        // Show toast for zip conversion start
        toast.info(`Converting folder "${folderName}" to zip file...`, {
          duration: 10000 // Keep the message visible longer since zip creation might take time
        });
        
        // Create a zip file using JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Add all files to the zip
        for (const file of Array.from(fileList)) {
          const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');
          const buffer = await file.arrayBuffer();
          zip.file(relativePath, buffer);
        }
        
        // Generate the zip file
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });
        
        // Create a File object from the zip blob
        const zipFile = new File([zipBlob], `${folderName}.zip`, {
          type: 'application/zip'
        });

        // Add the zip file to the files state
        setFiles([{
          file: zipFile,
          progress: 0,
          size: formatBytes(zipFile.size),
          isFolder: false
        }]);

        // Show success toast for zip conversion
        toast.success(`Folder "${folderName}" converted successfully!`);
      } catch (error) {
        console.error('Error creating zip file:', error);
        toast.error('Failed to process folder. Please try again.');
      }
    } else {
      // Regular file upload - handle as before
      const newFiles = Array.from(fileList).map(file => ({
        file,
        progress: 0,
        size: formatBytes(file.size),
        isFolder: false
      }));
      setFiles(newFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const walletAddress = getWalletAddressFromUser(user) || address;
    
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setUploading(true);

      // Check storage limits
      const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);
      
      const storageCheckResponse = await fetch('/api/storage/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': walletAddress
        },
        body: JSON.stringify({
          fileSize: totalSize
        })
      });

      if (!storageCheckResponse.ok) {
        const error = await storageCheckResponse.json();
        toast.error(error.error || 'Failed to check storage limits');
        return;
      }

      const client = WebHashClient.getInstance();

      // Upload each file
      const uploadPromises = files.map(async (uploadingFile, index) => {
        try {
          await client.uploadFile({
            file: uploadingFile.file,
            walletAddress,
            onProgress: (progress: number) => {
              setFiles(prev => prev.map((f, i) => 
                i === index ? { ...f, progress } : f
              ));
            }
          });
        } catch (error) {
          console.error(`Error uploading ${uploadingFile.file.name}:`, error);
          toast.error(`Failed to upload ${uploadingFile.file.name}`);
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      // Clear form
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';

      // Trigger storage update
      storageUpdateEvent.dispatchEvent(STORAGE_UPDATED);

      toast.success('Upload completed successfully!');
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
      return <FileText className="w-6 h-6" />;
    }
    return <FileIcon className="w-6 h-6" />;
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalProgress = () => {
    if (files.length === 0) return 0;
    return files.reduce((sum, file) => sum + file.progress, 0) / files.length;
  };

  // Get wallet address for button state
  const walletAddress = getWalletAddressFromUser(user) || address;

  return (
    <Card className="p-6 w-full">
      <div className="space-y-4">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <input
          ref={folderInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          {...{ webkitdirectory: "", directory: "" } as any}
          multiple
          disabled={uploading}
        />

        {/* Upload buttons */}
        <div className="flex gap-4">
          <div 
            onClick={handleSelectClick}
            className="flex-1 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors dark:bg-gray-800/50"
          >
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upload Files</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select multiple files
              </p>
            </div>
          </div>

          <div 
            onClick={handleFolderClick}
            className="flex-1 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors dark:bg-gray-800/50"
          >
            <FolderUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upload Folder</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select an entire folder structure
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Maintains subfolder organization
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        <div className="mt-4">
          {files.length > 0 && (
            <div className="text-sm text-gray-500 mb-2">
              Selected {files[0].isFolder ? 'Folder' : `Files (${files.length})`}
            </div>
          )}
          <div className="space-y-2">
            {files.map((uploadingFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  {uploadingFile.isFolder ? (
                    <FolderIcon className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-sm text-gray-300">
                    {uploadingFile.isFolder 
                      ? uploadingFile.file.webkitRelativePath.split('/')[0]  // Show folder name
                      : uploadingFile.file.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">{uploadingFile.size}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload button and progress */}
        <div className="flex flex-col space-y-2">
          <div className="flex justify-end">
            <Button
              variant="default"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading || !walletAddress}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload {files.length > 0 ? `(${files.length} files)` : ''}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}