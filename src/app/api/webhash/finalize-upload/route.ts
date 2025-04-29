import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getWebHashSDK } from '@/lib/webhash-sdk';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Temporary directory for storing chunks
const TEMP_DIR = path.join(os.tmpdir(), 'hashvault-uploads');

// Set a timeout for the request
export const maxDuration = 60; // 60 seconds for finalizing uploads

export async function POST(request: NextRequest) {
  let uploadDir = '';
  let tempFilePath = '';

  try {
    const data = await request.json();
    const { uploadId, fileName, totalChunks, walletAddress, fileType } = data;

    if (!uploadId || !fileName || !totalChunks || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Finalizing upload:', { uploadId, fileName, totalChunks });

    uploadDir = path.join(TEMP_DIR, uploadId);
    
    // Check if all chunks exist
    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      chunkPromises.push(fs.access(chunkPath).catch(() => {
        throw new Error(`Chunk ${i} is missing for upload ${uploadId}`);
      }));
    }
    
    // Wait for all chunk checks to complete
    await Promise.all(chunkPromises);

    // Create a temporary file to combine all chunks
    tempFilePath = path.join(TEMP_DIR, fileName);
    const writeStream = createWriteStream(tempFilePath);
    
    // Combine all chunks in order
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      const readStream = createReadStream(chunkPath);
      
      // Use pipeline for better error handling
      await pipeline(readStream, writeStream, { end: false });
      console.log(`Added chunk ${i} to ${fileName}`);
    }
    
    // Close the write stream
    writeStream.end();
    
    // Wait for the stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    console.log(`Combined file created at ${tempFilePath}`);
    
    // Get the WebHash SDK service
    const webhashSDK = getWebHashSDK();
    
    // Upload the combined file using the WebHash SDK
    const result = await webhashSDK.uploadFile(tempFilePath, walletAddress);
    
    console.log('WebHash SDK upload result:', result);
    
    // Return success response
    return NextResponse.json({
      success: true,
      cid: result.cid,
      name: result.fileName,
      size: result.size
    });
  } catch (error) {
    console.error('Error finalizing upload:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred during finalization' },
      { status: 500 }
    );
  } finally {
    // Clean up temporary files
    try {
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
      
      if (uploadDir) {
        // Delete all chunk files
        const files = await fs.readdir(uploadDir);
        await Promise.all(files.map(file => 
          fs.unlink(path.join(uploadDir, file)).catch(() => {})
        ));
        
        // Remove the upload directory
        await fs.rmdir(uploadDir).catch(() => {});
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
  }
} 