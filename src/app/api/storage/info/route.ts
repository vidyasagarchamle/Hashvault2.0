import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { FREE_STORAGE_LIMIT } from '@/lib/constants';

// Mark this route as dynamic to allow headers usage
export const dynamic = 'force-dynamic';

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

    await connectToDatabase();

    // Get user's storage information
    const user = await User.findOne({ walletAddress: authHeader });
    if (!user) {
      // Return default values for new users
      return NextResponse.json({
        totalStorageUsed: 0,
        totalStoragePurchased: 0,
        totalAvailableStorage: FREE_STORAGE_LIMIT,
        remainingStorage: FREE_STORAGE_LIMIT,
      });
    }

    // Calculate total available storage (free + purchased)
    const totalAvailableStorage = FREE_STORAGE_LIMIT + (user.totalStoragePurchased || 0);
    const totalStorageUsed = user.totalStorageUsed || 0;
    const remainingStorage = Math.max(0, totalAvailableStorage - totalStorageUsed);

    return NextResponse.json({
      totalStorageUsed,
      totalStoragePurchased: user.totalStoragePurchased || 0,
      totalAvailableStorage,
      remainingStorage,
    });
  } catch (error) {
    console.error("Storage info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage information" },
      { status: 500 }
    );
  }
} 