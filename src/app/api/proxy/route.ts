import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  console.log('Proxying to:', targetUrl);

  try {
    // Add $format=json if not present
    let finalUrl = targetUrl;
    if (!finalUrl.includes('$format=')) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + '$format=json';
    }

    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Target API error:', text);
      return NextResponse.json({ error: 'Target API error', details: text }, { status: response.status });
    }

    const data = await response.json();
    console.log('Proxy response received successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed to process request' }, { status: 500 });
  }
}
