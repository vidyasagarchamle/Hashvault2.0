import lighthouse from '@lighthouse-web3/sdk';

interface UploadOptions {
  file: File;
  walletAddress: string;
  onProgress?: (progress: number) => void;
}

export class LighthouseWeb3Client {
  private static instance: LighthouseWeb3Client;
  private apiKey: string;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Lighthouse API key not found');
    }
  }

  public static getInstance(): LighthouseWeb3Client {
    if (!LighthouseWeb3Client.instance) {
      LighthouseWeb3Client.instance = new LighthouseWeb3Client();
    }
    return LighthouseWeb3Client.instance;
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

      console.debug('Starting upload using Lighthouse SDK...');

      // Properly format file for the SDK
      const fileToUpload = [file];

      // Create a progress callback adapter if needed
      let progressCallback = undefined;
      if (onProgress) {
        progressCallback = (data: any) => {
          // Extract the progress value from the SDK callback data
          // and convert it to a simple percentage number
          if (data && typeof data.progress === 'number') {
            onProgress(data.progress);
          } else if (data && typeof data.total === 'number' && typeof data.uploaded === 'number') {
            // Calculate percentage from uploaded and total values
            const percentage = (data.uploaded / data.total) * 100;
            onProgress(percentage);
          }
        };
      }

      // Call the SDK's upload method with the proper parameter order
      const output = await lighthouse.upload(
        fileToUpload,
        this.apiKey,
        undefined, // Pass undefined instead of boolean for dealParameters
        progressCallback
      );

      console.debug('Upload response from Lighthouse SDK:', output);
      
      if (!output.data || !output.data.Hash) {
        throw new Error('Invalid response from Lighthouse SDK');
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
            cid: output.data.Hash,
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
      return {
        cid: output.data.Hash,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error: any) {
      console.error('Error during Lighthouse SDK upload:', error);
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

      const response = await fetch(`/api/upload?cid=${cid}&walletAddress=${walletAddress}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      console.debug('File deleted successfully:', cid);
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