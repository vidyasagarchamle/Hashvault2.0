/// <reference types="node" />
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FileModel from '@/models/File';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { fileName, cid, size, mimeType, walletAddress } = data;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    await connectDB();

    const file = await FileModel.create({
      fileName,
      cid,
      size,
      mimeType,
      walletAddress,
    });

    console.debug('File metadata stored:', file);

    return NextResponse.json({ success: true, file });
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      console.debug('No wallet address provided in request');
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.debug('Attempting to connect to MongoDB...');
    try {
      await connectDB();
      console.debug('MongoDB connected successfully');
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    console.debug('Fetching files for wallet:', walletAddress);
    let files;
    try {
      files = await FileModel.find({ walletAddress })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } catch (queryError) {
      console.error('Error querying files:', queryError);
      return NextResponse.json(
        {
          error: 'Failed to query files',
          message: queryError instanceof Error ? queryError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Transform the files to include _id as a string
    const transformedFiles = files.map(file => ({
      ...file,
      _id: file._id.toString(),
      lastUpdate: file.updatedAt
    }));

    console.debug(`Found ${transformedFiles.length} files for wallet ${walletAddress}`);
    return NextResponse.json({ success: true, files: transformedFiles });
  } catch (error) {
    console.error('Error in GET /api/upload:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 