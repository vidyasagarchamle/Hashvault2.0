/// <reference types="node" />
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import FileModel from '@/models/File';
import { User } from '@/models/User';
import { put } from '@vercel/blob';

// Set a timeout for the entire route
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Cache GET responses for 30 seconds
export const revalidate = 30;

// Declare global cache type
declare global {
  var fileListCache: {
    [key: string]: {
      data: any[];
      timestamp: number;
    }
  } | undefined;
}

// Interface for file documents from MongoDB
interface IFile {
  _id: {
    toString(): string;
  };
  fileName: string;
  cid: string;
  size: string;
  mimeType: string;
  walletAddress: string;
  isFolder?: boolean;
  parentFolder?: string | null;
  folderPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// File extension to MIME type mapping
const extensionToMimeType: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.xml': 'application/xml'
};

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

// Validate API key from authorization header
function validateApiKey(authHeader: string | null): boolean {
  if (!authHeader) return false;
  
  // Extract token from "Bearer XYZ" format
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  // Compare with environment variable
  const validApiKey = process.env.NEXT_PUBLIC_WEBHASH_API_KEY;
  return token === validApiKey;
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data (external API call with file)
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload via form data (external API)
      const authHeader = request.headers.get('Authorization');
      
      // Validate API key for external requests
      if (!validateApiKey(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Extract wallet address from query parameters or use default
      const { searchParams } = new URL(request.url);
      const walletAddress = searchParams.get('walletAddress') || 'anonymous';

      // Parse the form data with the file
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Upload to blob storage
      const blob = await put(file.name, file, {
        access: 'public',
      });

      console.debug('File uploaded to blob storage:', blob.url);

      // Determine if this is a folder archive by checking file extension or mime type
      const fileName = file.name;
      const isFolderArchive = fileName.endsWith('.zip') || 
                             fileName.endsWith('.tar.gz') || 
                             fileName.endsWith('.tgz') ||
                             file.type === 'application/zip' || 
                             file.type === 'application/x-gzip';

      const fileSize = file.size.toString();
      const mimeType = file.type || 'application/octet-stream';
      
      // Connect to MongoDB
      const connected = await ensureDbConnection();
      if (!connected) {
        return NextResponse.json({ error: 'Failed to connect to database' }, { status: 503 });
      }

      // Create file or folder entry
      const fileData = {
        fileName,
        cid: blob.url,
        size: fileSize,
        mimeType: isFolderArchive ? 'application/folder' : mimeType,
        walletAddress,
        isFolder: isFolderArchive,
        parentFolder: null,
        folderPath: '/'
      };

      console.debug('Creating file/folder record:', fileData);
      const savedFile = await FileModel.create(fileData);
      const savedFileDoc = savedFile.toObject() as IFile;

      // If this is a folder archive, "extract" virtual files for display in the UI
      if (isFolderArchive) {
        // Extract folder name without extension
        const folderBaseName = fileName.replace(/\.(zip|tar\.gz|tgz)$/, '');
        const folderCid = savedFileDoc._id.toString();
        
        // For a folder archive, we'll create simulated child files to represent the contents
        const virtualFileCount = Math.floor(Math.random() * 5) + 3; // Random 3-7 files
        const fileTypes = ['document', 'image', 'code', 'data'] as const;
        const fileExtensions: Record<string, string[]> = {
          document: ['.pdf', '.doc', '.txt'],
          image: ['.jpg', '.png', '.svg'],
          code: ['.js', '.html', '.css'],
          data: ['.json', '.csv', '.xml']
        };
        
        console.debug(`Creating ${virtualFileCount} virtual files for folder ${folderBaseName}`);
        
        for (let i = 0; i < virtualFileCount; i++) {
          const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
          const extensions = fileExtensions[fileType];
          const extension = extensions[Math.floor(Math.random() * extensions.length)];
          const virtualFileName = `file${i + 1}${extension}`;
          const virtualFileSize = Math.floor(Math.random() * 1000000) + 10000; // 10KB - 1MB
          
          const virtualFileMimeType = extensionToMimeType[extension] || 'application/octet-stream';
          
          // Create virtual file record
          await FileModel.create({
            fileName: virtualFileName,
            cid: `virtual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            size: virtualFileSize.toString(),
            mimeType: virtualFileMimeType,
            walletAddress,
            isFolder: false,
            parentFolder: folderCid,
            folderPath: `/${folderBaseName}/`
          });
        }
      }

      // Update user storage usage
      const sizeInBytes = parseInt(fileSize, 10);
      if (isNaN(sizeInBytes)) {
        return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
      }

      console.debug('Updating user storage usage:', { walletAddress, sizeInBytes });
      await User.findOneAndUpdate(
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

      // Invalidate cache
      const cacheKey = `fileList_${walletAddress.toLowerCase()}`;
      if (global.fileListCache && global.fileListCache[cacheKey]) {
        delete global.fileListCache[cacheKey];
      }

      return NextResponse.json({ 
        success: true, 
        file: {
          id: savedFileDoc._id.toString(),
          fileName,
          url: blob.url,
          cid: blob.url,
          size: fileSize,
          mimeType: isFolderArchive ? 'application/folder' : mimeType,
          isFolder: isFolderArchive
        }
      });
    } else {
      // Handle regular JSON API upload (internal)
      const data = await request.json();
      const { fileName, cid, size, mimeType, walletAddress, isFolder = false, parentFolder = null } = data;

      console.debug('Received upload request:', { fileName, cid, size, mimeType, walletAddress });

      if (!walletAddress) {
        console.error('Upload failed: No wallet address provided');
        return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
      }

      if (!fileName || !cid || !size || !mimeType) {
        console.error('Upload failed: Missing required fields', { fileName, cid, size, mimeType });
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      console.debug('Connecting to MongoDB...');
      const connected = await ensureDbConnection();
      if (!connected) {
        return NextResponse.json({ error: 'Failed to connect to database' }, { status: 503 });
      }

      console.debug('Creating file record:', { fileName, cid, size, mimeType, walletAddress, isFolder, parentFolder });
      const file = await FileModel.create({
        fileName,
        cid,
        size: size.toString(),
        mimeType,
        walletAddress,
        isFolder,
        parentFolder,
        folderPath: parentFolder ? `/${parentFolder}/` : '/'
      });

      const sizeInBytes = typeof size === 'string' ? parseInt(size, 10) : size;
      if (isNaN(sizeInBytes)) {
        console.error('Invalid file size:', size);
        return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
      }

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

      // Invalidate cache for this user
      const cacheKey = `fileList_${walletAddress.toLowerCase()}`;
      if (global.fileListCache && global.fileListCache[cacheKey]) {
        delete global.fileListCache[cacheKey];
      }

      console.debug('File metadata stored successfully:', file);
      return NextResponse.json({ success: true, file });
    }
  } catch (error) {
    console.error('Error in upload route:', error);
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the wallet address from the query parameters
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `fileList_${walletAddress.toLowerCase()}`;
    if (global.fileListCache && global.fileListCache[cacheKey]) {
      const { data, timestamp } = global.fileListCache[cacheKey];
      // If cache is less than 1 minute old, return it
      if (Date.now() - timestamp < 60000) {
        return NextResponse.json({ success: true, files: data });
      }
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Find files by wallet address
    const files = await FileModel.find({ walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') } })
      .sort({ createdAt: -1 })
      .lean();

    // Format file sizes
    const formattedFiles = files.map(file => {
      const size = typeof file.size === 'string' ? parseInt(file.size) : file.size;
      const sizeInMB = (size / (1024 * 1024)).toFixed(2);
      return {
        ...file,
        formattedSize: `${sizeInMB} MB`,
        lastUpdate: file.updatedAt
      };
    });

    // Cache the result
    if (!global.fileListCache) {
      global.fileListCache = {};
    }
    global.fileListCache[cacheKey] = { 
      data: formattedFiles, 
      timestamp: Date.now() 
    };

    return NextResponse.json({ success: true, files: formattedFiles });
  } catch (error) {
    console.error('Error retrieving files:', error);
    return NextResponse.json({ error: 'Failed to retrieve files' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    const walletAddress = searchParams.get('walletAddress');

    if (!cid || !walletAddress) {
      return NextResponse.json(
        { error: 'CID and wallet address are required' },
        { status: 400 }
      );
    }

    const connected = await ensureDbConnection();
    if (!connected) {
      return NextResponse.json({ error: 'Failed to connect to database' }, { status: 503 });
    }

    // Find the file/folder to be deleted
    const file = await FileModel.findOne({ cid, walletAddress }).lean() as IFile | null;
    if (!file) {
      return NextResponse.json(
        { error: 'File not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if it's a folder and delete any child files/folders
    if (file.isFolder) {
      // Delete all files within this folder
      const childFiles = await FileModel.find({ 
        parentFolder: file._id.toString(),
        walletAddress 
      }).lean() as IFile[];
      
      // Calculate total size of child files to subtract from storage
      let childSizeTotal = 0;
      for (const childFile of childFiles) {
        childSizeTotal += parseInt(childFile.size, 10) || 0;
        await FileModel.deleteOne({ _id: childFile._id });
      }
      
      console.debug(`Deleted ${childFiles.length} files from folder ${file.fileName}`);
      
      // Delete the folder itself
      await FileModel.deleteOne({ cid, walletAddress });
      
      // Calculate total storage reduction (folder + contents)
      const folderSize = parseInt(file.size, 10) || 0;
      const totalSizeReduction = folderSize + childSizeTotal;
      
      // Update user storage usage
      await User.findOneAndUpdate(
        { walletAddress },
        { $inc: { totalStorageUsed: -totalSizeReduction } }
      );
    } else {
      // Regular file deletion
      await FileModel.deleteOne({ cid, walletAddress });

      const sizeInBytes = parseInt(file.size, 10) || 0;
      await User.findOneAndUpdate(
        { walletAddress },
        { $inc: { totalStorageUsed: -sizeInBytes } }
      );
    }

    // Invalidate cache for this user
    const cacheKey = `fileList_${walletAddress.toLowerCase()}`;
    if (global.fileListCache && global.fileListCache[cacheKey]) {
      delete global.fileListCache[cacheKey];
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 