import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';

// Mark this route as dynamic to allow headers usage
export const dynamic = 'force-dynamic';

// Set a timeout for the entire route
export const maxDuration = 5; // 5 seconds

// Cache the response for 60 seconds
export const revalidate = 60;

// In-memory cache for storage info
const storageInfoCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 120 * 1000; // 2 minutes (increased from 60 seconds)

// Track ongoing requests to prevent duplicate calls
const ongoingRequests = new Map<string, Promise<any>>();

export async function GET(req: Request) {
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
    
    // Create a unique request ID
    const requestId = `storage_info:${walletAddress}`;
    
    // Check if there's an ongoing request for this wallet
    if (ongoingRequests.has(requestId)) {
      console.log('Returning existing request for wallet:', walletAddress);
      return ongoingRequests.get(requestId);
    }
    
    // Create a new request promise
    const requestPromise = processStorageInfoRequest(walletAddress, requestId);
    ongoingRequests.set(requestId, requestPromise);
    
    // Clean up the ongoing request map after the request is complete
    requestPromise.finally(() => {
      ongoingRequests.delete(requestId);
    });
    
    return requestPromise;
  } catch (error: any) {
    console.error("Storage info error:", error);
    return NextResponse.json(
      { error: `Failed to fetch storage information: ${error.message}` },
      { status: 500 }
    );
  }
}

async function processStorageInfoRequest(walletAddress: string, requestId: string) {
  try {
    console.log('Processing request for wallet:', walletAddress);

    // Check in-memory cache first
    const cachedData = storageInfoCache.get(requestId);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('Returning cached storage info for wallet:', walletAddress);
      return NextResponse.json(cachedData.data, {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`,
        }
      });
    }

    // Connect to database with retries
    let retries = 2;
    let lastError;
    
    while (retries > 0) {
      try {
        console.log(`Attempting database connection (${retries} retries left)...`);
        await connectToDatabase();
        console.log('Database connected successfully');
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`Database connection attempt failed: ${error.message}`);
        retries--;
        if (retries > 0) {
          // Wait for 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (retries === 0) {
      console.error('All database connection attempts failed:', lastError);
      return NextResponse.json(
        { error: "Database connection failed after multiple attempts" },
        { status: 503 }
      );
    }

    // Get user's storage information
    let user;
    try {
      console.log('Looking up user in database...');
      // Use lean() for better performance and projection to only get the fields we need
      user = await User.findOne(
        { walletAddress }, 
        'totalStorageUsed totalStoragePurchased totalAvailableStorage'
      ).lean();
      console.log('User lookup result:', user ? 'Found' : 'Not found');
    } catch (error: any) {
      console.error('User lookup error:', error);
      return NextResponse.json(
        { error: `Failed to lookup user: ${error.message}` },
        { status: 500 }
      );
    }

    if (!user) {
      // Create a new user with default values
      try {
        console.log('Creating new user...');
        const newUser = new User({
          walletAddress,
          totalStorageUsed: 0,
          totalStoragePurchased: 0,
          totalAvailableStorage: FREE_STORAGE_LIMIT,
          // Don't set email field at all
        });
        await newUser.save();
        console.log('New user created successfully');

        const responseData = {
          totalStorageUsed: 0,
          totalStoragePurchased: 0,
          totalAvailableStorage: FREE_STORAGE_LIMIT,
          remainingStorage: FREE_STORAGE_LIMIT,
        };
        
        // Cache the response
        storageInfoCache.set(requestId, {
          data: responseData,
          timestamp: Date.now()
        });

        return NextResponse.json(responseData, {
          headers: {
            'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`,
          }
        });
      } catch (error: any) {
        console.error('User creation error:', error);
        return NextResponse.json(
          { error: `Failed to create new user: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Calculate total available storage (free + purchased)
    const totalAvailableStorage = FREE_STORAGE_LIMIT + (user.totalStoragePurchased || 0);
    const totalStorageUsed = user.totalStorageUsed || 0;
    const remainingStorage = Math.max(0, totalAvailableStorage - totalStorageUsed);

    const responseData = {
      totalStorageUsed,
      totalStoragePurchased: user.totalStoragePurchased || 0,
      totalAvailableStorage,
      remainingStorage,
    };

    console.log('Returning storage info:', responseData);
    
    // Cache the response
    storageInfoCache.set(requestId, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`,
      }
    });
  } catch (error: any) {
    console.error("Storage info processing error:", error);
    return NextResponse.json(
      { error: `Failed to process storage information: ${error.message}` },
      { status: 500 }
    );
  }
} 