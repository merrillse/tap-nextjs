import { EnvironmentConfig } from './environments';
import { getSelectedProxyClient } from './proxy-client';

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  scope: string;
}

export class ApiClient {
  private config: EnvironmentConfig;
  private environmentKey: string;
  private token: AuthToken | null = null;

  constructor(config: EnvironmentConfig, environmentKey: string = '') {
    this.config = config;
    this.environmentKey = environmentKey;
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && Date.now() < this.token.expires_at) {
      return this.token.access_token;
    }

    // Use server-side OAuth route to avoid CORS issues
    try {
      const token = await this.requestTokenViaAPI('basic');
      return token;
    } catch (error) {
      console.warn('Basic Auth via API failed, trying form method:', error);
      
      // Fallback to form-encoded credentials
      try {
        const token = await this.requestTokenViaAPI('form');
        return token;
      } catch (fallbackError) {
        console.error('Both auth methods failed via API:', fallbackError);
        throw fallbackError;
      }
    }
  }

  private async requestTokenViaAPI(method: 'basic' | 'form'): Promise<string> {
    const response = await fetch('/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token_url: this.config.access_token_url,
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        scope: this.config.scope,
        method: method,
        environment: this.environmentKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`${method} Auth failed: ${errorData.error} - ${errorData.details || ''}`);
    }

    const tokenData = await response.json();
    
    this.token = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000) - 60000, // 1 minute buffer
      scope: tokenData.scope,
    };

    return this.token.access_token;
  }

  // Direct methods for debugging - may fail due to CORS
  /** @deprecated Use server-side API route instead */
  async requestTokenWithBasicAuth(): Promise<string> {
    const credentials = btoa(`${this.config.client_id}:${this.config.client_secret}`);
    
    const tokenResponse = await fetch(this.config.access_token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: this.config.scope,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Basic Auth failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    this.token = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000) - 60000, // 1 minute buffer
      scope: tokenData.scope,
    };

    return this.token.access_token;
  }

  /** @deprecated Use server-side API route instead */
  async requestTokenWithFormAuth(): Promise<string> {
    const tokenResponse = await fetch(this.config.access_token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        scope: this.config.scope,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Form Auth failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    this.token = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000) - 60000, // 1 minute buffer
      scope: tokenData.scope,
    };

    return this.token.access_token;
  }

  async executeGraphQLQuery(query: string, variables: Record<string, unknown> = {}): Promise<{
    data?: unknown;
    errors?: Array<{ message: string; [key: string]: unknown }>;
  }> {
    // Get OAuth token via our server-side proxy
    const accessToken = await this.getAccessToken();
    const requestBody = JSON.stringify({ query, variables });

    console.log('* Preparing GraphQL request via server-side proxy');
    console.log('* Current time is', new Date().toISOString());
    console.log('* Request body size:', requestBody.length, 'bytes');

    // Make GraphQL request via our server-side proxy to avoid CORS
    const response = await fetch('/api/graphql/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'proxy-client': getSelectedProxyClient(),
        'x-selected-environment': this.environmentKey || 'mis-gql-stage',
      },
      body: JSON.stringify({
        query,
        variables,
        access_token: accessToken
      }),
    });

    const responseText = await response.text();

    // Log response details
    console.log('GraphQL Proxy Response:');
    console.log('< HTTP/1.1', response.status);
    console.log('< content-type:', response.headers.get('content-type'));
    console.log('* Received', (responseText.length / 1024).toFixed(1), 'KB chunk via proxy');
    
    // Log the raw response for debugging
    console.log('GraphQL Proxy Raw Response:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('GraphQL proxy request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      // Try to parse error response if it's JSON
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            throw new Error(`GraphQL proxy error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`);
          }
        } catch (parseError) {
          // Response isn't JSON, use the raw text
        }
      }
      
      // Provide specific error messages for common HTTP status codes
      if (response.status === 401) {
        throw new Error(`Authentication failed: The access token is invalid or expired. Please check your credentials.`);
      } else if (response.status === 403) {
        throw new Error(`Access forbidden: You don't have permission to access this resource.`);
      } else if (response.status === 500) {
        throw new Error(`Server error: The GraphQL server encountered an internal error.`);
      }
      
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText || 'Unknown error'}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse GraphQL proxy response:', responseText);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    console.log('GraphQL Proxy Parsed Response:', data);
    
    // Handle different response formats
    if (data.success && data.data) {
      // Wrapped success response format
      const graphqlResult = data.data;
      if (graphqlResult.errors) {
        console.warn('GraphQL returned errors:', graphqlResult.errors);
      }
      return graphqlResult;
    } else if (data.data || data.errors) {
      // Direct GraphQL response format
      if (data.errors) {
        console.warn('GraphQL returned errors:', data.errors);
        // If there are errors but no data, throw an error with details
        if (!data.data) {
          const errorMessages = data.errors.map((err: any) => err.message || err.toString()).join(', ');
          throw new Error(`GraphQL errors: ${errorMessages}`);
        }
      }
      return data;
    } else if (data.error) {
      // Error response format
      console.error('GraphQL proxy error response:', data);
      throw new Error(`GraphQL proxy error: ${data.error}${data.details ? ` - ${data.details}` : ''}`);
    } else {
      // Unknown response format
      console.error('Unknown GraphQL response format:', data);
      throw new Error(`Unknown GraphQL response format: ${JSON.stringify(data)}`);
    }
  }

  async checkHealth(): Promise<{
    status: string;
    error?: string;
    [key: string]: unknown;
  }> {
    try {
      const response = await fetch('/api/health/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_url: this.config.health_url
        }),
      });

      const healthData = await response.json();

      if (response.ok && healthData.success) {
        return {
          status: 'UP',
          ...healthData.data
        };
      } else {
        return {
          status: 'DOWN',
          error: healthData.error || `HTTP ${healthData.status}: ${healthData.statusText}`
        };
      }
    } catch (error) {
      return {
        status: 'DOWN',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getConfig(): EnvironmentConfig {
    return this.config;
  }

  getCurrentToken(): AuthToken | null {
    return this.token;
  }

  // Public method for testing token acquisition
  async testTokenAcquisition(): Promise<string> {
    return this.getAccessToken();
  }
}
