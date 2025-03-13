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

  private constructor() {
    this.apiUrl = 'http://52.38.175.117:5000';
    this.apiKey = '22b02f7023db2e5f9c605fe7dca3ef879a74781bf773fb043ddeeb0ee6a268b3';
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

      // Upload to WebHash IPFS endpoint
      console.debug('Uploading to WebHash IPFS endpoint...');
      const response = await fetch(`${this.apiUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WebHash upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
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

      const metadataResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          cid: output.cid,
          size: file.size.toString(),
          mimeType: file.type || this.guessMimeType(file.name),
          walletAddress,
        }),
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        console.error('Metadata storage failed:', {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to store file metadata: ${JSON.stringify(errorData)}`);
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