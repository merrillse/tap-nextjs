import { NextRequest, NextResponse } from 'next/server';
import { getEnvironmentConfigWithClient } from '@/lib/environments';

interface QueryParams {
  environment: string;
  query: string;
  accessToken?: string;
}

interface ODataResponse {
  "@odata.context": string;
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  value: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { environment, query, accessToken, clientId }: QueryParams & { clientId?: string } = await request.json();
    
    if (!environment || !query) {
      return NextResponse.json({ 
        error: 'Environment and query parameters are required' 
      }, { status: 400 });
    }

    // Get environment configuration, using clientId if provided
    const envConfig = getEnvironmentConfigWithClient(environment, clientId);
    if (!envConfig) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    let token = accessToken;
    
    // If no token provided, get one automatically
    if (!token) {
      const tokenResponse = await fetch(`${request.nextUrl.origin}/api/inq/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, clientId })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        return NextResponse.json({ 
          error: 'Failed to obtain access token',
          details: errorData
        }, { status: 401 });
      }

      const tokenData = await tokenResponse.json();
      token = tokenData.access_token;
    }

    // Build the full API URL
    const apiUrl = `${envConfig.base_url}/${query}`;
    
    // Make the OData request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Prefer': 'odata.include-annotations="*"'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return NextResponse.json({ 
        error: 'OData query failed',
        status: response.status,
        statusText: response.statusText,
        details: errorData,
        query: apiUrl
      }, { status: response.status });
    }

    const data: ODataResponse = await response.json();
    
    // Add metadata about the response
    const responseWithMeta = {
      success: true,
      environment,
      query,
      queryUrl: apiUrl,
      timestamp: new Date().toISOString(),
      recordCount: data.value?.length || 0,
      totalCount: data["@odata.count"],
      hasNextPage: !!data["@odata.nextLink"],
      nextLink: data["@odata.nextLink"],
      data: data
    };

    return NextResponse.json(responseWithMeta);

  } catch (error) {
    console.error('OData query error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
