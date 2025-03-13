// import lighthouse from '@lighthouse-web3/sdk';

interface DealParameters {
  miner: string[];
  num_copies: number;
  repair_threshold: number;
  renew_threshold: number;
  replication: number;
  epochs: number;
  skip_ipni: boolean;
  remove_unsealed: boolean;
  deal_duration: number;
  network: string;
  [key: string]: any;
}

interface StorageInfo {
  totalUploaded: number;
  totalSize: number;
}

interface UploadResponse {
  data: {
    Name: string;
    Hash: string;
    Size: string;
  };
}

interface UploadedFile {
  fileName: string;
  cid: string;
  size: string;
  lastUpdate: string;
  mimeType: string;
}

interface BufferFile {
  name: string;
  buffer?: Buffer | Uint8Array;
  path?: string;
  type: string;
  size: number;
}

interface UploadOptions {
  file: File;
  walletAddress: string;
  onProgress?: (progress: number) => void;
}

interface ProgressData {
  progress: number;
  total: number;
}

export class WebHashClient {
  private static instance: WebHashClient;
  private apiKey: string;
  private apiUrl: string;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_WEBHASH_API_KEY || '';
    this.apiUrl = process.env.NEXT_PUBLIC_WEBHASH_API_URL || 'http://52.38.175.117:5000';
    if (!this.apiKey) {
      console.warn('WebHash API key not found');
    }
  }

  public static getInstance(): WebHashClient {
    if (!WebHashClient.instance) {
      WebHashClient.instance = new WebHashClient();
    }
    return WebHashClient.instance;
  }

  private guessMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'mkv':
        return 'video/x-matroska';
      default:
        return 'application/octet-stream';
    }
  }

  async getUploads(walletAddress: string): Promise<any[]> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const response = await fetch(`/api/upload?walletAddress=${walletAddress}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch uploads: ${response.statusText}`);
      }

      const data = await response.json();
      console.debug('Uploads fetched:', data);
      
      if (!data.success || !Array.isArray(data.files)) {
        throw new Error('Invalid response format from API');
      }

      return data.files;
    } catch (error) {
      console.error('Error fetching uploads:', error);
      return [];
    }
  }

  async uploadFile(options: UploadOptions): Promise<any> {
    try {
      const { file, walletAddress, onProgress } = options;

      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      if (!this.apiKey) {
        throw new Error('WebHash API key is not configured');
      }

      console.debug('Starting file upload to WebHash node...');
      console.debug('File to upload:', { name: file.name, type: file.type, size: file.size });

      try {
        // Create FormData for the file
        const formData = new FormData();
        formData.append('file', file);

        // Upload to WebHash node
        const response = await fetch(`${this.apiUrl}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const output = await response.json();
        console.debug('Upload response from WebHash:', output);

        if (!output.Hash) {
          throw new Error('Invalid response from WebHash: ' + JSON.stringify(output));
        }

        // Store metadata through our API
        console.debug('Storing file metadata...');
        const metadataResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            cid: output.Hash,
            size: file.size.toString(),
            mimeType: file.type || this.guessMimeType(file.name),
            walletAddress,
          }),
        });

        if (!metadataResponse.ok) {
          throw new Error(`Failed to store file metadata: ${metadataResponse.statusText}`);
        }

        const metadata = await metadataResponse.json();
        console.debug('Metadata stored successfully:', metadata);
        
        if (onProgress) onProgress(100);
        
        return {
          Name: file.name,
          Hash: output.Hash,
          Size: file.size.toString(),
          fileId: metadata.file._id,
          metadata: metadata.file
        };
      } catch (uploadError) {
        console.error('Error during WebHash upload:', uploadError);
        if (uploadError instanceof Error) {
          throw new Error(`WebHash upload failed: ${uploadError.message}`);
        }
        throw uploadError;
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadFiles(files: File[], walletAddress: string, onProgress?: (progress: number) => void): Promise<any[]> {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const results = [];
    for (const file of files) {
      const result = await this.uploadFile({
        file,
        walletAddress,
        onProgress
      });
      results.push(result);
    }
    return results;
  }

  async deleteFile(cid: string, walletAddress: string): Promise<void> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      // Delete metadata from our database
      const metadataResponse = await fetch(`/api/upload?cid=${cid}&walletAddress=${walletAddress}`, {
        method: 'DELETE'
      });

      if (!metadataResponse.ok) {
        throw new Error(`Failed to delete file metadata: ${metadataResponse.statusText}`);
      }

      console.debug('File metadata deleted successfully:', { cid, walletAddress });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
} 