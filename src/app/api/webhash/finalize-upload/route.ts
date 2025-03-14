import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Temporary directory for storing chunks
const TEMP_DIR = path.join(os.tmpdir(), 'hashvault-uploads');

export async function POST(request: NextRequest) {
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
    const uploadDir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // Combine chunks into a single file
    const tempFilePath = path.join(uploadDir, fileName);
    const writeStream = fs.createWriteStream(tempFilePath);
    
    console.log(`Combining ${totalChunks} chunks for upload ${uploadId}`);
    
    // Process chunks in order
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      
      // Check if chunk exists
      if (!fs.existsSync(chunkPath)) {
        // Clean up
        writeStream.close();
        fs.unlinkSync(tempFilePath);
        
        return NextResponse.json(
          { error: `Missing chunk ${i}` },
          { status: 400 }
        );
      }
      
      // Append chunk to file
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      
      // Delete chunk after processing
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
    
    // Upload the combined file to WebHash
    const webhashFormData = new FormData();
    webhashFormData.append('file', fs.createReadStream(tempFilePath), {
      filename: fileName,
      contentType: fileType || 'application/octet-stream',
    });
    
    // Get the WebHash API key from environment variables
    const webhashApiKey = process.env.WEBHASH_API_KEY;
    if (!webhashApiKey) {
      throw new Error('WebHash API key not configured');
    }
    
    console.log('Uploading combined file to WebHash...');
    
    // Upload to WebHash
    const webhashResponse = await fetch('https://api.webhash.io/ipfs/upload', {
      method: 'POST',
      headers: {
        'x-api-key': webhashApiKey,
      },
      body: webhashFormData,
    });
    
    if (!webhashResponse.ok) {
      const errorText = await webhashResponse.text();
      throw new Error(`WebHash upload failed: ${webhashResponse.status} - ${errorText}`);
    }
    
    const webhashResult = await webhashResponse.json();
    console.log('WebHash upload successful:', webhashResult);
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    fs.rmdirSync(uploadDir);
    
    return NextResponse.json(webhashResult);
  } catch (error) {
    console.error('Error finalizing upload:', error);
    return NextResponse.json(
      { error: 'Failed to finalize upload', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Increase the body size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Metadata only, not the actual file
    },
  },
}; 