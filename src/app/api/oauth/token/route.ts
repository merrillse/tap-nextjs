import { NextRequest, NextResponse } from 'next/server';

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

    // Use environment variable for known client configurations
    let actualClientSecret = client_secret;
    if (client_id === '0oak0jqakvevwjWrp357') {
      // MIS GraphQL staging and production environments
      if (environment === 'mis-gql-stage') {
        actualClientSecret = process.env.MIS_GQL_STAGE_CLIENT_SECRET;
        if (!actualClientSecret) {
          return NextResponse.json(
            { error: 'Missing required parameters', details: 'MIS GraphQL staging client secret not configured in environment variables' },
            { status: 400 }
          );
        }
      } else if (environment === 'mis-gql-prod') {
        actualClientSecret = process.env.MIS_GQL_PROD_CLIENT_SECRET;
        if (!actualClientSecret) {
          return NextResponse.json(
            { error: 'Missing required parameters', details: 'MIS GraphQL production client secret not configured in environment variables' },
            { status: 400 }
          );
        }
      } else {
        // Default to staging for backward compatibility
        actualClientSecret = process.env.MIS_GQL_STAGE_CLIENT_SECRET;
        if (!actualClientSecret) {
          return NextResponse.json(
            { error: 'Missing required parameters', details: 'MIS GraphQL staging client secret not configured in environment variables (default)' },
            { status: 400 }
          );
        }
      }
    } else if (client_id === '0oa5uce4xpm2l7K8G5d7') {
      // MIS GraphQL development environment
      actualClientSecret = process.env.MIS_GQL_DEV_CLIENT_SECRET;
      if (!actualClientSecret) {
        return NextResponse.json(
          { error: 'Missing required parameters', details: 'MIS GraphQL development client secret not configured in environment variables' },
          { status: 400 }
        );
      }
    } else if (!actualClientSecret) {
      return NextResponse.json(
        { error: 'Missing required parameters', details: 'Client secret required for unknown client configurations' },
        { status: 400 }
      );
    }

    let tokenResponse: Response;

    if (method === 'basic') {
      // Basic Auth method - Church of Jesus Christ standard
      const credentials = Buffer.from(`${client_id}:${actualClientSecret}`).toString('base64');
      
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
          client_id: client_id,
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
          client_id: client_id,
          client_secret: actualClientSecret,
          scope: scope,
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        }),
      });
    }

    const responseText = await tokenResponse.text();
    
    // Log detailed information for debugging
    console.log('OAuth Request Details:', {
      url: access_token_url,
      method: method,
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      bodyLength: responseText.length
    });
    
    if (!tokenResponse.ok) {
      console.error('OAuth token request failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: responseText,
        method: method,
        url: access_token_url
      });
      
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
      return NextResponse.json(
        { error: 'Invalid JSON response', details: responseText },
        { status: 500 }
      );
    }

    // Log successful token acquisition (without sensitive data)
    console.log('OAuth Token acquired successfully:', {
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      has_access_token: !!tokenData.access_token
    });

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
