import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Get file size from request body
    const { fileSize } = await request.json();
    if (!fileSize || typeof fileSize !== 'number') {
      return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Find or create user
    let user = await User.findOne({ walletAddress: authHeader });
    
    if (!user) {
      try {
        user = await User.create({
          walletAddress: authHeader,
          totalStorageUsed: 0,
          totalStoragePurchased: 0,
          lastStorageCheck: new Date(),
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Calculate total available storage
    const totalAvailableStorage = FREE_STORAGE_LIMIT + (user.totalStoragePurchased || 0);
    const totalStorageUsed = user.totalStorageUsed || 0;
    const remainingStorage = totalAvailableStorage - totalStorageUsed;

    // Check if file size exceeds free storage limit
    if (fileSize > FREE_STORAGE_LIMIT) {
      return NextResponse.json({
        error: 'File size exceeds free storage limit',
        limit: FREE_STORAGE_LIMIT,
        fileSize,
      }, { status: 400 });
    }

    // Check if file size exceeds total available storage
    if (fileSize > remainingStorage) {
      return NextResponse.json({
        error: 'Not enough storage space',
        available: remainingStorage,
        required: fileSize,
      }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      remainingStorage,
      totalAvailableStorage,
      totalStorageUsed,
    });

  } catch (error) {
    console.error('Error checking storage:', error);
    return NextResponse.json({ error: 'Failed to check storage limits' }, { status: 500 });
  }
} 