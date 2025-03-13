import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { STORAGE_PLAN_SIZE } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Get transaction hash from request body
    const { transactionHash } = await request.json();
    if (!transactionHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Find user
    const user = await User.findOne({ walletAddress: authHeader });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user's storage
    user.totalStoragePurchased += STORAGE_PLAN_SIZE;
    user.updatedAt = new Date();
    await user.save();

    // Return success response
    return NextResponse.json({
      success: true,
      totalStoragePurchased: user.totalStoragePurchased,
      totalAvailableStorage: user.totalStoragePurchased + STORAGE_PLAN_SIZE,
    });

  } catch (error) {
    console.error('Error processing storage purchase:', error);
    return NextResponse.json({ error: 'Failed to process storage purchase' }, { status: 500 });
  }
} 