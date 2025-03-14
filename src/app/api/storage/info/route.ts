import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';

// Mark this route as dynamic to allow headers usage
export const dynamic = 'force-dynamic';

// Set a timeout for the entire route
export const maxDuration = 10; // 10 seconds

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
    console.log('Processing request for wallet:', walletAddress);

    // Connect to database with retries
    let retries = 3;
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
          // Wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
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
      user = await User.findOne({ walletAddress });
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
        });
        await newUser.save();
        console.log('New user created successfully');

        return NextResponse.json({
          totalStorageUsed: 0,
          totalStoragePurchased: 0,
          totalAvailableStorage: FREE_STORAGE_LIMIT,
          remainingStorage: FREE_STORAGE_LIMIT,
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

    console.log('Returning storage info:', {
      totalStorageUsed,
      totalStoragePurchased: user.totalStoragePurchased || 0,
      totalAvailableStorage,
      remainingStorage,
    });

    return NextResponse.json({
      totalStorageUsed,
      totalStoragePurchased: user.totalStoragePurchased || 0,
      totalAvailableStorage,
      remainingStorage,
    });
  } catch (error: any) {
    console.error("Storage info error:", error);
    return NextResponse.json(
      { error: `Failed to fetch storage information: ${error.message}` },
      { status: 500 }
    );
  }
} 