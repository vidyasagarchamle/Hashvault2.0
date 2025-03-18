import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import File from '@/models/File';

export async function DELETE(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    const { cid } = params;
    await connectToDatabase();
    
    const file = await File.findOne({ cid });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await File.deleteOne({ cid });
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    const { cid } = params;
    const { isFolder, mimeType } = await request.json();
    
    // Get the authorization header
    const walletAddress = request.headers.get('Authorization');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Update the file metadata
    const updatedFile = await File.findOneAndUpdate(
      { cid, walletAddress },
      { isFolder, mimeType },
      { new: true }
    );

    if (!updatedFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Invalidate the cache
    if (global.fileListCache) {
      delete global.fileListCache[walletAddress];
    }

    return NextResponse.json({ file: updatedFile });
  } catch (error) {
    console.error('Error updating file metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update file metadata' },
      { status: 500 }
    );
  }
} 