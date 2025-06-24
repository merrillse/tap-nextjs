import { EnvironmentConfig } from './environments';
import { getSelectedProxyClient } from './proxy-client';
import { getCachedToken, setCachedToken, removeCachedToken } from './token-cache';

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  scope: string;
}

export interface GraphQLResponse {
  data?: unknown;
  errors?: Array<{ message: string; [key: string]: unknown }>;
  // The following are added by our proxy/client, not from the GraphQL server directly
  status?: number; 
  responseHeaders?: Record<string, string>;
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
    // First, try to get a cached token
    const cachedToken = getCachedToken(this.config, this.environmentKey);
    if (cachedToken) {
      this.token = cachedToken;
      return cachedToken.access_token;
    }

    // Check if we have a valid token in instance
    if (this.token && Date.now() < this.token.expires_at) {
      return this.token.access_token;
    }

    console.log(`🔄 Requesting new access token for ${this.environmentKey}...`);

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
        // Remove any cached token on failure
        removeCachedToken(this.config, this.environmentKey);
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

    // Cache the token for reuse across pages/environments
    setCachedToken(this.config, this.environmentKey, this.token);

    return this.token.access_token;
  }

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

    // Cache the token for reuse across pages/environments
    setCachedToken(this.config, this.environmentKey, this.token);

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

    // Cache the token for reuse across pages/environments
    setCachedToken(this.config, this.environmentKey, this.token);

    return this.token.access_token;
  }

  async executeGraphQLQuery(
    query: string, 
    variables: Record<string, unknown> = {},
    customHeaders: Record<string, string> = {},
    proxyClient?: string
  ): Promise<GraphQLResponse> {
    const accessToken = await this.getAccessToken();
    const requestBody = JSON.stringify({ query, variables });
    const selectedProxyClient = proxyClient || getSelectedProxyClient();

    // Enhanced debugging information
    console.group('🚀 GraphQL Request Debug Info');
    console.log('📋 Request Details:');
    console.log('  • Environment:', this.environmentKey || 'mis-gql-stage');
    console.log('  • Target URL:', this.config.graph_url);
    console.log('  • Primary Client ID:', this.config.client_id);
    console.log('  • Proxy Client ID:', selectedProxyClient);
    console.log('  • OAuth Token URL:', this.config.access_token_url);
    console.log('  • Request Timestamp:', new Date().toISOString());
    console.log('  • Request Body Size:', requestBody.length, 'bytes');
    console.log('  • Query Preview:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));
    
    if (Object.keys(variables).length > 0) {
      console.log('  • Variables:', JSON.stringify(variables, null, 2));
    }
    
    if (Object.keys(customHeaders).length > 0) {
      console.log('  • Custom Headers:', customHeaders);
    }
    
    console.log('🔐 Authentication Info:');
    console.log('  • Token Type:', this.token?.token_type || 'Unknown');
    console.log('  • Token Scope:', this.token?.scope || 'Unknown');
    if (this.token) {
      const expiresIn = Math.round((this.token.expires_at - Date.now()) / 1000 / 60);
      console.log('  • Token Expires In:', expiresIn, 'minutes');
    }
    console.groupEnd();

    const proxyHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'proxy-client': selectedProxyClient,
      'x-selected-environment': this.environmentKey || 'mis-gql-stage',
      'x-debug-client-id': this.config.client_id,
      'x-debug-target-url': this.config.graph_url,
      ...customHeaders, // Spread custom headers here
    };

    console.log('📤 Proxy Request Headers:', proxyHeaders);

    const response = await fetch('/api/graphql/proxy', {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({
        query,
        variables,
        access_token: accessToken,
        // customHeaders are now part of the fetch headers, not body to proxy
      }),
    });

    const responseText = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    console.group('📥 GraphQL Response Debug Info');
    console.log('📊 Response Details:');
    console.log('  • Status:', response.status, response.statusText);
    console.log('  • Content Type:', response.headers.get('content-type'));
    console.log('  • Response Size:', (responseText.length / 1024).toFixed(1), 'KB');
    console.log('  • Response Preview:', responseText.substring(0, 300) + (responseText.length > 300 ? '...' : ''));
    
    if (responseHeaders['x-environment']) {
      console.log('  • Server Environment:', responseHeaders['x-environment']);
    }
    if (responseHeaders['x-client-used']) {
      console.log('  • Server Used Client:', responseHeaders['x-client-used']);
    }
    console.groupEnd();

    let gqlResponse: GraphQLResponse = {
      status: response.status,
      responseHeaders: responseHeaders,
    };

    if (!response.ok) {
      console.error('GraphQL proxy request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errors) {
          gqlResponse.errors = errorData.errors;
        } else if (errorData.error) {
          gqlResponse.errors = [{ message: `GraphQL proxy error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}` }];
        } else {
          gqlResponse.errors = [{ message: `GraphQL proxy request failed with status ${response.status}: ${responseText}` }];
        }
      } catch (e) {
        gqlResponse.errors = [{ message: `GraphQL proxy request failed with status ${response.status} and non-JSON response: ${responseText}` }];
      }
      // Do not throw here, return the gqlResponse with error details
      return gqlResponse;
    }

    try {
      const parsedData = JSON.parse(responseText);
      gqlResponse.data = parsedData.data;
      if (parsedData.errors) {
        gqlResponse.errors = parsedData.errors;
      }
    } catch (error) {
      console.error('Error parsing GraphQL JSON response:', error);
      gqlResponse.errors = [{ message: `Failed to parse GraphQL JSON response: ${error instanceof Error ? error.message : String(error)}` }];
    }
    
    return gqlResponse;
  }

  getCurrentToken(): AuthToken | null {
    return this.token;
  }

  getEnvironmentKey(): string {
    return this.environmentKey;
  }

  /**
   * Force token refresh on next request
   */
  invalidateToken(): void {
    this.token = null;
    removeCachedToken(this.config, this.environmentKey);
  }

  /**
   * Check if there's a valid cached token available
   */
  hasCachedToken(): boolean {
    const cached = getCachedToken(this.config, this.environmentKey);
    return cached !== null;
  }
}
