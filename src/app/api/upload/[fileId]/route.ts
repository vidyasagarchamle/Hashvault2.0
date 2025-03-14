import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import File from '@/models/File';

export async function DELETE(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    await connectToDatabase();
    
    const file = await File.findOne({ cid: fileId });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await File.deleteOne({ cid: fileId });
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
} 