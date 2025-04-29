// import { WebhashClient } from 'webhash';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Types to match the existing WebHash client response
interface UploadResponse {
  cid: string;
  fileName: string;
  size: string;
}

// Define types for WebhashClient
interface WebhashResponse {
  Hash: string;
  Name: string;
  Size: string;
  [key: string]: any;
}

interface WebhashUploadResult {
  response: WebhashResponse | WebhashResponse[];
  [key: string]: any;
}

interface WebhashClient {
  uploadFile(filePath: string): Promise<WebhashUploadResult>;
  uploadDir(dirPath: string): Promise<{ response: WebhashResponse[] }>;
}

// Define a constant for the temp directory
const TEMP_DIR = path.join(os.tmpdir(), 'hashvault-webhash');

// Singleton class for the WebHash SDK service
export class WebHashSDKService {
  private static instance: WebHashSDKService;
  private client: any;
  private tempDir: string;
  private privateKey: string = '69428d525e41796db7588bf5a896986e156f59e12b8dac10ef19063170d810d7';

  private constructor() {
    this.tempDir = TEMP_DIR;
    this.initClient();
    
    // Ensure temp directory exists
    fs.mkdir(this.tempDir, { recursive: true }).catch(err => {
      console.error('Error creating temp directory:', err);
    });
  }

  private async initClient() {
    try {
      // Dynamically import the WebhashClient to avoid TypeScript issues
      const webhash = await import('webhash');
      // Initialize the WebhashClient with the private key
      this.client = new webhash.WebhashClient(this.privateKey);
    } catch (error) {
      console.error('Error initializing WebhashClient:', error);
    }
  }

  public static getInstance(): WebHashSDKService {
    if (!WebHashSDKService.instance) {
      WebHashSDKService.instance = new WebHashSDKService();
    }
    return WebHashSDKService.instance;
  }

  // Upload a file from a Buffer or File object
  public async uploadFileBuffer(
    fileBuffer: Buffer | Uint8Array, 
    fileName: string, 
    walletAddress: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    // Save the buffer to a temporary file
    const tempFilePath = path.join(this.tempDir, fileName);
    
    try {
      // Make sure client is initialized
      if (!this.client) {
        await this.initClient();
      }
      
      // Write the buffer to a temporary file
      await fs.writeFile(tempFilePath, fileBuffer);
      
      // Upload the file using the SDK
      const result = await this.client.uploadFile(tempFilePath);
      
      // Map SDK response to our expected format
      return {
        cid: result.response.Hash,
        fileName: result.response.Name,
        size: result.response.Size
      };
    } catch (error: any) {
      console.error('Error uploading file with WebHash SDK:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    } finally {
      // Clean up the temporary file
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('Error cleaning up temporary file:', err);
      }
    }
  }

  // Upload a file from a path
  public async uploadFile(
    filePath: string,
    walletAddress: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    try {
      // Make sure client is initialized
      if (!this.client) {
        await this.initClient();
      }
      
      // Upload the file using the SDK
      const result = await this.client.uploadFile(filePath);
      
      // Map SDK response to our expected format
      return {
        cid: result.response.Hash,
        fileName: path.basename(filePath),
        size: result.response.Size
      };
    } catch (error: any) {
      console.error('Error uploading file with WebHash SDK:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload a directory
  public async uploadDirectory(
    dirPath: string,
    walletAddress: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    try {
      // Make sure client is initialized
      if (!this.client) {
        await this.initClient();
      }
      
      // Upload the directory using the SDK
      const result = await this.client.uploadDir(dirPath);
      
      // The last item in the response array is the base directory info
      const baseDirInfo = result.response.at(-1);
      
      if (!baseDirInfo) {
        throw new Error('No directory info returned from WebHash SDK');
      }
      
      // Map SDK response to our expected format
      return {
        cid: baseDirInfo.Hash,
        fileName: baseDirInfo.Name,
        size: baseDirInfo.Size
      };
    } catch (error: any) {
      console.error('Error uploading directory with WebHash SDK:', error);
      throw new Error(`Failed to upload directory: ${error.message}`);
    }
  }
}

// Export a function to get the singleton instance
export function getWebHashSDK(): WebHashSDKService {
  return WebHashSDKService.getInstance();
} 