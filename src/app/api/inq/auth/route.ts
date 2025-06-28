import { NextRequest, NextResponse } from 'next/server';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function POST(request: NextRequest) {
  try {
    const { environment } = await request.json();
    
    if (!environment) {
      return NextResponse.json({ error: 'Environment parameter is required' }, { status: 400 });
    }

    // Get environment-specific configuration
    const envConfig = getEnvironmentConfig(environment);
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
    const authHeader = Buffer.from(`${envConfig.clientId}:${clientSecret}`).toString('base64');
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

function getEnvironmentConfig(environment: string) {
  const configs = {
    DEV: {
      clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
      scope: 'https://inq-dev.crm.dynamics.com/.default',
      baseUrl: 'https://inq-dev.api.crm.dynamics.com/api/data/v9.2'
    },
    TEST: {
      clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
      scope: 'https://inq-test.crm.dynamics.com/.default',
      baseUrl: 'https://inq-test.api.crm.dynamics.com/api/data/v9.2'
    },
    STAGE: {
      clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
      scope: 'https://inq-stage.crm.dynamics.com/.default',
      baseUrl: 'https://inq-stage.api.crm.dynamics.com/api/data/v9.2'
    },
    PROD: {
      clientId: '5e6b7d0b-7247-429b-b8c1-d911d8f13d40',
      scope: 'https://inq.crm.dynamics.com/.default',
      baseUrl: 'https://inq.api.crm.dynamics.com/api/data/v9.2'
    }
  };
  
  return configs[environment as keyof typeof configs];
}
