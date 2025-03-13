// Direct API implementation without SDK dependency

interface UploadOptions {
  file: File;
  walletAddress: string;
  onProgress?: (progress: number) => void;
  chunkSize?: number; // Optional chunk size in bytes
}

export class LighthouseDirectClient {
  private static instance: LighthouseDirectClient;
  private apiKey: string;
  private readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks by default
  private readonly MAX_CONCURRENT_UPLOADS = 3;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Lighthouse API key not found');
    }
  }

  public static getInstance(): LighthouseDirectClient {
    if (!LighthouseDirectClient.instance) {
      LighthouseDirectClient.instance = new LighthouseDirectClient();
    }
    return LighthouseDirectClient.instance;
  }

  private validateApiKey() {
    if (!this.apiKey) {
      throw new Error('Lighthouse API key is not configured');
    }
    const cleanApiKey = this.apiKey.replace('Bearer ', '');
    if (!cleanApiKey.includes('.')) {
      throw new Error('Invalid API key format');
    }
    return cleanApiKey;
  }

  private async testApiKey(): Promise<boolean> {
    try {
      const cleanApiKey = this.validateApiKey();
      const response = await fetch('https://api.lighthouse.storage/api/user/user_data_usage', {
        headers: {
          'Authorization': `Bearer ${cleanApiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  private guessMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4': return 'video/mp4';
      case 'mov': return 'video/quicktime';
      case 'avi': return 'video/x-msvideo';
      case 'mkv': return 'video/x-matroska';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return 'application/octet-stream';
    }
  }

  private async uploadWithProgress(file: File, cleanApiKey: string, onProgress?: (progress: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      xhr.open('POST', 'https://node.lighthouse.storage/api/v0/add');
      xhr.setRequestHeader('Authorization', `Bearer ${cleanApiKey}`);
      xhr.send(formData);
    });
  }

  async uploadFile(options: UploadOptions): Promise<any> {
    try {
      const { file, walletAddress, onProgress } = options;
      
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const cleanApiKey = this.validateApiKey();
      const isApiKeyValid = await this.testApiKey();
      
      if (!isApiKeyValid) {
        throw new Error('Invalid or expired API key');
      }

      console.debug('Starting direct upload to Lighthouse...', {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        mimeType: file.type || this.guessMimeType(file.name)
      });

      const response = await this.uploadWithProgress(file, cleanApiKey, onProgress);

      if (!response.Hash) {
        throw new Error('Invalid response from Lighthouse API');
      }

      // Store metadata in database
      try {
        const metadataResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            cid: response.Hash,
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

      return {
        cid: response.Hash,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error: any) {
      console.error('Error during Lighthouse upload:', error);
      throw new Error(`Lighthouse upload failed: ${error.message}`);
    }
  }

  async uploadFiles(files: File[], walletAddress: string, onProgress?: (progress: number) => void): Promise<any[]> {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    // Convert files array to upload promises
    const uploadPromises = files.map((file) => {
      return this.uploadFile({
        file,
        walletAddress,
        onProgress: (progress) => {
          if (onProgress) {
            // Calculate individual file progress
            const fileIndex = files.indexOf(file);
            const overallProgress = (fileIndex + progress / 100) / files.length * 100;
            onProgress(overallProgress);
          }
        }
      });
    });

    // Upload files concurrently in batches
    const results = [];
    for (let i = 0; i < uploadPromises.length; i += this.MAX_CONCURRENT_UPLOADS) {
      const batch = uploadPromises.slice(i, i + this.MAX_CONCURRENT_UPLOADS);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
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

  async deleteFile(cid: string, walletAddress: string): Promise<void> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      this.validateApiKey();

      // Delete from Lighthouse
      const response = await fetch(`https://node.lighthouse.storage/api/v0/remove`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
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
      
      this.validateApiKey();

      const response = await fetch(`https://node.lighthouse.storage/api/v0/status?cid=${cid}`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey
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