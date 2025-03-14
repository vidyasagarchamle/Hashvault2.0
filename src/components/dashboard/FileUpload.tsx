"use client";

import { usePrivy } from '@privy-io/react-auth';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileIcon, Image, Music, FileText, Video } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { WebHashClient } from "@/lib/webhash-client";
import { getWalletAddressFromUser } from '@/lib/wallet-utils';

export default function FileUpload() {
  const { user } = usePrivy();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      console.log('Selected file:', {
        name: selectedFile.name,
        type: selectedFile.type || "unknown",
        size: selectedFile.size,
        sizeInMB: (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB",
        extension: selectedFile.name.split('.').pop()?.toLowerCase() || "unknown"
      });
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    const walletAddress = getWalletAddressFromUser(user);
    if (!walletAddress) {
      toast.error('No wallet address available. Please log in again.');
      return;
    }

    try {
      // Check storage limits before uploading
      const response = await fetch('/api/storage/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'STORAGE_LIMIT_EXCEEDED') {
          toast.error('Storage limit exceeded. Please purchase additional storage.');
          return;
        }
        throw new Error(error.message || 'Failed to check storage limits');
      }

      setUploading(true);
      setUploadProgress(0);
      setUploadStartTime(Date.now());

      console.log(`Starting upload of: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      const client = WebHashClient.getInstance();
      
      // Show initial toast for large files
      if (file.size > 50 * 1024 * 1024) { // 50MB
        toast.info(`Uploading large file (${(file.size / (1024 * 1024)).toFixed(2)} MB). This may take several minutes...`);
      }

      const result = await client.uploadFile({
        file,
        walletAddress,
        onProgress: (progress: number) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      });

      console.log('Upload completed:', result);
      toast.success('File uploaded successfully!');
      setUploadProgress(0);
      setFile(null);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setUploading(false);
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
          accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Visual upload area */}
        <div 
          onClick={handleSelectClick}
          className="rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Click to select a file</h3>
            <p className="text-sm text-gray-500">
              Images, Audio, Video, and Documents
            </p>
          </div>
        </div>

        {/* Selected file */}
        {file && (
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Selected File</div>
              <div className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
              <div className="flex items-center space-x-2">
                {getFileTypeIcon(file.type)}
                <span className="text-sm truncate max-w-[250px]">{file.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-gray-500 hover:text-red-500"
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
            <div className="text-sm text-gray-500 flex justify-between">
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
                  <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
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