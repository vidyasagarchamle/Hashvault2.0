import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';
import FileModel from '@/models/File';

// Mark this route as dynamic to allow headers usage
export const dynamic = 'force-dynamic';

// Set a timeout for the entire route
export const maxDuration = 5;

// Response type for better type safety
type StorageInfoResponse = {
  totalStorageUsed: number;
  totalStoragePurchased: number;
  totalAvailableStorage: number;
  remainingStorage: number;
  filesCount: number;
  estimated?: boolean;
  error?: string;
  _debug?: Record<string, any>;
};

/**
 * API route handler for getting storage information
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    // Clean up the wallet address (remove any "Bearer " prefix if present)
    const walletAddress = authHeader.replace('Bearer ', '').toLowerCase();
    
    // Get storage info
    console.log('Storage info request for wallet:', walletAddress);
    const result = await getStorageInfo(walletAddress);
    
    // Return with no-cache headers
    return new NextResponse(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Unhandled error in storage info route:', error);
    
    return NextResponse.json({
      totalStorageUsed: 0,
      totalStoragePurchased: 0,
      totalAvailableStorage: FREE_STORAGE_LIMIT,
      remainingStorage: FREE_STORAGE_LIMIT,
      filesCount: 0,
      error: 'Could not retrieve storage information'
    } as StorageInfoResponse);
  }
}

/**
 * Main function to get storage info for a wallet address
 */
async function getStorageInfo(walletAddress: string): Promise<StorageInfoResponse> {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Try to find files using different query strategies
    const files = await findFilesForWallet(walletAddress);
    
    // Calculate total storage used
    let actualStorageUsed = 0;
    for (const file of files) {
      const fileSize = parseInt(file.size, 10) || 0;
      actualStorageUsed += fileSize;
    }
    
    console.log(`Found ${files.length} files with total size: ${actualStorageUsed} bytes (${(actualStorageUsed / (1024 * 1024)).toFixed(2)} MB)`);
    
    // Get or create user and update storage info
    const { totalStoragePurchased } = await getOrCreateUser(walletAddress, actualStorageUsed);
    
    // Calculate storage info
    const totalAvailableStorage = FREE_STORAGE_LIMIT + totalStoragePurchased;
    const remainingStorage = Math.max(0, totalAvailableStorage - actualStorageUsed);
    
    // Create response data
    const responseData: StorageInfoResponse = {
      totalStorageUsed: actualStorageUsed,
      totalStoragePurchased,
      totalAvailableStorage,
      remainingStorage,
      filesCount: files.length,
      _debug: {
        actualBytes: actualStorageUsed,
        formattedSize: `${(actualStorageUsed / (1024 * 1024)).toFixed(2)} MB`,
        timestamp: new Date().toISOString(),
        walletAddress
      }
    };
    
    return responseData;
  } catch (error) {
    console.error('Error processing storage info:', error);
    return getFallbackStorageInfo(walletAddress);
  }
}

/**
 * Helper function to find files for a wallet address using multiple query strategies
 */
async function findFilesForWallet(walletAddress: string): Promise<any[]> {
  // Create a case-insensitive regex for the wallet address
  const walletRegex = new RegExp(`^${walletAddress}$`, 'i');
  
  // First try with case-insensitive regex
  const files = await FileModel.find({ walletAddress: walletRegex }).lean();
  if (files.length > 0) {
    console.log(`Found ${files.length} files using regex query`);
    return files;
  }
  
  // Try direct match
  const directFiles = await FileModel.find({ walletAddress }).lean();
  if (directFiles.length > 0) {
    console.log(`Found ${directFiles.length} files with direct query`);
    return directFiles;
  }
  
  // Try with lowercase
  const lowerFiles = await FileModel.find({ walletAddress: walletAddress.toLowerCase() }).lean();
  if (lowerFiles.length > 0) {
    console.log(`Found ${lowerFiles.length} files with lowercase query`);
    return lowerFiles;
  }
  
  // Try with uppercase
  const upperFiles = await FileModel.find({ walletAddress: walletAddress.toUpperCase() }).lean();
  if (upperFiles.length > 0) {
    console.log(`Found ${upperFiles.length} files with uppercase query`);
    return upperFiles;
  }
  
  // Try with substring search (removing 0x prefix if present)
  if (walletAddress.startsWith('0x') && walletAddress.length > 2) {
    const substringFiles = await FileModel.find({ 
      walletAddress: { $regex: walletAddress.substring(2), $options: 'i' } 
    }).lean();
    if (substringFiles.length > 0) {
      console.log(`Found ${substringFiles.length} files with substring query`);
      return substringFiles;
    }
  }
  
  // No files found with any query
  console.log('No files found for wallet address');
  return [];
}

/**
 * Get or create user and update storage info
 */
async function getOrCreateUser(walletAddress: string, storageUsed: number): Promise<{ totalStoragePurchased: number }> {
  let user = await User.findOne({ walletAddress }).lean();
  let totalStoragePurchased = 0;
  
  if (!user) {
    console.log('User not found, creating new user');
    try {
      await User.create({
        walletAddress,
        totalStorageUsed: storageUsed,
        totalStoragePurchased: 0,
        totalAvailableStorage: FREE_STORAGE_LIMIT
      });
    } catch (err) {
      console.error('Error creating user:', err);
    }
  } else {
    totalStoragePurchased = user.totalStoragePurchased || 0;
    
    // Update user storage if different
    if (user.totalStorageUsed !== storageUsed) {
      console.log(`Updating user storage from ${user.totalStorageUsed} to ${storageUsed} bytes`);
      try {
        await User.updateOne(
          { walletAddress },
          { $set: { totalStorageUsed: storageUsed } }
        );
      } catch (err) {
        console.error('Error updating user storage:', err);
      }
    }
  }
  
  return { totalStoragePurchased };
}

/**
 * Get fallback storage info if main function fails
 */
async function getFallbackStorageInfo(walletAddress: string): Promise<StorageInfoResponse> {
  try {
    const filesCount = await FileModel.countDocuments({ walletAddress });
    let estimatedStorage = 0;
    
    if (filesCount > 0) {
      // Assume average file size of 200KB
      estimatedStorage = filesCount * 200 * 1024;
    }
    
    return {
      totalStorageUsed: estimatedStorage,
      totalStoragePurchased: 0,
      totalAvailableStorage: FREE_STORAGE_LIMIT,
      remainingStorage: FREE_STORAGE_LIMIT - estimatedStorage,
      filesCount,
      estimated: true
    };
  } catch (error) {
    console.error('Error in fallback storage info:', error);
    
    return {
      totalStorageUsed: 0,
      totalStoragePurchased: 0,
      totalAvailableStorage: FREE_STORAGE_LIMIT,
      remainingStorage: FREE_STORAGE_LIMIT,
      filesCount: 0,
      error: 'Could not retrieve storage information'
    };
  }
} 