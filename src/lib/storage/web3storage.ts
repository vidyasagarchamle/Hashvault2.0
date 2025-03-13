import { create } from '@web3-storage/w3up-client';

export class Web3StorageService {
  private client: any;
  private static instance: Web3StorageService;
  private initialized: boolean = false;

  private constructor() {}

  static async getInstance() {
    if (!Web3StorageService.instance) {
      Web3StorageService.instance = new Web3StorageService();
    }
    return Web3StorageService.instance;
  }

  async initialize(email: string) {
    if (this.initialized) return;

    try {
      this.client = await create();
      await this.client.login(email);
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing storage client:", error);
      throw error;
    }
  }

  async uploadFile(file: File) {
    if (!this.initialized) {
      throw new Error('Storage client not initialized. Call initialize() first.');
    }

    try {
      const blob = new Blob([file], { type: file.type });
      const cid = await this.client.uploadFile(blob);
      
      return {
        cid: cid.toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  async uploadFiles(files: File[]) {
    if (!this.initialized) {
      throw new Error('Storage client not initialized. Call initialize() first.');
    }

    try {
      const results = await Promise.all(files.map(file => this.uploadFile(file)));
      return results;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  }

  async retrieveFile(cid: string) {
    if (!this.initialized) {
      throw new Error('Storage client not initialized. Call initialize() first.');
    }

    try {
      const res = await this.client.get(cid);
      if (!res) throw new Error("File not found");

      const files = await res.files();
      return files[0];
    } catch (error) {
      console.error("Error retrieving file:", error);
      throw error;
    }
  }

  async getStorageInfo() {
    if (!this.initialized) {
      throw new Error('Storage client not initialized. Call initialize() first.');
    }

    try {
      // This is a mock implementation since storage stats aren't directly available
      return {
        used: 0,
        total: 0,
        files: 0,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      throw error;
    }
  }
} 