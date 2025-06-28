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

    // Enhanced OAuth debugging
    console.group('🔐 OAuth Token Request Debug');
    console.log('🎯 OAuth Request Details:');
    console.log('  • Token URL:', access_token_url);
    console.log('  • Client ID:', client_id);
    console.log('  • Environment:', environment || 'default');
    console.log('  • Scope:', scope);
    console.log('  • Method:', method);
    console.log('  • Timestamp:', new Date().toISOString());

    // Use environment variable for client secret based on environment
    let actualClientSecret = client_secret;
    
    if (client_id === '0oa82h6j45rN8G1he5d7') {
      // Environment-specific client secret mapping
      const environmentSecretMap: Record<string, string | undefined> = {
        'mis-gql-local': process.env.MIS_GQL_LOCAL_CLIENT_SECRET,
        'mis-gql-dev': process.env.MIS_GQL_DEV_CLIENT_SECRET,
        'mis-gql-stage': process.env.MIS_GQL_STAGE_CLIENT_SECRET,
        'mis-gql-prod': process.env.MIS_GQL_PROD_CLIENT_SECRET,
        'mogs-gql-local': process.env.MOGS_LOCAL_CLIENT_SECRET,
        'mogs-gql-dev': process.env.MOGS_DEV_CLIENT_SECRET,
        'mogs-gql-prod': process.env.MOGS_PROD_CLIENT_SECRET,
      };

      actualClientSecret = environmentSecretMap[environment];
      
      if (actualClientSecret) {
        console.log(`  • Using ${environment.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET for ${environment} environment`);
      } else {
        const supportedEnvs = Object.keys(environmentSecretMap).join(', ');
        console.error('  ❌ Unsupported environment or missing secret:', environment);
        return NextResponse.json(
          { 
            error: 'Unsupported environment or missing client secret', 
            details: `Environment '${environment}' is not supported or client secret not configured. Supported environments: ${supportedEnvs}` 
          },
          { status: 400 }
        );
      }
    } else {
      console.error('  ❌ Unsupported client ID:', client_id);
      return NextResponse.json(
        { error: 'Unsupported client ID', details: `Only client ID '0oa82h6j45rN8G1he5d7' is supported. Received: ${client_id}` },
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
      console.error('  • Client ID:', client_id);
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
