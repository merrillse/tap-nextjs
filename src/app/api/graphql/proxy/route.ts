import { NextRequest, NextResponse } from 'next/server';
import { getEnvironmentConfig } from '@/lib/environments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables = {}, access_token } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    if (!access_token) {
      return NextResponse.json(
        { error: 'Missing access_token parameter' },
        { status: 401 }
      );
    }

    // Get debugging information from request headers
    const proxyClient = request.headers.get('proxy-client') || 'primary';
    const selectedEnv = request.headers.get('x-selected-environment') || 'mis-gql-stage';
    const debugClientId = request.headers.get('x-debug-client-id') || 'unknown';
    const debugTargetUrl = request.headers.get('x-debug-target-url') || 'unknown';

    // Get current environment configuration
    const environment = getEnvironmentConfig(selectedEnv);
    
    if (!environment) {
      return NextResponse.json({ error: 'Invalid environment selected' }, { status: 400 });
    }

    // Prepare GraphQL request
    const requestBody = JSON.stringify({ 
      query,
      ...(Object.keys(variables).length > 0 && { variables })
    });
    
    // Enhanced server-side debugging
    console.group('🌐 Server-Side GraphQL Proxy Debug');
    console.log('🔍 Request Analysis:');
    console.log('  • Target URL:', environment.graph_url);
    console.log('  • Environment:', selectedEnv);
    console.log('  • Primary Client ID:', debugClientId);
    console.log('  • Proxy Client ID:', proxyClient);
    console.log('  • Request Timestamp:', new Date().toISOString());
    console.log('  • Request Body Size:', requestBody.length, 'bytes');
    console.log('  • Query Preview:', query.substring(0, 150) + (query.length > 150 ? '...' : ''));
    console.log('  • Token Preview:', access_token.substring(0, 30) + '...');
    
    if (Object.keys(variables).length > 0) {
      console.log('  • Variables:', JSON.stringify(variables, null, 2));
    }
    console.groupEnd();
    
    // Make the GraphQL request
    const graphqlResponse = await fetch(environment.graph_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'Accept': '*/*',
        'User-Agent': 'TAP-NextJS/1.0 (graphql-proxy)',
        'Cache-Control': 'no-cache',
        'proxy-client': proxyClient,
      },
      body: requestBody,
    });

    const responseText = await graphqlResponse.text();
    
    // Log response in expected format
    console.log('GraphQL Response:');
    console.log('< HTTP/2', graphqlResponse.status);
    console.log('< date:', graphqlResponse.headers.get('date'));
    console.log('< content-type:', graphqlResponse.headers.get('content-type'));
    console.log('< vary:', graphqlResponse.headers.get('vary'));
    console.log('< x-content-type-options:', graphqlResponse.headers.get('x-content-type-options'));
    console.log('< x-xss-protection:', graphqlResponse.headers.get('x-xss-protection'));
    console.log('< cache-control:', graphqlResponse.headers.get('cache-control'));
    console.log('< pragma:', graphqlResponse.headers.get('pragma'));
    console.log('< expires:', graphqlResponse.headers.get('expires'));
    console.log('< x-frame-options:', graphqlResponse.headers.get('x-frame-options'));
    console.log('* Received', (responseText.length / 1024).toFixed(1), 'KB chunk');
    
    if (!graphqlResponse.ok) {
      console.error('GraphQL request failed:', {
        status: graphqlResponse.status,
        statusText: graphqlResponse.statusText,
        body: responseText
      });
      
      return NextResponse.json(
        { 
          error: `GraphQL request failed: ${graphqlResponse.status} ${graphqlResponse.statusText}`,
          details: responseText,
          headers: Object.fromEntries(graphqlResponse.headers.entries())
        },
        { status: graphqlResponse.status }
      );
    }

    let graphqlData;
    try {
      graphqlData = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response from GraphQL', details: responseText },
        { 
          status: 500,
          headers: {
            'x-environment': selectedEnv,
            'x-proxy-client': proxyClient,
            'x-primary-client': debugClientId,
            'x-target-url': environment.graph_url,
            'x-debug-timestamp': new Date().toISOString()
          }
        }
      );
    }

    console.group('✅ Server Proxy Success');
    console.log('📈 Response Analysis:');
    console.log('  • Response Status:', graphqlResponse.status);
    console.log('  • Response Size:', (responseText.length / 1024).toFixed(1), 'KB');
    console.log('  • Has Data:', !!graphqlData.data);
    console.log('  • Has Errors:', !!graphqlData.errors);
    if (graphqlData.errors) {
      console.log('  • Error Count:', graphqlData.errors.length);
    }
    console.groupEnd();

    // Return the GraphQL response with debug headers
    return NextResponse.json(graphqlData, {
      headers: {
        'x-environment': selectedEnv,
        'x-proxy-client': proxyClient,
        'x-primary-client': debugClientId,
        'x-target-url': environment.graph_url,
        'x-debug-timestamp': new Date().toISOString(),
        'x-response-size': (responseText.length / 1024).toFixed(1) + 'KB'
      }
    });

  } catch (error) {
    console.error('GraphQL proxy API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
