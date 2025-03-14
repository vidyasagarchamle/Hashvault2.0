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
  message: string;
  cid: string;
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
  private apiUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private static CACHE_DURATION = 5000; // 5 seconds cache

  private constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_WEBHASH_API_URL || 'http://52.38.175.117:5000';
    this.apiKey = process.env.NEXT_PUBLIC_WEBHASH_API_KEY || '';
    this.cache = new Map();
  }

  public static getInstance(): WebHashClient {
    if (!WebHashClient.instance) {
      WebHashClient.instance = new WebHashClient();
    }
    return WebHashClient.instance;
  }

  private guessMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private getCacheKey(method: string, params: string): string {
    return `${method}:${params}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > WebHashClient.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getUploads(walletAddress: string): Promise<any[]> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const cacheKey = this.getCacheKey('getUploads', walletAddress);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const response = await fetch(`/api/upload?walletAddress=${walletAddress}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletAddress}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch uploads: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch uploads');
      }

      this.setCache(cacheKey, data.files);
      return data.files;
    } catch (error) {
      console.error('Error fetching uploads:', error);
      throw error;
    }
  }

  async uploadFile(options: UploadOptions): Promise<any> {
    try {
      const { file, walletAddress, onProgress } = options;

      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      if (!file) {
        throw new Error('File is required');
      }

      console.debug('Starting file upload to WebHash...', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        walletAddress
      });

      // Create FormData for the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload to WebHash IPFS endpoint with retry logic
      console.debug('Uploading to WebHash IPFS endpoint...');
      
      // Retry logic
      let retries = 3;
      let response;
      let lastError;
      
      while (retries > 0) {
        try {
          response = await fetch(`${this.apiUrl}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: formData,
            // Add a longer timeout
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });
          
          // If successful, break out of retry loop
          if (response.ok) break;
          
          // If we got a response but it's an error, handle based on status
          const errorText = await response.text();
          lastError = new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
          
          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw lastError;
          }
          
        } catch (error) {
          console.error(`Upload attempt failed (${retries} retries left):`, error);
          lastError = error;
        }
        
        retries--;
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          const waitTime = (3 - retries) * 2000; // 2s, 4s, 6s
          console.debug(`Retrying upload in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // If we've exhausted retries and still have an error
      if (!response || !response.ok) {
        throw lastError || new Error('Upload failed after multiple retries');
      }

      const output = await response.json();
      console.debug('WebHash upload response:', output);

      if (!output.cid) {
        console.error('Invalid WebHash response:', output);
        throw new Error('Invalid response from IPFS: Missing CID');
      }

      // Store metadata through our API
      console.debug('Storing file metadata...', {
        fileName: file.name,
        cid: output.cid,
        size: file.size,
        mimeType: file.type || this.guessMimeType(file.name)
      });

      // Retry logic for metadata storage
      retries = 3;
      let metadataResponse;
      
      while (retries > 0) {
        try {
          metadataResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${walletAddress}`
            },
            body: JSON.stringify({
              fileName: file.name,
              cid: output.cid,
              size: file.size.toString(),
              mimeType: file.type || this.guessMimeType(file.name),
              walletAddress,
            }),
            // Add a longer timeout
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });
          
          // If successful, break out of retry loop
          if (metadataResponse.ok) break;
          
          // If we got a response but it's an error
          const errorData = await metadataResponse.json();
          lastError = new Error(`Failed to store file metadata: ${JSON.stringify(errorData)}`);
          
          // Don't retry for client errors (4xx)
          if (metadataResponse.status >= 400 && metadataResponse.status < 500) {
            throw lastError;
          }
          
        } catch (error) {
          console.error(`Metadata storage attempt failed (${retries} retries left):`, error);
          lastError = error;
        }
        
        retries--;
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          const waitTime = (3 - retries) * 1000; // 1s, 2s, 3s
          console.debug(`Retrying metadata storage in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // If we've exhausted retries and still have an error
      if (!metadataResponse || !metadataResponse.ok) {
        throw lastError || new Error('Metadata storage failed after multiple retries');
      }

      const metadata = await metadataResponse.json();
      console.debug('Metadata stored successfully:', metadata);
      
      if (onProgress) onProgress(100);

      return {
        ...metadata,
        cid: output.cid
      };

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