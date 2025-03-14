import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import FileModel from '@/models/File';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const walletAddress = req.headers['x-wallet-address'] as string;
  if (!walletAddress) {
    return res.status(401).json({ error: 'Unauthorized - No wallet address provided' });
  }

  try {
    await connectToDatabase();

    // Get user's files
    const files = await FileModel.find({ walletAddress })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
} 