// app/api/proxy-image/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Get the image URL from the query parameters
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    // 2. Fetch the image from Pinterest (No CORS here!)
    const response = await fetch(imageUrl);
    
    if (!response.ok) throw new Error('Failed to fetch image');

    // 3. Convert it to Base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // 4. Send the safe Base64 string back to your frontend
    return NextResponse.json({ 
      base64Image: `data:${contentType};base64,${base64}` 
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Error proxying image', { status: 500 });
  }
}