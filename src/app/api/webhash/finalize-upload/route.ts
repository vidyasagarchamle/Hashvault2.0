import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';
import fetch, { Response } from 'node-fetch';
import { pipeline } from 'stream/promises';

// Temporary directory for storing chunks
const TEMP_DIR = path.join(os.tmpdir(), 'hashvault-uploads');

// New way to configure route options in Next.js App Router
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed for Vercel hobby plan

export async function POST(request: NextRequest) {
  let uploadDir = '';
  let tempFilePath = '';
  
  try {
    // Parse the form data
    const formData = await request.formData();
    
    // Get metadata from the form
    const uploadId = formData.get('uploadId') as string;
    const fileName = formData.get('fileName') as string;
    const fileSize = formData.get('fileSize') as string;
    const fileType = formData.get('fileType') as string;
    const totalChunks = parseInt(formData.get('totalChunks') as string);

    if (!uploadId || !fileName || !fileSize || !totalChunks) {
      return NextResponse.json(
        { error: 'Missing required metadata' },
        { status: 400 }
      );
    }

    // Check if upload directory exists
    uploadDir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // Combine chunks into a single file
    tempFilePath = path.join(uploadDir, fileName);
    const writeStream = fs.createWriteStream(tempFilePath);
    
    console.log(`Combining ${totalChunks} chunks for upload ${uploadId}`);
    
    // Check if all chunks exist first before processing
    const missingChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      if (!fs.existsSync(chunkPath)) {
        missingChunks.push(i);
      }
    }
    
    if (missingChunks.length > 0) {
      writeStream.close();
      return NextResponse.json(
        { error: `Missing chunks: ${missingChunks.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Process chunks in order
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      
      // Delete chunk after processing to free up space
      fs.unlinkSync(chunkPath);
    }
    
    // Close the write stream
    writeStream.end();
    
    // Wait for the stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    console.log(`Combined file created at ${tempFilePath}`);
    
    // Get the WebHash API key from environment variables
    const webhashApiKey = process.env.WEBHASH_API_KEY;
    if (!webhashApiKey) {
      throw new Error('WebHash API key not configured');
    }
    
    // Upload the combined file to WebHash
    const webhashFormData = new FormData();
    const fileStream = fs.createReadStream(tempFilePath);
    
    webhashFormData.append('file', fileStream, {
      filename: fileName,
      contentType: fileType || 'application/octet-stream',
    });
    
    console.log('Uploading combined file to WebHash...');
    
    // Set a timeout for the WebHash upload - using a simple timeout instead of AbortController
    // to avoid type compatibility issues with node-fetch
    try {
      // Upload to WebHash with a timeout
      const uploadPromise = fetch('https://api.webhash.io/ipfs/upload', {
        method: 'POST',
        headers: {
          'x-api-key': webhashApiKey,
        },
        body: webhashFormData,
        // Using a longer timeout but still within our 60s limit
        timeout: 45000 // 45 second timeout
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 45000);
      });
      
      // Race the upload against the timeout
      const webhashResponse = await Promise.race([uploadPromise, timeoutPromise]);
      
      if (!webhashResponse.ok) {
        const errorText = await webhashResponse.text();
        throw new Error(`WebHash upload failed: ${webhashResponse.status} - ${errorText}`);
      }
      
      const webhashResult = await webhashResponse.json();
      console.log('WebHash upload successful:', webhashResult);
      
      // Clean up
      fileStream.destroy();
      fs.unlinkSync(tempFilePath);
      fs.rmdirSync(uploadDir);
      
      return NextResponse.json(webhashResult);
    } catch (error: any) {
      // If it's a timeout error, return a specific message
      if (error.message === 'Upload timeout' || error.type === 'request-timeout') {
        return NextResponse.json(
          { 
            error: 'Upload timeout - file too large for serverless function limit',
            cid: null,
            status: 'timeout',
            message: 'The upload took too long to complete. The file may be too large for the current plan limits.'
          },
          { status: 408 }
        );
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Error finalizing upload:', error);
    
    // Clean up any temporary files if they exist
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (uploadDir && fs.existsSync(uploadDir)) {
        fs.rmdirSync(uploadDir, { recursive: true });
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    return NextResponse.json(
      { error: 'Failed to finalize upload', details: error.message },
      { status: 500 }
    );
  }
} 