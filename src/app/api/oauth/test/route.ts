import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      access_token_url, 
      client_id, 
      client_secret, 
      scope 
    } = body;

    if (!access_token_url || !client_id || !client_secret || !scope) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const results = [];

    // Test Method 1: Basic Auth (Standard OAuth2)
    try {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      
      const response = await fetch(access_token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: scope,
        }),
      });

      const responseText = await response.text();
      
      results.push({
        method: 'Basic Auth',
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        error: !response.ok ? responseText : null
      });
    } catch (error) {
      results.push({
        method: 'Basic Auth',
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Method 2: Form-encoded (Alternative OAuth2)
    try {
      const response = await fetch(access_token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: client_id,
          client_secret: client_secret,
          scope: scope,
        }),
      });

      const responseText = await response.text();
      
      results.push({
        method: 'Form-encoded',
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        error: !response.ok ? responseText : null
      });
    } catch (error) {
      results.push({
        method: 'Form-encoded',
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Method 3: Basic Auth with Church-specific headers
    try {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      
      const response = await fetch(access_token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0 (Church Systems)',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: scope,
        }),
      });

      const responseText = await response.text();
      
      results.push({
        method: 'Basic Auth (Enhanced Headers)',
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        error: !response.ok ? responseText : null
      });
    } catch (error) {
      results.push({
        method: 'Basic Auth (Enhanced Headers)',
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Method 4: Check if endpoint is reachable at all
    try {
      const response = await fetch(access_token_url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0',
        },
      });

      const responseText = await response.text();
      
      results.push({
        method: 'GET (Endpoint Check)',
        status: response.status,
        statusText: response.statusText,
        success: response.status < 500, // 400s are expected for GET, 500s indicate server issues
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        error: response.status >= 500 ? responseText : null
      });
    } catch (error) {
      results.push({
        method: 'GET (Endpoint Check)',
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      summary: {
        total_tests: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      results: results,
      config: {
        access_token_url,
        client_id: client_id.substring(0, 8) + '...' + client_id.slice(-4),
        scope
      }
    });

  } catch (error) {
    console.error('OAuth test API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
