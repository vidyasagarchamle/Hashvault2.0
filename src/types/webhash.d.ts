declare module 'webhash' {
  export interface WebhashResponse {
    Hash: string;
    Name: string;
    Size: string;
    [key: string]: any;
  }

  export interface WebhashUploadResult {
    response: WebhashResponse | WebhashResponse[];
    [key: string]: any;
  }

  export class WebhashClient {
    constructor(privateKey: string);
    
    uploadFile(filePath: string): Promise<WebhashUploadResult>;
    uploadDir(dirPath: string): Promise<{ response: WebhashResponse[] }>;
    
    // Add any other methods that might be used from the library
  }
} 