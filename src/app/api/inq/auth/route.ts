import { NextRequest, NextResponse } from 'next/server';
import { getEnvironmentConfigWithClient } from '@/lib/environments';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function POST(request: NextRequest) {
  try {
    const { environment, clientId } = await request.json();
    
    if (!environment) {
      return NextResponse.json({ error: 'Environment parameter is required' }, { status: 400 });
    }

    // Get environment-specific configuration, using clientId if provided
    const envConfig = getEnvironmentConfigWithClient(environment, clientId);
    if (!envConfig) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    // Get client secret from environment variables
    const clientSecret = process.env[`INQ_CLIENT_SECRET_${environment.toUpperCase()}`];
    if (!clientSecret) {
      return NextResponse.json({ 
        error: 'Client secret not configured',
        envVar: `INQ_CLIENT_SECRET_${environment.toUpperCase()}`
      }, { status: 400 });
    }

    // OAuth2 configuration
    const tokenUrl = 'https://login.microsoftonline.com/61e6eeb3-5fd7-4aaa-ae3c-61e8deb09b79/oauth2/v2.0/token';
    
    // Prepare OAuth2 request
    const authHeader = Buffer.from(`${envConfig.client_id}:${clientSecret}`).toString('base64');
    const formData = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: envConfig.scope
    });

    // Request access token
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return NextResponse.json({ 
        error: 'Failed to obtain access token',
        details: errorData,
        status: tokenResponse.status
      }, { status: 401 });
    }

    const tokenData: TokenResponse = await tokenResponse.json();
    
    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    });

  } catch (error) {
    console.error('OAuth2 token error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
