import JSZip from 'jszip';
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

interface FolderUploadOptions {
  folderName: string;
  files: File[];
  walletAddress: string;
  onProgress?: (progress: number) => void;
}

interface ProgressData {
  progress: number;
  total: number;
}

export class WebHashClient {
  private static instance: WebHashClient;
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private static CACHE_DURATION = 5000; // 5 seconds cache

  private constructor() {
    this.baseUrl = '/api/webhash';
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

  /**
   * Retrieve uploads for a specific wallet address
   * @param walletAddress The wallet address to retrieve uploads for
   * @returns An array of file information
   */
  async getUploads(walletAddress: string): Promise<any[]> {
    try {
      // Call the API with the wallet address
      const response = await fetch(`/api/upload?walletAddress=${walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': walletAddress
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error retrieving uploads:', error);
      throw error;
    }
  }

  async uploadFile(options: UploadOptions): Promise<any> {
    const { file, walletAddress, onProgress } = options;

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    try {
      // Upload to WebHash
      const formData = new FormData();
      formData.append('file', file);

      // Get the API key - using the exact key from the curl example
      const apiKey = '22b02f7023db2e5f9c605fe7dca3ef879a74781bf773fb043ddeeb0ee6a268b3';

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Store file metadata
      const metadataResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': walletAddress
        },
        body: JSON.stringify({
          fileName: file.name,
          cid: result.cid,
          size: file.size.toString(),
          mimeType: file.type || this.guessMimeType(file.name),
          walletAddress
        })
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || 'Failed to store file metadata');
      }

      return result;
    } catch (error) {
      console.error('Error in uploadFile:', error);
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

  /**
   * Upload a folder with all its files
   * @param options The folder upload options
   * @returns The folder upload result
   */
  async uploadFolder(options: FolderUploadOptions): Promise<any> {
    const { files, walletAddress, folderName, onProgress } = options;

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    if (!folderName) {
      throw new Error('Folder name is required');
    }

    try {
      // Create a zip file
      const zip = new JSZip();
      let totalSize = 0;

      // Add files to zip
      for (const file of files) {
        zip.file(file.webkitRelativePath, file);
        totalSize += file.size;
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], `${folderName}.zip`, { type: 'application/zip' });

      // Upload zip file to WebHash
      const formData = new FormData();
      formData.append('file', zipFile);

      // Get the API key - using the exact key from the curl example for folder uploads
      const apiKey = '22b02f7023db2e5f9c605fe7dca3ef879a74781bf773fb043ddeeb0ee7q348b3';

      // Use the uploadFile method to handle the upload
      const result = await this.uploadFile({
        file: zipFile,
        walletAddress,
        onProgress
      });

      // Store folder metadata
      const metadataResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': walletAddress
        },
        body: JSON.stringify({
          fileName: folderName,
          cid: result.cid,
          size: totalSize.toString(),
          mimeType: 'application/zip',
          walletAddress,
          isFolder: true,
          parentFolder: null
        })
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || 'Failed to store folder metadata');
      }

      return result;
    } catch (error) {
      console.error('Error in uploadFolder:', error);
      throw error;
    }
  }
} 