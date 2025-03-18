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

    // Get transaction data from request body
    const { transactionHash, paymentMethod = 'USDT', network = 'Base' } = await request.json();
    if (!transactionHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }

    console.log(`Processing storage purchase: ${transactionHash}`, { paymentMethod, network });

    // Connect to database
    await connectToDatabase();

    // Find user
    const user = await User.findOne({ walletAddress: authHeader });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: In a production environment, we would verify the transaction on-chain
    // to ensure it was successful and sent the correct amount of USDT to our address
    // For now, we'll assume the transaction is valid

    // Record the payment details
    const paymentRecord = {
      transactionHash,
      paymentMethod,
      network,
      amount: STORAGE_PLAN_SIZE,
      timestamp: new Date()
    };

    // Update user's storage
    user.totalStoragePurchased += STORAGE_PLAN_SIZE;
    user.updatedAt = new Date();
    
    // Add payment record if it doesn't exist already
    if (!user.payments) {
      user.payments = [];
    }
    user.payments.push(paymentRecord);
    
    await user.save();

    console.log(`Storage purchase successful for user ${authHeader}`, {
      totalStoragePurchased: user.totalStoragePurchased,
      paymentRecord
    });

    // Return success response
    return NextResponse.json({
      success: true,
      totalStoragePurchased: user.totalStoragePurchased,
      totalAvailableStorage: user.totalAvailableStorage,
      paymentRecord
    });

  } catch (error) {
    console.error('Error processing storage purchase:', error);
    return NextResponse.json({ error: 'Failed to process storage purchase' }, { status: 500 });
  }
} 