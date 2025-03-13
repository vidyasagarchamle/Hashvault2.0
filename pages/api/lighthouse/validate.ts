import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured',
        solution: 'Add NEXT_PUBLIC_LIGHTHOUSE_API_KEY to your .env file'
      });
    }

    // Clean the API key and ensure proper format
    const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '').trim();
    
    // Try the validation endpoint with Bearer prefix
    const response = await fetch('https://api.lighthouse.storage/api/user/user_data_usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanApiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        success: true,
        message: 'API key is valid',
        details: data
      });
    }

    // If that failed, try without Bearer prefix
    const response2 = await fetch('https://api.lighthouse.storage/api/user/user_data_usage', {
      method: 'GET',
      headers: {
        'Authorization': cleanApiKey
      }
    });

    if (response2.ok) {
      const data = await response2.json();
      return res.status(200).json({
        success: true,
        message: 'API key is valid',
        details: data
      });
    }

    const errorText = await response.text();
    console.error('API Key validation failed:', {
      apiKey: cleanApiKey,
      error: errorText
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      details: errorText,
      solution: `Please follow these steps:
      1. Visit https://files.lighthouse.storage/
      2. Log in and go to the API Keys section
      3. Generate a new API key
      4. Update your .env file with: NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_new_key`
    });

  } catch (error: any) {
    console.error('Validation error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
} 