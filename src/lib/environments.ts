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

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  'mis-gql-dev': {
    name: 'MIS GraphQL Development',
    scheme: 'https',
    domain: 'mis-gql-dev.aws.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mis-gql-dev.aws.churchofjesuschrist.org',
    graph_url: 'https://mis-gql-dev.aws.churchofjesuschrist.org/graphql',
    health_url: 'https://mis-gql-dev.aws.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://dev-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa5uce4xpm2l7K8G5d7',
    client_secret: '', // Managed server-side via environment variables
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
    access_token_url: 'https://id.churchofjesuschrist.org/oauth2/auskwf3oaqYZwid57357/v1/token',
    client_id: '0oak0jqakvevwjWrp357',
    client_secret: '', // Managed server-side via environment variables
    scope: 'client_token'
  },
  'mis-gql-prod': {
    name: 'MIS GraphQL Production',
    scheme: 'https',
    domain: 'mis-gql-prod.aws.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mis-gql-prod.aws.churchofjesuschrist.org',
    graph_url: 'https://mis-gql-prod.aws.churchofjesuschrist.org/graphql',
    health_url: 'https://mis-gql-prod.aws.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://id.churchofjesuschrist.org/oauth2/auskwf3oaqYZwid57357/v1/token',
    client_id: '0oak0jqakvevwjWrp357',
    client_secret: '', // Managed server-side via environment variables
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
    client_id: '0oa5uce4xpm2l7K8G5d7',
    client_secret: '', // Managed server-side via environment variables (MOGS_DEV_CLIENT_SECRET)
    scope: 'client_token'
  },
  'mogs-gql-local': {
    name: 'MOGS GraphQL Local',
    scheme: 'http',
    domain: 'localhost:8080', // Combined domain and port for simplicity here, adjust if needed
    path: 'graphql',
    base_url: 'http://localhost:8080',
    graph_url: 'http://localhost:8080/graphql',
    health_url: 'http://localhost:8080/actuator/health',
    access_token_url: 'https://dev-73389086.okta.com/oauth2/default/v1/token',
    client_id: '0oa5uce4xpm2l7K8G5d7',
    client_secret: '', // Managed server-side via environment variables (MOGS_LOCAL_CLIENT_SECRET)
    scope: 'client_token'
  },
  'mogs-gql-prod': {
    name: 'MOGS GraphQL Production',
    scheme: 'https',
    domain: 'mms-gql-service.pvu.cf.churchofjesuschrist.org',
    path: 'graphql',
    base_url: 'https://mms-gql-service.pvu.cf.churchofjesuschrist.org',
    graph_url: 'https://mms-gql-service.pvu.cf.churchofjesuschrist.org/graphql',
    health_url: 'https://mms-gql-service.pvu.cf.churchofjesuschrist.org/actuator/health',
    access_token_url: 'https://id.churchofjesuschrist.org/oauth2/auskwf3oaqYZwid57357/v1/token',
    client_id: '0oak0jqakvevwjWrp357',
    client_secret: '', // Managed server-side via environment variables (MOGS_PROD_CLIENT_SECRET)
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
