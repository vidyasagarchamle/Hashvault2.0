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
    try {
      const { folderName, files, walletAddress, onProgress } = options;
      
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      
      if (!folderName) {
        throw new Error('Folder name is required');
      }
      
      if (!files || files.length === 0) {
        throw new Error('No files to upload');
      }

      // Create a zip file using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add all files to the zip
      for (const file of files) {
        const relativePath = (file as any).webkitRelativePath || file.name;
        // Remove the root folder name from the path
        const pathInZip = relativePath.split('/').slice(1).join('/');
        zip.file(pathInZip, file);
      }
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        if (onProgress) {
          // First 50% is zip creation
          onProgress(metadata.percent / 2);
        }
      });
      
      // Create a File object from the zip blob
      const zipFile = new File([zipBlob], `${folderName}.zip`, {
        type: 'application/zip'
      });
      
      // Upload the zip file
      const result = await this.uploadFile({
        file: zipFile,
        walletAddress,
        onProgress: (progress) => {
          if (onProgress) {
            // Last 50% is upload
            onProgress(50 + progress / 2);
          }
        }
      });
      
      // Update the metadata to indicate this is a folder
      const metadataResponse = await fetch(`/api/upload/${result.cid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': walletAddress
        },
        body: JSON.stringify({
          isFolder: true,
          mimeType: 'application/folder'
        })
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || 'Failed to update folder metadata');
      }

      const updatedFile = await metadataResponse.json();
      
      // Complete the process with 100% progress
      if (onProgress) {
        onProgress(100);
      }
      
      return updatedFile;
    } catch (error) {
      console.error('Error in uploadFolder:', error);
      throw error;
    }
  }
} 