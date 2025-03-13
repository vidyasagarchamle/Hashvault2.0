import { NextRequest, NextResponse } from 'next/server';
import { getStorageClient } from '@/lib/storage-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  try {
    const { cid } = params;
    if (!cid) {
      return NextResponse.json(
        { error: 'CID not provided' },
        { status: 400 }
      );
    }

    // Get the initialized client
    const storageClient = await getStorageClient();
    
    // Retrieve file
    const res = await storageClient.get(cid);
    if (!res) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Stream the file data
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': res.headers.get('Content-Length') || '',
      },
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve file' },
      { status: 500 }
    );
  }
} 