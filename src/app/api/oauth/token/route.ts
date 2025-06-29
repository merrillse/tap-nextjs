import { NextRequest, NextResponse } from 'next/server';
import { ENVIRONMENTS } from '@/lib/environments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      access_token_url, 
      client_id, 
      client_secret, 
      scope,
      method = 'basic', // 'basic' or 'form'
      environment = ''
    } = body;

    if (!access_token_url || !client_id || !scope) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Enhanced OAuth debugging
    console.group('🔐 OAuth Token Request Debug');
    console.log('🎯 OAuth Request Details:');
    console.log('  • Token URL:', access_token_url);
    console.log('  • Client ID:', client_id);
    console.log('  • Environment:', environment || 'default');
    console.log('  • Scope:', scope);
    console.log('  • Method:', method);
    console.log('  • Timestamp:', new Date().toISOString());

    // Find the environment config by environment key
    const envConfig = ENVIRONMENTS[environment];
    if (!envConfig) {
      return NextResponse.json(
        { error: 'Invalid environment', details: `No config found for environment: ${environment}` },
        { status: 400 }
      );
    }

    // Always use the client_id and client_secret from the environment config
    const actualClientId = envConfig.client_id;
    let actualClientSecret = envConfig.client_secret;
    if (!actualClientSecret) {
      // Try to get from environment variable
      const envVar = `${environment.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`;
      actualClientSecret = process.env[envVar] || '';
      if (!actualClientSecret) {
        return NextResponse.json(
          { error: 'Missing client secret', details: `Set ${envVar} in your environment.` },
          { status: 400 }
        );
      }
    }

    let tokenResponse: Response;

    if (method === 'basic') {
      // Basic Auth method - Church of Jesus Christ standard
      const credentials = Buffer.from(`${actualClientId}:${actualClientSecret}`).toString('base64');
      
      tokenResponse = await fetch(access_token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0 (tap-nextjs)',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: scope,
        }),
      });
    } else if (method === 'form') {
      // Form-encoded method
      tokenResponse = await fetch(access_token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0 (tap-nextjs)',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: actualClientId,
          client_secret: actualClientSecret,
          scope: scope,
        }),
      });
    } else {
      // JWT Bearer method - try with JWT-style credentials
      tokenResponse = await fetch(access_token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'TAP-NextJS/1.0 (tap-nextjs)',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: actualClientId,
          client_secret: actualClientSecret,
          scope: scope,
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        }),
      });
    }

    const responseText = await tokenResponse.text();
    
    // Enhanced OAuth response debugging
    console.log('🔄 OAuth Response Analysis:');
    console.log('  • Status:', tokenResponse.status, tokenResponse.statusText);
    console.log('  • Response Size:', (responseText.length / 1024).toFixed(1), 'KB');
    console.log('  • Content Type:', tokenResponse.headers.get('content-type'));
    console.log('  • Response Preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    if (!tokenResponse.ok) {
      console.error('❌ OAuth Token Request Failed:');
      console.error('  • Status:', tokenResponse.status, tokenResponse.statusText);
      console.error('  • Method:', method);
      console.error('  • URL:', access_token_url);
      console.error('  • Client ID:', actualClientId);
      console.error('  • Environment:', environment);
      console.error('  • Response Body:', responseText);
      console.groupEnd();
      
      return NextResponse.json(
        { 
          error: `Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
          details: responseText,
          method: method,
          url: access_token_url,
          headers: Object.fromEntries(tokenResponse.headers.entries())
        },
        { status: tokenResponse.status }
      );
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      console.error('❌ Failed to parse OAuth response as JSON');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Invalid JSON response', details: responseText },
        { status: 500 }
      );
    }

    // Log successful token acquisition (without sensitive data)
    console.log('✅ OAuth Token Success:');
    console.log('  • Token Type:', tokenData.token_type || 'Bearer');
    console.log('  • Expires In:', tokenData.expires_in, 'seconds');
    console.log('  • Scope:', tokenData.scope);
    console.log('  • Has Access Token:', !!tokenData.access_token);
    console.log('  • Token Preview:', tokenData.access_token ? tokenData.access_token.substring(0, 20) + '...' : 'N/A');
    console.groupEnd();

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      method: method
    });

  } catch (error) {
    console.error('OAuth API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
