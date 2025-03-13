import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the wallet address from the request headers or query
  const walletAddress = req.headers['x-wallet-address'] || req.query.walletAddress;

  if (!walletAddress) {
    return res.status(401).json({ error: 'Unauthorized - No wallet address provided' });
  }

  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const files = await File.find({ walletAddress })
          .sort({ createdAt: -1 })
          .lean();
        return res.status(200).json(files);
      } catch (error) {
        console.error('Error fetching files:', error);
        return res.status(500).json({ error: 'Error fetching files' });
      }

    case 'DELETE':
      try {
        const { fileId } = req.query;
        if (!fileId) {
          return res.status(400).json({ error: 'File ID is required' });
        }

        const result = await File.deleteOne({
          _id: fileId,
          walletAddress,
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'File not found' });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ error: 'Error deleting file' });
      }

    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 