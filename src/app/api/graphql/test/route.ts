import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { graphql_query, variables = {} } = body;

    // Get OAuth token first
    const baseUrl = `http://${request.headers.get('host')}`;
    const tokenResponse = await fetch(`${baseUrl}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token_url: 'https://id.churchofjesuschrist.org/oauth2/auskwf3oaqYZwid57357/v1/token',
        client_id: '0oak0jqakvevwjWrp357',
        client_secret: process.env.MIS_GQL_STAGE_CLIENT_SECRET || '',
        scope: 'client_token',
        method: 'basic'
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json();
      return NextResponse.json(
        { error: 'Failed to get OAuth token', details: tokenError },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Prepare GraphQL request with proper headers
    const query = graphql_query || 'query { __schema { queryType { name } } }';
    const requestBody = JSON.stringify({ 
      query,
      ...(Object.keys(variables).length > 0 && { variables })
    });
    
    console.log('* Preparing request to https://mis-gql-stage.aws.churchofjesuschrist.org/graphql');
    console.log('* Current time is', new Date().toISOString());
    console.log('* Using Bearer token:', accessToken.substring(0, 50) + '...');
    
    // Now make the GraphQL request
    const graphqlResponse = await fetch('https://mis-gql-stage.aws.churchofjesuschrist.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': '*/*',
        'User-Agent': 'TAP-NextJS/1.0 (graphql-test)',
        'Cache-Control': 'no-cache',
        'proxy-client': 'primary',
      },
      body: requestBody,
    });

    const responseText = await graphqlResponse.text();
    
    // Log response details in the expected format
    console.log('GraphQL Response Details:');
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
    
    console.log('Complete GraphQL Request Summary:', {
      url: 'https://mis-gql-stage.aws.churchofjesuschrist.org/graphql',
      method: 'POST',
      status: graphqlResponse.status,
      statusText: graphqlResponse.statusText,
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
        'Accept': '*/*',
        'User-Agent': 'TAP-NextJS/1.0 (graphql-test)',
        'Cache-Control': 'no-cache',
      },
      responseHeaders: Object.fromEntries(graphqlResponse.headers.entries()),
      bodyLength: responseText.length,
      querySize: requestBody.length
    });

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
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: graphqlData,
      token_info: {
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      }
    });

  } catch (error) {
    console.error('GraphQL test API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
