import { NextRequest, NextResponse } from 'next/server';

// Set a timeout for the entire route
export const maxDuration = 60; // 60 seconds for large file uploads

// API keys for different endpoints
const FILE_API_KEY = '22b02f7023db2e5f9c605fe7dca3ef879a74781bf773fb043ddeeb0ee6a268b3';
const FOLDER_API_KEY = '22b02f7023db2e5f9c605fe7dca3ef879a74781bf773fb043ddeeb0ee7q348b3';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Invalid or missing Authorization header:', authHeader);
      return NextResponse.json(
        { error: 'Invalid or missing Authorization header' },
        { status: 401 }
      );
    }

    // Extract the API key
    const apiKey = authHeader.split(' ')[1];
    const baseUrl = 'http://52.38.175.117';

    // Clone the request to forward it
    const formData = await request.formData();
    
    // Get the file and check if it's a zip file (folder upload)
    const file = formData.get('file') as File;
    if (!file) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file found in request' },
        { status: 400 }
      );
    }

    // Determine which endpoint to use based on file type
    const isZipFile = file.type === 'application/zip' || file.name.endsWith('.zip');
    const port = isZipFile ? '5009' : '5000';
    const webhashApiUrl = `${baseUrl}:${port}`;

    // Use the appropriate API key based on file type
    const expectedApiKey = isZipFile ? FOLDER_API_KEY : FILE_API_KEY;

    // Create new FormData for the WebHash API
    const webhashFormData = new FormData();
    webhashFormData.append('file', file);

    console.log('Upload request details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      endpoint: webhashApiUrl,
      isZipFile,
      apiKeyMatch: apiKey === expectedApiKey
    });

    // Forward the request to the WebHash API with timeout
    let webhashResponse;
    try {
      webhashResponse = await fetch(`${webhashApiUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${expectedApiKey}`
        },
        body: webhashFormData,
        signal: AbortSignal.timeout(50000) // 50 second timeout
      });

      console.log('WebHash API response status:', webhashResponse.status);

      if (!webhashResponse.ok) {
        const errorText = await webhashResponse.text();
        console.error('WebHash API error:', {
          status: webhashResponse.status,
          error: errorText,
          endpoint: webhashApiUrl
        });
        return NextResponse.json(
          { error: `WebHash API error: ${errorText}` },
          { status: webhashResponse.status }
        );
      }

      // Get the response from WebHash
      const data = await webhashResponse.json();
      console.log('WebHash API success:', {
        ...data,
        endpoint: webhashApiUrl
      });

      return NextResponse.json(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timed out');
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 504 }
        );
      }
      console.error('Error during WebHash API request:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 