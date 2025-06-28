import { NextRequest, NextResponse } from 'next/server';

interface PaginationParams {
  environment: string;
  pageSize: number;
  currentPage: number;
  filter?: string;
  select?: string;
  orderBy?: string;
  accessToken?: string;
  skipToken?: string; // For Dataverse cookie-based pagination
}

interface PaginationResponse {
  success: boolean;
  environment: string;
  currentPage: number;
  pageSize: number;
  totalPages?: number; // May not be available with skiptoken pagination
  totalRecords?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: any;
  queryUrl: string;
  nextPageUrl?: string;
  previousPageUrl?: string;
  nextSkipToken?: string; // For next page navigation
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      environment, 
      pageSize = 25, 
      currentPage = 1, 
      filter, 
      select, 
      orderBy = 'inq_name',
      accessToken,
      skipToken
    }: PaginationParams = await request.json();
    
    if (!environment) {
      return NextResponse.json({ 
        error: 'Environment parameter is required' 
      }, { status: 400 });
    }

    // Get environment configuration
    const envConfig = getEnvironmentConfig(environment);
    if (!envConfig) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    let token = accessToken;
    
    // Get access token if not provided
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

    // Build OData query with Dataverse pagination
    // Note: Dataverse doesn't support $skip, uses $skiptoken instead
    let queryParts = [`$top=${pageSize}`];
    
    // Add skiptoken for pagination (Dataverse cookie-based pagination)
    if (skipToken) {
      queryParts.push(`$skiptoken=${encodeURIComponent(skipToken)}`);
    }
    
    if (orderBy) {
      queryParts.push(`$orderby=${orderBy}`);
    }
    
    if (select) {
      queryParts.push(`$select=${select}`);
    }
    
    if (filter) {
      queryParts.push(`$filter=${encodeURIComponent(filter)}`);
    }
    
    // Add count for total records (when not using skiptoken)
    if (!skipToken) {
      queryParts.push('$count=true');
    }
    
    const query = `inq_missionaries?${queryParts.join('&')}`;
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
        error: 'OData pagination query failed',
        status: response.status,
        statusText: response.statusText,
        details: errorData,
        query: apiUrl
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract pagination information from Dataverse response
    const totalRecords = data["@odata.count"] || undefined;
    const nextLink = data["@odata.nextLink"];
    const hasNextPage = !!nextLink;
    const hasPreviousPage = currentPage > 1;
    
    // Extract skiptoken from nextLink if available
    let nextSkipToken: string | undefined = undefined;
    if (nextLink) {
      const url = new URL(nextLink);
      const token = url.searchParams.get('$skiptoken');
      nextSkipToken = token || undefined;
    }
    
    // For Dataverse, we can't reliably calculate total pages with skiptoken
    // So we'll estimate or leave undefined
    const totalPages = totalRecords ? Math.ceil(totalRecords / pageSize) : undefined;
    
    const paginationResponse: PaginationResponse = {
      success: true,
      environment,
      currentPage,
      pageSize,
      totalPages,
      totalRecords,
      hasNextPage,
      hasPreviousPage,
      data,
      queryUrl: apiUrl,
      nextPageUrl: nextLink,
      nextSkipToken,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(paginationResponse);

  } catch (error) {
    console.error('Pagination query error:', error);
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
