import { NextRequest, NextResponse } from 'next/server';
import { getWebHashSDK } from '@/lib/webhash-sdk';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Set a timeout for the request
export const maxDuration = 60; // 60 seconds for large file uploads

const TEMP_DIR = path.join(os.tmpdir(), 'hashvault-uploads');

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Invalid or missing Authorization header:', authHeader);
      return NextResponse.json(
        { error: 'Invalid or missing Authorization header' },
        { status: 401 }
      );
    }

    // Extract the wallet address (Bearer token is the wallet address in this case)
    const walletAddress = authHeader.split(' ')[1];
    
    // Clone the request to forward it
    const formData = await request.formData();
    
    // Get the file and check if it's a zip file (folder upload)
    const file = formData.get('file') as File;
    if (!file) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file found in request' },
        { status: 400 }
      );
    }

    // Create the temporary directory if it doesn't exist
    await fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {});

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine if this is a folder upload based on file type
    const isZipFile = file.type === 'application/zip' || file.name.endsWith('.zip');
    
    console.log('Upload request details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isZipFile
    });

    // Get the WebHash SDK service
    const webhashSDK = getWebHashSDK();
    
    // Upload the file or directory
    let result;
    if (isZipFile) {
      // For zip files (folder uploads), we need to extract to a temp directory first
      const tempZipPath = path.join(TEMP_DIR, file.name);
      const extractDir = path.join(TEMP_DIR, path.basename(file.name, '.zip'));
      
      try {
        // Save the zip file
        await fs.writeFile(tempZipPath, buffer);
        
        // For production, you would extract the zip here and use the uploadDirectory method
        // But for now, we'll just use uploadFileBuffer since the SDK doesn't support direct zip upload
        result = await webhashSDK.uploadFileBuffer(buffer, file.name, walletAddress);
      } finally {
        // Clean up temporary files
        try {
          await fs.unlink(tempZipPath).catch(() => {});
          // If you extracted the zip, you'd need to clean up the extracted directory here too
        } catch (error) {
          console.error('Error cleaning up temporary files:', error);
        }
      }
    } else {
      // Regular file upload
      result = await webhashSDK.uploadFileBuffer(buffer, file.name, walletAddress);
    }

    console.log('WebHash SDK upload result:', result);

    // Return the result
    return NextResponse.json({
      success: true,
      cid: result.cid,
      name: result.fileName,
      size: result.size
    });
  } catch (error) {
    console.error('Error in WebHash upload API route:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred during upload' },
      { status: 500 }
    );
  }
} 