# MIS GraphQL Next.js Application

A Next.js application for integrating with MIS (Missionary Information System) GraphQL APIs across multiple environments (dev, staging, production) with secure OAuth 2.0 authentication.

## Getting Started

### 1. Environment Setup

First, copy the environment template and configure your secrets:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your actual client secrets:

```env
# MIS GraphQL Development Environment
MIS_GQL_DEV_CLIENT_SECRET=your_dev_client_secret_here

# MIS GraphQL Staging Environment  
MIS_GQL_STAGE_CLIENT_SECRET=your_stage_client_secret_here

# MIS GraphQL Production Environment
MIS_GQL_PROD_CLIENT_SECRET=your_prod_client_secret_here
```

⚠️ **Important**: Never commit `.env.local` to the repository. It's already in `.gitignore`.

### 2. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## MIS GraphQL Integration

### Environment Configuration

The application supports three MIS GraphQL environments:

- **Development**: `https://mis-gql-dev.churchofjesuschrist.org/graphql`
- **Staging**: `https://mis-gql-stage.churchofjesuschrist.org/graphql`
- **Production**: `https://mis-gql.churchofjesuschrist.org/graphql`

Each environment uses OAuth 2.0 client credentials flow with Okta for authentication.

### Client Schema Containers and Authorized Clients

#### Schema Containers

MIS GraphQL uses schema containers to organize and version GraphQL schemas. Each container represents a specific domain or service within the MIS system:

- **Core Container**: Basic missionary data, areas, missions
- **Leadership Container**: Hierarchical leadership structures
- **Assignment Container**: Mission assignments, transfers, calls
- **Health Container**: Medical records, health tracking
- **Training Container**: MTC and field training data

#### Authorized Clients

Access to MIS GraphQL is controlled through Okta-managed OAuth 2.0 clients. Each application must be registered as an authorized client with specific scopes:

**Required Scopes for Basic Access:**
- `mis:missionary:read` - Read missionary basic information
- `mis:area:read` - Read area and geographic data
- `mis:mission:read` - Read mission information

**Additional Scopes (if needed):**
- `mis:leadership:read` - Leadership hierarchy access
- `mis:assignment:read` - Assignment and transfer data
- `mis:health:read` - Health and medical data (restricted)
- `mis:training:read` - Training records and progress

#### Okta Configuration

To set up a new authorized client:

1. **Register Client in Okta**:
   - Navigate to Okta Admin Console
   - Go to Applications > Applications
   - Create new App Integration
   - Choose "API Services" (machine-to-machine)
   - Note the Client ID and Client Secret

2. **Request MIS GraphQL Access**:
   - Submit access request through proper channels
   - Specify required schema containers and scopes
   - Provide Okta Client ID for authorization
   - Include business justification and data usage plans

3. **Environment-Specific Setup**:
   - Each environment (dev/stage/prod) requires separate client registration
   - Development clients typically have broader access for testing
   - Production clients should follow principle of least privilege

#### Client Authentication Flow

```
1. Application requests OAuth token from Okta
   POST /oauth2/default/v1/token
   - grant_type: client_credentials
   - client_id: {your_client_id}
   - client_secret: {your_client_secret}
   - scope: {requested_scopes}

2. Okta returns access token (JWT)
   - Token contains authorized scopes
   - Token expires (typically 1 hour)
   - Token includes client identification

3. Application uses token for GraphQL requests
   Authorization: Bearer {access_token}
   
4. MIS GraphQL validates token and scopes
   - Verifies token signature and expiration
   - Checks client authorization for requested data
   - Applies schema container access rules
```

### Security Features

- **Server-Side Authentication**: All OAuth tokens are managed server-side
- **Environment Variables**: Client secrets stored securely in environment variables
- **CORS Protection**: GraphQL requests proxied through Next.js API routes
- **Token Caching**: OAuth tokens cached server-side to reduce Okta requests
- **Environment Isolation**: Separate credentials for each environment

### Application Features

- **Environment Switching**: Dynamic environment selection with visual indicator
- **Missionary Search**: Search and view missionary information
- **API Testing**: Built-in GraphQL query testing interface
- **OAuth Debug**: Token inspection and authentication troubleshooting
- **Health Monitoring**: Environment health checks and status monitoring

### Application Features

- **Environment Switching**: Dynamic environment selection with visual indicator
- **Missionary Search**: Search and view missionary information
- **API Testing**: Built-in GraphQL query testing interface
- **OAuth Debug**: Token inspection and authentication troubleshooting
- **Health Monitoring**: Environment health checks and status monitoring

## Development

### Project Structure

```
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── api/               # API routes (server-side)
│   │   │   ├── oauth/         # OAuth token management
│   │   │   ├── graphql/       # GraphQL proxy and testing
│   │   │   └── health/        # Health check endpoints
│   │   ├── missionaries/      # Missionary search pages
│   │   ├── api-testing/       # GraphQL testing interface
│   │   ├── debug/            # OAuth debugging tools
│   │   └── settings/         # Environment configuration
│   ├── components/           # React components
│   │   ├── Navigation.tsx    # Main navigation bar
│   │   └── EnvironmentIndicator.tsx # Environment switcher
│   └── lib/                  # Utility libraries
│       ├── environments.ts   # Environment configurations
│       └── api-client.ts     # API client utilities
├── public/                   # Static assets
└── docs/                    # Additional documentation
```

### API Routes

All external API communication goes through Next.js API routes to maintain security:

- `/api/oauth/token` - OAuth 2.0 token acquisition
- `/api/oauth/test` - OAuth configuration testing
- `/api/graphql/proxy` - GraphQL query proxy
- `/api/graphql/test` - GraphQL endpoint testing
- `/api/health/check` - Environment health checks

### Environment Variables

```env
# Required for all environments
MIS_GQL_DEV_CLIENT_SECRET=     # Development environment secret
MIS_GQL_STAGE_CLIENT_SECRET=   # Staging environment secret  
MIS_GQL_PROD_CLIENT_SECRET=    # Production environment secret

# Optional configuration
NODE_ENV=development           # Application environment
NEXT_PUBLIC_APP_ENV=dev       # Default GraphQL environment
```

## Deployment

### Vercel Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Connect your GitHub repository
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables Setup

In your deployment platform, configure:

```env
MIS_GQL_DEV_CLIENT_SECRET=your_dev_secret
MIS_GQL_STAGE_CLIENT_SECRET=your_stage_secret  
MIS_GQL_PROD_CLIENT_SECRET=your_prod_secret
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **OAuth Authentication Failures**
   - Verify client secrets in `.env.local`
   - Check Okta client configuration
   - Use `/debug` page to inspect tokens

2. **GraphQL Query Errors**
   - Confirm client has required scopes
   - Verify schema container access
   - Test with `/api-testing` interface

3. **Environment Connection Issues**
   - Check network connectivity to MIS endpoints
   - Verify environment URLs in `src/lib/environments.ts`
   - Use health check functionality

### Debug Tools

- **OAuth Debug Page**: `/debug` - Inspect tokens and authentication
- **API Testing Page**: `/api-testing` - Test GraphQL queries
- **Health Check**: Built into navigation - Monitor environment status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MIS GraphQL API Documentation](internal-link)
- [OAuth 2.0 Client Credentials Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow)
