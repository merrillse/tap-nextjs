export interface EnvironmentConfig {
  name: string;
  base_url: string;
  graph_url: string;
  health_url: string;
  scheme: string;
  domain: string;
  path: string;
  access_token_url: string;
  client_id: string;
  client_secret: string;
  scope: string;
}

// Function to get environment config with dynamic client ID
export function getEnvironmentConfigWithClient(envKey: string, clientId?: string): EnvironmentConfig | null {
  const baseConfig = ENVIRONMENTS[envKey];
  if (!baseConfig) return null;

  // If no custom client ID provided, return the original config
  if (!clientId) return baseConfig;

  // Return config with overridden client_id
  return {
    ...baseConfig,
    client_id: clientId
  };
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  // MIS (MGQL) Environments - 4 lanes: local, dev, stage, prod
  'mis-gql-local': {
    name: 'MIS GraphQL Local',
    scheme: 'http',
    domain: 'localhost:8080',
    path: 'graphql',
    base_url: 'http://localhost:8080',
    graph_url: 'http://localhost:8080/graphql',
    health_url: 'http://localhost:8080/actuator/health',
    access_token_url: 'https://dev-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MIS_GQL_LOCAL_CLIENT_SECRET
    scope: 'mis:mgql.nonProd'
  },
  'mis-gql-dev': {
    name: 'MIS GraphQL Development',
    scheme: 'https',
    domain: 'mis-gql-dev.aws.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mis-gql-dev.aws.churchofjesuschrist.org',
    graph_url: 'https://mis-gql-dev.aws.churchofjesuschrist.org/graphql',
    health_url: 'https://mis-gql-dev.aws.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://dev-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MIS_GQL_DEV_CLIENT_SECRET
    scope: 'mis:mgql.nonProd'
  },
  'mis-gql-stage': {
    name: 'MIS GraphQL Staging',
    scheme: 'https',
    domain: 'mis-gql-stage.aws.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mis-gql-stage.aws.churchofjesuschrist.org',
    graph_url: 'https://mis-gql-stage.aws.churchofjesuschrist.org/graphql',
    health_url: 'https://mis-gql-stage.aws.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://stage-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MIS_GQL_STAGE_CLIENT_SECRET
    scope: 'mis:mgql.nonProd'
  },
  'mis-gql-prod': {
    name: 'MIS GraphQL Production',
    scheme: 'https',
    domain: 'mis-gql.aws.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mis-gql.aws.churchofjesuschrist.org',
    graph_url: 'https://mis-gql.aws.churchofjesuschrist.org/graphql',
    health_url: 'https://mis-gql.aws.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://prod-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MIS_GQL_PROD_CLIENT_SECRET
    scope: 'mis:mgql.prod'
  },
  
  // MOGS Environments - 3 lanes: local, dev, prod
  'mogs-gql-local': {
    name: 'MOGS GraphQL Local',
    scheme: 'http',
    domain: 'localhost:8081',
    path: 'graphql',
    base_url: 'http://localhost:8081',
    graph_url: 'http://localhost:8081/graphql',
    health_url: 'http://localhost:8081/actuator/health',
    access_token_url: 'https://dev-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MOGS_LOCAL_CLIENT_SECRET
    scope: 'client_token'
  },
  'mogs-gql-dev': {
    name: 'MOGS GraphQL Development',
    scheme: 'https',
    domain: 'mms-gql-service-dev.pvu.cf.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mms-gql-service-dev.pvu.cf.churchofjesuschrist.org',
    graph_url: 'https://mms-gql-service-dev.pvu.cf.churchofjesuschrist.org/graphql',
    health_url: 'https://mms-gql-service-dev.pvu.cf.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://dev-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MOGS_DEV_CLIENT_SECRET
    scope: 'client_token'
  },
  'mogs-gql-prod': {
    name: 'MOGS GraphQL Production',
    scheme: 'https',
    domain: 'mms-gql-service-prod.pvu.cf.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mms-gql-service-prod.pvu.cf.churchofjesuschrist.org',
    graph_url: 'https://mms-gql-service-prod.pvu.cf.churchofjesuschrist.org/graphql',
    health_url: 'https://mms-gql-service-prod.pvu.cf.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://prod-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa82h6j45rN8G1he5d7',
    client_secret: '', // Managed server-side via MOGS_PROD_CLIENT_SECRET
    scope: 'client_token'
  }
};

export const getEnvironmentConfig = (envKey: string): EnvironmentConfig | null => {
  return ENVIRONMENTS[envKey] || null;
};

export const getEnvironmentKeys = (): string[] => {
  return Object.keys(ENVIRONMENTS);
};

export const getEnvironmentNames = (): Array<{key: string, name: string}> => {
  return Object.entries(ENVIRONMENTS).map(([key, config]) => ({
    key,
    name: config.name
  }));
};

/**
 * Get default environment based on service type
 */
export const getDefaultEnvironment = (serviceType: 'mis' | 'mogs' = 'mis'): string => {
  return serviceType === 'mogs' ? 'mogs-gql-dev' : 'mis-gql-dev';
};

/**
 * Get environment configuration with fallback
 */
export const getEnvironmentConfigSafe = (envKey: string, fallbackServiceType: 'mis' | 'mogs' = 'mis'): { config: EnvironmentConfig; key: string } => {
  let config = ENVIRONMENTS[envKey];
  let actualKey = envKey;
  
  if (!config) {
    console.warn(`Environment '${envKey}' not found, falling back to default`);
    actualKey = getDefaultEnvironment(fallbackServiceType);
    config = ENVIRONMENTS[actualKey];
  }
  
  if (!config) {
    throw new Error(`No valid environment configuration found. Available environments: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  }
  
  return { config, key: actualKey };
};

/**
 * Get saved environment from localStorage with fallback
 */
export const getSavedEnvironment = (fallbackServiceType: 'mis' | 'mogs' = 'mis'): string => {
  const saved = localStorage.getItem('selectedEnvironment');
  if (saved && ENVIRONMENTS[saved]) {
    return saved;
  }
  return getDefaultEnvironment(fallbackServiceType);
};

/**
 * Get all environment keys for a specific service type
 */
export const getEnvironmentKeysByService = (serviceType: 'mis' | 'mogs'): string[] => {
  const prefix = serviceType === 'mogs' ? 'mogs-gql-' : 'mis-gql-';
  return Object.keys(ENVIRONMENTS).filter(key => key.startsWith(prefix));
};
