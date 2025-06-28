import { NextRequest, NextResponse } from 'next/server';

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
    const { environment, query, accessToken }: QueryParams = await request.json();
    
    if (!environment || !query) {
      return NextResponse.json({ 
        error: 'Environment and query parameters are required' 
      }, { status: 400 });
    }

    // Get environment configuration
    const envConfig = getEnvironmentConfig(environment);
    if (!envConfig) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    let token = accessToken;
    
    // If no token provided, get one automatically
    if (!token) {
      const tokenResponse = await fetch(`${request.nextUrl.origin}/api/inq/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
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
    const apiUrl = `${envConfig.baseUrl}/${query}`;
    
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
