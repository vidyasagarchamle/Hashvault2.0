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

export class LighthouseClient {
  private static instance: LighthouseClient;
  private apiKey: string;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Lighthouse API key not found');
    }
  }

  public static getInstance(): LighthouseClient {
    if (!LighthouseClient.instance) {
      LighthouseClient.instance = new LighthouseClient();
    }
    return LighthouseClient.instance;
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
        throw new Error('Lighthouse API key is not configured');
      }

      // Log file details for debugging
      console.debug('File details:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        lastModified: new Date(file.lastModified).toISOString()
      });

      console.debug('Starting upload to Lighthouse API...');

      // Create a FormData object for direct API upload
      const formData = new FormData();
      formData.append('file', file);

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              onProgress(percentComplete);
            }
          };
        }
        
        // Handle completion
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseText = xhr.responseText;
              console.debug('Raw response:', responseText);
              
              const output = JSON.parse(responseText);
              console.debug('Upload response from Lighthouse:', output);
              
              if (!output.Hash) {
                reject(new Error('Invalid response from Lighthouse: ' + responseText));
                return;
              }
              
              // Store metadata in our database
              try {
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
                  console.warn('Failed to store file metadata:', await metadataResponse.text());
                }
              } catch (metadataError) {
                console.warn('Error storing file metadata:', metadataError);
              }
              
              // Return the response
              resolve({
                cid: output.Hash,
                name: file.name,
                size: file.size,
                type: file.type
              });
            } catch (e: any) {
              reject(new Error('Failed to parse response: ' + e.message));
            }
          } else {
            console.error('Upload failed with status:', xhr.status);
            console.error('Error response:', xhr.responseText);
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        
        // Handle errors
        xhr.onerror = () => {
          console.error('Network error during upload');
          reject(new Error('Network error during upload'));
        };
        
        // Open and send the request
        xhr.open('POST', 'https://node.lighthouse.storage/api/v0/add', true);
        xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('Error during Lighthouse upload:', error);
      throw new Error(`Lighthouse upload failed: ${error.message}`);
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

      // Delete from Lighthouse
      const response = await fetch(`https://node.lighthouse.storage/api/v0/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cid })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file from Lighthouse: ${response.statusText}`);
      }

      // Delete metadata from our database
      const metadataResponse = await fetch(`/api/upload?cid=${cid}&walletAddress=${walletAddress}`, {
        method: 'DELETE'
      });

      if (!metadataResponse.ok) {
        throw new Error(`Failed to delete file metadata: ${metadataResponse.statusText}`);
      }

      console.debug('File deleted successfully:', { cid, walletAddress });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  public async getDealStatus(cid: string): Promise<any> {
    try {
      console.debug('Checking deal status for CID:', cid);
      
      if (!this.apiKey) {
        throw new Error('Lighthouse API key is not configured');
      }

      const response = await fetch(`https://node.lighthouse.storage/api/v0/status?cid=${cid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check deal status: ${response.statusText}`);
      }

      const status = await response.json();
      console.debug('Deal status:', status);
      return status;
    } catch (error) {
      console.error('Error checking deal status:', error);
      throw error;
    }
  }
} 