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
    client_secret: process.env.MIS_GQL_STAGE_CLIENT_SECRET || '',
    scope: 'client_token'
  },
  'development': {
    name: 'Development',
    scheme: 'https',
    domain: 'api.dev.example.com',
    path: 'graphql',
    base_url: 'https://api.dev.example.com',
    graph_url: 'https://api.dev.example.com/graphql',
    health_url: 'https://api.dev.example.com/health',
    access_token_url: 'https://dev-auth.example.com/oauth2/token',
    client_id: '',
    client_secret: '',
    scope: 'api:read'
  },
  'production': {
    name: 'Production',
    scheme: 'https',
    domain: 'api.example.com',
    path: 'graphql',
    base_url: 'https://api.example.com',
    graph_url: 'https://api.example.com/graphql',
    health_url: 'https://api.example.com/health',
    access_token_url: 'https://auth.example.com/oauth2/token',
    client_id: '',
    client_secret: '',
    scope: 'api:read'
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
