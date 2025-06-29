import { NextRequest, NextResponse } from 'next/server';
import { getEnvironmentConfigWithClient } from '@/lib/environments';

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
      skipToken,
      clientId
    }: PaginationParams & { clientId?: string } = await request.json();
    
    if (!environment) {
      return NextResponse.json({ 
        error: 'Environment parameter is required' 
      }, { status: 400 });
    }

    // Get environment configuration, using clientId if provided
    const envConfig = getEnvironmentConfigWithClient(environment, clientId);
    if (!envConfig) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    let token = accessToken;
    
    // Get access token if not provided
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

    // Build OData query with Dataverse pagination
    // Since Dataverse doesn't support $skip, we'll use cursor-based pagination
    let queryParts = [`$top=${pageSize}`];
    
    // Handle cursor-based pagination using skiptoken
    if (skipToken && skipToken.startsWith('cursor_')) {
      // Extract the cursor value (last record's sort field value)
      const cursorValue = skipToken.replace('cursor_', '');
      // Add filter to get records after this cursor
      const cursorFilter = `${orderBy.replace(' desc', '')} gt '${cursorValue}'`;
      queryParts.push(`$filter=${encodeURIComponent(cursorFilter)}`);
    } else if (skipToken && skipToken.startsWith('skip_')) {
      // This is our synthetic skip token - extract the skip value
      const skipValue = parseInt(skipToken.replace('skip_', ''));
      // We can't use $skip in Dataverse, so we'll need an alternative approach
      // For now, we'll use the cursor approach
    }
    
    if (orderBy) {
      queryParts.push(`$orderby=${orderBy}`);
    }
    
    if (select) {
      queryParts.push(`$select=${select}`);
    }
    
    if (filter) {
      // If we have both a filter and a cursor filter, combine them
      const existingFilter = queryParts.find(part => part.startsWith('$filter='));
      if (existingFilter) {
        const existingFilterValue = decodeURIComponent(existingFilter.split('=')[1]);
        const combinedFilter = `(${filter}) and (${existingFilterValue})`;
        queryParts = queryParts.filter(part => !part.startsWith('$filter='));
        queryParts.push(`$filter=${encodeURIComponent(combinedFilter)}`);
      } else {
        queryParts.push(`$filter=${encodeURIComponent(filter)}`);
      }
    }
    
    // Add count for total records (only on first page)
    if (!skipToken) {
      queryParts.push('$count=true');
    }
    
    const query = `inq_missionaries?${queryParts.join('&')}`;
    const apiUrl = `${envConfig.base_url}/${query}`;
    
    // Make the OData request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Prefer': `odata.include-annotations="*",odata.maxpagesize=${pageSize}`
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
    
    // Debug: Log the response structure
    console.log('OData Response Debug:', {
      totalCount: data["@odata.count"],
      hasNextLink: !!data["@odata.nextLink"],
      nextLink: data["@odata.nextLink"],
      valueLength: data.value?.length,
      pageSize: pageSize,
      currentPage: currentPage,
      skipToken: skipToken
    });
    
    // Extract pagination information from Dataverse response
    const totalRecords = data["@odata.count"] || undefined;
    const nextLink = data["@odata.nextLink"];
    
    // Calculate if there should be more pages based on math
    let hasNextPage = false;
    if (totalRecords && totalRecords > (currentPage * pageSize)) {
      // Math says there should be more pages
      hasNextPage = true;
    } else if (nextLink) {
      // OData API says there's a next link
      hasNextPage = true;
    } else if (data.value && data.value.length === pageSize) {
      // If we got exactly the requested page size, assume there might be more
      hasNextPage = true;
    }
    
    const hasPreviousPage = currentPage > 1;
    
    // Extract skiptoken from nextLink if available
    let nextSkipToken: string | undefined = undefined;
    if (nextLink) {
      const url = new URL(nextLink);
      const token = url.searchParams.get('$skiptoken');
      nextSkipToken = token || undefined;
    }
    
    // For Dataverse cursor-based pagination, create cursor from last record
    if (hasNextPage && !nextSkipToken && data.value && data.value.length > 0) {
      const lastRecord = data.value[data.value.length - 1];
      const sortField = orderBy.replace(' desc', '').replace(' asc', '');
      
      // Get the value of the sort field from the last record
      let cursorValue = lastRecord[sortField];
      if (cursorValue) {
        // Handle different data types
        if (typeof cursorValue === 'string') {
          cursorValue = cursorValue.replace(/'/g, "''"); // Escape single quotes
        }
        nextSkipToken = `cursor_${cursorValue}`;
      }
    }
    
    // For Dataverse, we can't reliably calculate total pages with skiptoken
    // But we can estimate on the first page when we have total count
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
