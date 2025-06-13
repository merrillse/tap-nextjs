import { NextRequest, NextResponse } from 'next/server';

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

    // Prepare GraphQL request
    const requestBody = JSON.stringify({ 
      query,
      ...(Object.keys(variables).length > 0 && { variables })
    });
    
    console.log('* Preparing request to https://mis-gql-stage.aws.churchofjesuschrist.org/graphql');
    console.log('* Current time is', new Date().toISOString());
    console.log('* Using Bearer token:', access_token.substring(0, 50) + '...');
    console.log('* Request body size:', requestBody.length, 'bytes');
    
    // Make the GraphQL request
    const graphqlResponse = await fetch('https://mis-gql-stage.aws.churchofjesuschrist.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'Accept': '*/*',
        'User-Agent': 'TAP-NextJS/1.0 (graphql-proxy)',
        'Cache-Control': 'no-cache',
        'proxy-client': 'primary',
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
        { status: 500 }
      );
    }

    // Return the GraphQL response directly (including any errors)
    return NextResponse.json(graphqlData);

  } catch (error) {
    console.error('GraphQL proxy API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
