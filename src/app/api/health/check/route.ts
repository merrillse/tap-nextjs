import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { health_url } = body;

    if (!health_url) {
      return NextResponse.json(
        { error: 'Missing health_url parameter' },
        { status: 400 }
      );
    }

    console.log('* Checking health endpoint:', health_url);
    console.log('* Current time is', new Date().toISOString());

    const healthResponse = await fetch(health_url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TAP-NextJS/1.0 (health-check)',
        'Cache-Control': 'no-cache',
      },
    });

    const responseText = await healthResponse.text();
    
    console.log('Health Check Response:', {
      url: health_url,
      status: healthResponse.status,
      statusText: healthResponse.statusText,
      headers: Object.fromEntries(healthResponse.headers.entries()),
      bodyLength: responseText.length
    });

    let healthData;
    try {
      healthData = JSON.parse(responseText);
    } catch {
      // If not JSON, return as text
      healthData = { raw_response: responseText };
    }

    return NextResponse.json({
      success: healthResponse.ok,
      status: healthResponse.status,
      statusText: healthResponse.statusText,
      data: healthData,
      headers: Object.fromEntries(healthResponse.headers.entries())
    });

  } catch (error) {
    console.error('Health check API route error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
