'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileIcon, Image, Music, FileText, Video } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { LighthouseDirectClient } from "@/lib/lighthouse-direct-client";
import { usePrivy } from '@privy-io/react-auth';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getWalletAddressFromUser } from '@/lib/wallet-utils';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = usePrivy();

  // Format seconds into a readable time format
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  // Update time remaining estimate
  useEffect(() => {
    if (!uploading || !uploadStartTime || uploadProgress <= 0) {
      setEstimatedTimeRemaining(null);
      return;
    }

    const updateEstimate = () => {
      const timeElapsed = (Date.now() - uploadStartTime) / 1000; // in seconds
      if (uploadProgress > 0 && timeElapsed > 0) {
        // Estimate remaining time based on progress so far
        const estimatedTotalTime = (timeElapsed / uploadProgress) * 100;
        const timeRemaining = Math.max(0, estimatedTotalTime - timeElapsed);
        setEstimatedTimeRemaining(formatTime(timeRemaining));
      }
    };

    // Initial update
    updateEstimate();

    // Update every second
    const interval = setInterval(updateEstimate, 1000);
    return () => clearInterval(interval);
  }, [uploading, uploadStartTime, uploadProgress]);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      const fileInfo = {
        name: selectedFile.name,
        type: selectedFile.type || "unknown",
        size: selectedFile.size,
        sizeInMB: (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB",
        extension: selectedFile.name.split('.').pop()?.toLowerCase() || "unknown"
      };
      
      console.log('Selected file details:', fileInfo);
      setFile(selectedFile);
    } else {
      console.log('No file selected');
    }
  }, []);

  const handleUpload = async () => {
    try {
      if (!file) {
        toast.error('Please select a file first');
        return;
      }

      const walletAddress = getWalletAddressFromUser(user);
      if (!walletAddress) {
        toast.error('No wallet address available. Please log in again.');
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      setUploadStartTime(Date.now());

      console.debug('Starting upload of:', file.name, `(${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

      const client = LighthouseDirectClient.getInstance();
      
      try {
        // Show initial toast for large files
        if (file.size > 50 * 1024 * 1024) { // 50MB
          toast.info(`Uploading large file (${(file.size / (1024 * 1024)).toFixed(2)} MB). This may take several minutes...`);
        }

        const result = await client.uploadFile({
          file,
          walletAddress,
          onProgress: (progress) => {
            setUploadProgress(progress);
            console.debug(`Upload progress: ${progress}%`);
          }
        });

        console.debug('Upload completed successfully:', result);
        toast.success('File uploaded successfully!');
        
        // Clear the form
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Refresh the file list if we're on the files page
        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload file';
        toast.error(errorMessage);
        
        if (errorMessage.includes('500')) {
          toast.error('Server error. Please try again in a few moments.');
        }
      }
    } catch (error) {
      console.error('Error in handleUpload:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStartTime(null);
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

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6 w-full">
      <div className="space-y-4">
        {/* Hidden file input that actually works */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Visual upload area */}
        <div 
          onClick={handleSelectClick}
          className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors dark:bg-gray-800/50"
        >
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Click to select a file</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Images, Audio, Video, and Documents
            </p>
          </div>
        </div>

        {/* Selected file */}
        {file && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900 dark:text-gray-100">Selected File</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center space-x-2">
                {getFileTypeIcon(file.type)}
                <span className="text-sm truncate max-w-[250px] text-gray-700 dark:text-gray-300">{file.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                aria-label="Remove file"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Upload button and progress */}
        <div className="flex flex-col space-y-2">
          {uploading && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
              <span>{uploadProgress < 100 ? `${uploadProgress}% complete` : "Finalizing..."}</span>
              {estimatedTimeRemaining && uploadProgress < 95 && (
                <span>~{estimatedTimeRemaining} remaining</span>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              variant="default"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>{uploadProgress < 100 ? "Uploading..." : "Finalizing..."}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}