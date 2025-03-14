import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Create a temporary directory for storing chunks
const TEMP_DIR = path.join(os.tmpdir(), 'hashvault-uploads');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    
    // Get the file chunk
    const fileChunk = formData.get('file') as File;
    if (!fileChunk) {
      return NextResponse.json(
        { error: 'No file chunk provided' },
        { status: 400 }
      );
    }

    // Get metadata from the form
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = formData.get('chunkIndex') as string;
    const totalChunks = formData.get('totalChunks') as string;
    const fileName = formData.get('fileName') as string;

    if (!uploadId || !chunkIndex || !totalChunks || !fileName) {
      return NextResponse.json(
        { error: 'Missing required metadata' },
        { status: 400 }
      );
    }

    // Create upload directory for this upload if it doesn't exist
    const uploadDir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the chunk to disk
    const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}`);
    const buffer = Buffer.from(await fileChunk.arrayBuffer());
    fs.writeFileSync(chunkPath, buffer);

    console.log(`Saved chunk ${chunkIndex} of ${totalChunks} for upload ${uploadId}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex} of ${totalChunks} received`,
      chunkIndex,
      totalChunks,
      uploadId
    });
  } catch (error) {
    console.error('Error handling chunk upload:', error);
    return NextResponse.json(
      { error: 'Failed to process chunk upload', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Increase the body size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 