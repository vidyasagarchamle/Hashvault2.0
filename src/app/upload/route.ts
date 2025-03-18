import { NextRequest, NextResponse } from 'next/server';

// Simple proxy to redirect external API calls to internal API
export async function POST(request: NextRequest) {
  const url = new URL('/api/upload', request.url);
  
  // Forward any query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  
  // Create a new request with the same body and headers
  const newRequest = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  // Forward the request to the internal API
  const response = await fetch(newRequest);
  
  // Return the response from the internal API
  return response;
} 