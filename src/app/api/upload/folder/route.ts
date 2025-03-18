import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import FileModel from '@/models/File';
import { User } from '@/models/User';

// Set a timeout for the entire route
export const maxDuration = 10;

// Database connection promise
let dbConnectionPromise: Promise<any> | null = null;

// Ensure database connection
async function ensureDbConnection() {
  if (!dbConnectionPromise) {
    console.debug('Creating new database connection promise');
    dbConnectionPromise = connectToDatabase()
      .catch(error => {
        console.error('Database connection error:', error);
        dbConnectionPromise = null;
        throw error;
      });
  }
  
  try {
    await dbConnectionPromise;
    console.debug('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    dbConnectionPromise = null;
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      folderName,
      cid, 
      size,
      walletAddress,
      files
    } = data;

    console.debug('Received folder upload request:', { folderName, cid, size, walletAddress, fileCount: files?.length });

    if (!walletAddress) {
      console.error('Folder upload failed: No wallet address provided');
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    if (!folderName || !cid || !size || !files) {
      console.error('Folder upload failed: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.debug('Connecting to MongoDB...');
    const connected = await ensureDbConnection();
    if (!connected) {
      return NextResponse.json({ error: 'Failed to connect to database' }, { status: 503 });
    }

    // Create folder entry
    console.debug('Creating folder record:', { folderName, cid, size, walletAddress });
    const folder = await FileModel.create({
      fileName: folderName,
      cid,
      size,
      mimeType: 'application/folder',
      walletAddress,
      isFolder: true,
      parentFolder: null,
      folderPath: '/'
    });

    // Process files in the folder
    const fileEntries = [];
    for (const file of files) {
      const { fileName, cid: fileCid, size: fileSize, mimeType, relativePath } = file;
      
      // Extract folder path from relative path
      const pathParts = relativePath.split('/');
      const path = pathParts.length > 1 
        ? '/' + pathParts.slice(0, -1).join('/') 
        : '/';
      
      console.debug('Adding file to folder:', { fileName, fileCid, fileSize, relativePath, path });
      
      const fileEntry = await FileModel.create({
        fileName,
        cid: fileCid,
        size: fileSize,
        mimeType: mimeType || 'application/octet-stream',
        walletAddress,
        isFolder: false,
        parentFolder: folder._id ? folder._id.toString() : null,
        folderPath: path
      });
      
      fileEntries.push(fileEntry);
    }

    // Calculate total size
    const sizeInBytes = parseInt(size, 10);
    if (isNaN(sizeInBytes)) {
      console.error('Invalid folder size:', size);
      return NextResponse.json({ error: 'Invalid folder size' }, { status: 400 });
    }

    // Update user storage usage
    console.debug('Updating user storage usage:', { walletAddress, sizeInBytes });
    const userUpdate = await User.findOneAndUpdate(
      { walletAddress },
      { 
        $inc: { totalStorageUsed: sizeInBytes },
        $setOnInsert: { walletAddress }
      },
      { 
        upsert: true,
        new: true
      }
    );

    if (!userUpdate) {
      console.error('Failed to update user storage usage');
      return NextResponse.json({ error: 'Failed to update user storage' }, { status: 500 });
    }

    // Invalidate any caches
    const cacheKey = `files:${walletAddress}`;
    // Check if fileListCache exists on the global object
    if (typeof global !== 'undefined' && 'fileListCache' in global && (global as any).fileListCache instanceof Map) {
      (global as any).fileListCache.delete(cacheKey);
    }

    console.debug('Folder and files stored successfully:', { 
      folderId: folder._id ? folder._id.toString() : null, 
      fileCount: fileEntries.length 
    });
    
    return NextResponse.json({ 
      success: true, 
      folder,
      files: fileEntries,
      totalFiles: fileEntries.length
    });
  } catch (error) {
    console.error('Error in folder upload route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 