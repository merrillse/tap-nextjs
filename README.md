# Apex GraphQL Next.js Application

A Next.js application for integrating with GraphQL APIs, including MIS (Missionary Information System) and MOGS (Missionary Oracle GraphQL Service), across multiple environments (dev, staging, production) with secure OAuth 2.0 authentication.

## Getting Started

### 1. Environment Setup (SECURE METHOD - RECOMMENDED)

🔒 **For security reasons, we recommend setting client secrets as system environment variables instead of storing them in `.env.local` files. This prevents secrets from being exposed to AI tools, backups, or accidental sharing.**

#### macOS/Linux Setup:

**Step 1a: Add to your shell profile**
```bash
# Open your shell profile file
nano ~/.zshrc        # if using zsh (default on newer macOS)
# OR
nano ~/.bash_profile # if using bash
```

**Step 1b: Add your environment variables**
```bash
# Add these lines to your shell profile:
export MIS_GQL_DEV_CLIENT_SECRET="your_actual_dev_secret_here"
export MIS_GQL_STAGE_CLIENT_SECRET="your_actual_stage_secret_here"
export MIS_GQL_PROD_CLIENT_SECRET="your_actual_prod_secret_here"
export MOGS_DEV_CLIENT_SECRET="your_actual_mogs_dev_secret_here"
export MOGS_LOCAL_CLIENT_SECRET="your_actual_mogs_local_secret_here"
export MOGS_PROD_CLIENT_SECRET="your_actual_mogs_prod_secret_here"
```

**Step 1c: Reload your shell**
```bash
source ~/.zshrc        # or source ~/.bash_profile
```

**Step 1d: Verify the variables are set**
```bash
echo $MIS_GQL_DEV_CLIENT_SECRET
```

#### Windows Setup:

**Option A: Using System Properties (GUI)**
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables"
3. Under "User variables", click "New"
4. Add each variable:
   - Variable name: `MIS_GQL_DEV_CLIENT_SECRET`
   - Variable value: `your_actual_dev_secret_here`
5. Repeat for all 6 environment variables
6. Click OK and restart any open terminals/IDEs

**Option B: Using PowerShell**
```powershell
# Set user environment variables
[Environment]::SetEnvironmentVariable("MIS_GQL_DEV_CLIENT_SECRET", "your_actual_dev_secret_here", "User")
[Environment]::SetEnvironmentVariable("MIS_GQL_STAGE_CLIENT_SECRET", "your_actual_stage_secret_here", "User")
[Environment]::SetEnvironmentVariable("MIS_GQL_PROD_CLIENT_SECRET", "your_actual_prod_secret_here", "User")
[Environment]::SetEnvironmentVariable("MOGS_DEV_CLIENT_SECRET", "your_actual_mogs_dev_secret_here", "User")
[Environment]::SetEnvironmentVariable("MOGS_LOCAL_CLIENT_SECRET", "your_actual_mogs_local_secret_here", "User")
[Environment]::SetEnvironmentVariable("MOGS_PROD_CLIENT_SECRET", "your_actual_mogs_prod_secret_here", "User")
```

### 1. Alternative: .env.local Setup (LESS SECURE)

⚠️ **Only use this method if you cannot set system environment variables**

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

# MOGS Development Environment
MOGS_DEV_CLIENT_SECRET=your_mogs_dev_client_secret_here
MOGS_LOCAL_CLIENT_SECRET=your_mogs_local_client_secret_here
MOGS_PROD_CLIENT_SECRET=your_mogs_prod_client_secret_here
```

⚠️ **Important**: 
- Never commit `.env.local` to the repository (it's already in `.gitignore`)
- Consider switching to system environment variables for better security

### 2.1 Install Dependencies

Install the required npm packages:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 2.2 Run the Development Server

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

### 3. Client Selection Feature

The application includes a client selector dropdown in the top-right corner of the navigation bar. This allows users to choose which OAuth client to use for authentication:

**Available Clients:**
- **Missionary Graph Service Team** (`0oak0jqakvevwjWrp357`) - Default production client
- **Test Client** (`0oa82h6j45rN8G1he5d7`) - For lab attendees and testing

The selected client is persisted in localStorage and will be used for all GraphQL requests across all environments. Lab attendees using the Test Client will authenticate using the same client secrets as the existing environments.

## Supported GraphQL Systems

This application supports integration with the following GraphQL systems:

### 1. MIS GraphQL (Missionary Information System)

- **Development**: `https://mis-gql-dev.aws.churchofjesuschrist.org/graphql`
- **Staging**: `https://mis-gql-stage.aws.churchofjesuschrist.org/graphql`
- **Production**: `https://mis-gql-prod.aws.churchofjesuschrist.org/graphql`

Each MIS environment uses OAuth 2.0 client credentials flow with Okta for authentication. Refer to the sections below for details on MIS client schema containers, authorized clients, and Okta configuration.

### 2. MOGS GraphQL (Missionary Oracle GraphQL Service)

- **Development**: `https://mms-gql-service-dev.pvu.cf.churchofjesuschrist.org/graphql`
  - **Okta Token URL**: `https://dev-73389086.okta.com/oauth2/default/v1/token`
  - **Client ID**: `0oa5uce4xpm2l7K8G5d7`
  - **Scope**: `client_token`
- **Local**: `http://localhost:8080/graphql`
  - **Okta Token URL**: `https://dev-73389086.okta.com/oauth2/default/v1/token`
  - **Client ID**: `0oa5uce4xpm2l7K8G5d7`
  - **Scope**: `client_token`
- **Production**: `https://mms-gql-service.pvu.cf.churchofjesuschrist.org/graphql`
  - **Okta Token URL**: `https://id.churchofjesuschrist.org/oauth2/auskwf3oaqYZwid57357/v1/token`
  - **Client ID**: `0oak0jqakvevwjWrp357`
  - **Scope**: `client_token`

*(Additional MOGS environments like staging can be added as they become available.)*

MOGS environments also use OAuth 2.0 client credentials flow with Okta. The client secrets for MOGS development (`MOGS_DEV_CLIENT_SECRET`), local (`MOGS_LOCAL_CLIENT_SECRET`), and production (`MOGS_PROD_CLIENT_SECRET`) need to be configured in your `.env.local` file.

## MIS GraphQL Integration Details

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

- **System Environment Variables**: Client secrets stored as system environment variables (recommended)
- **Server-Side Authentication**: All OAuth tokens are managed server-side
- **Secure Secret Management**: Secrets never exposed to AI tools, backups, or project files
- **CORS Protection**: GraphQL requests proxied through Next.js API routes
- **Token Caching**: OAuth tokens cached server-side to reduce Okta requests
- **Environment Isolation**: Separate credentials for each environment
- **Minimal File Exposure**: .env.local files avoided in favor of system-level configuration

#### Security Best Practices

✅ **RECOMMENDED Security Approach:**
- Store secrets as system environment variables
- Use different secrets per environment
- Rotate secrets regularly
- Monitor access and usage
- Use platform-specific secret management in production

❌ **AVOID for Security:**
- Storing secrets in .env.local files
- Committing secrets to version control
- Sharing secrets through file sharing or messaging
- Using the same secrets across environments

### OAuth Client Identity Architecture

This application operates using a **single primary OAuth client identity** while providing the ability to **proxy requests as other authorized clients** for testing purposes.

#### Primary OAuth Client
- **Client Name**: Missionary Graph Service Team
- **Client ID**: `0oak0jqakvevwjWrp357`
- **Purpose**: This is the application's primary identity for authentication with MIS GraphQL
- **Visibility**: Displayed in the application header for transparency and security confidence
- **Scope**: Authorized for comprehensive testing across all MIS GraphQL schema containers

#### Proxy Client Architecture
The application supports testing on behalf of other authorized clients through the **proxy-client mechanism**:

1. **Authentication**: Always performed using the primary client (`0oak0jqakvevwjWrp357`)
2. **Authorization**: The primary client is authorized to act on behalf of other clients
3. **Request Proxying**: GraphQL requests include a `proxy-client` header with the target client ID
4. **Security**: Other clients' secrets are NEVER used - only their client IDs for proxying
5. **Testing**: Allows comprehensive testing of how different clients would interact with the API

```http
# Example proxied request
POST /graphql
Authorization: Bearer {token_from_primary_client}
proxy-client: 0oak9876543210example
Content-Type: application/json

{
  "query": "query { missionary(missionaryId: \"123\") { name } }"
}
```

#### Benefits of This Architecture
- **Security**: Only one set of client credentials needs to be managed securely
- **Flexibility**: Can test API behavior from multiple client perspectives
- **Compliance**: Follows principle of least privilege while enabling comprehensive testing
- **Transparency**: Clear identification of the actual authenticating client in the UI
- **Auditability**: All requests trace back to the primary client for security auditing

#### Client ID Display
The primary client ID is prominently displayed in the application header to provide:
- **Security Confidence**: Users can verify which OAuth client is being used
- **Transparency**: Clear identification of the authenticating entity
- **Debugging Aid**: Easy reference for troubleshooting authentication issues
- **Compliance**: Visible audit trail of client identity

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

🔒 **RECOMMENDED: System Environment Variables**
Set these as system environment variables for maximum security:

```bash
# Required for all environments
MIS_GQL_DEV_CLIENT_SECRET=     # Development environment secret
MIS_GQL_STAGE_CLIENT_SECRET=   # Staging environment secret
MIS_GQL_PROD_CLIENT_SECRET=    # Production environment secret
MOGS_DEV_CLIENT_SECRET=        # MOGS Development environment secret
MOGS_LOCAL_CLIENT_SECRET=      # MOGS Local environment secret
MOGS_PROD_CLIENT_SECRET=       # MOGS Production environment secret

# Optional configuration
NODE_ENV=development           # Application environment
NEXT_PUBLIC_APP_ENV=dev       # Default GraphQL environment
```

❌ **AVOID: .env.local files (especially in production)**
- Files can be accidentally shared or exposed to AI tools
- Risk of being included in backups
- Visible in project directory

**If using .env.local as fallback:**
```env
# Only use if system environment variables cannot be set
MIS_GQL_DEV_CLIENT_SECRET=your_dev_secret
MIS_GQL_STAGE_CLIENT_SECRET=your_stage_secret
MIS_GQL_PROD_CLIENT_SECRET=your_prod_secret
MOGS_DEV_CLIENT_SECRET=your_mogs_dev_secret
MOGS_LOCAL_CLIENT_SECRET=your_mogs_local_secret
MOGS_PROD_CLIENT_SECRET=your_mogs_prod_secret
```

## Deployment

### Vercel Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Connect your GitHub repository
2. Configure environment variables in Vercel dashboard (recommended)
3. Deploy automatically on git push

### Environment Variables Setup (Production)

🔒 **RECOMMENDED: Platform Environment Variables**

In your deployment platform (Vercel, AWS, etc.), configure environment variables through the platform's secure interface:

```env
MIS_GQL_DEV_CLIENT_SECRET=your_dev_secret
MIS_GQL_STAGE_CLIENT_SECRET=your_stage_secret
MIS_GQL_PROD_CLIENT_SECRET=your_prod_secret
MOGS_DEV_CLIENT_SECRET=your_mogs_dev_secret
MOGS_LOCAL_CLIENT_SECRET=your_mogs_local_secret # Typically not needed for deployed environments
MOGS_PROD_CLIENT_SECRET=your_mogs_prod_secret
```

**Platform-Specific Secret Management:**
- **Vercel**: Use Environment Variables in Project Settings
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Azure**: Use Azure Key Vault
- **Google Cloud**: Use Secret Manager
- **Docker**: Use Docker Secrets or environment variables

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000

# Secrets should be provided via Docker secrets or environment variables
# Never bake secrets into the Docker image
CMD ["npm", "start"]
```

**Docker Environment Variables:**
```bash
# Use environment variables or Docker secrets
docker run -e MIS_GQL_DEV_CLIENT_SECRET=$MIS_GQL_DEV_CLIENT_SECRET \
           -e MIS_GQL_PROD_CLIENT_SECRET=$MIS_GQL_PROD_CLIENT_SECRET \
           -p 3000:3000 your-app-name
```

## Troubleshooting

### Common Issues

1.  **OAuth Authentication Failures**
    *   **System Environment Variables (Recommended)**:
        - Verify variables are set: `echo $MIS_GQL_DEV_CLIENT_SECRET` (macOS/Linux) or `$env:MIS_GQL_DEV_CLIENT_SECRET` (Windows PowerShell)
        - Restart terminal and development server after setting variables
        - Check shell profile syntax (macOS/Linux)
    *   **If using .env.local**: Verify client secrets in `.env.local` file
    *   Check Okta client configuration for the respective service
    *   Use `/debug` page to inspect tokens

2.  **GraphQL Query Errors**
    *   Confirm client has required scopes
    *   Verify schema container access
    *   Test with `/api-testing` interface

3.  **Environment Connection Issues**
    *   Check network connectivity to MIS endpoints
    *   Verify environment URLs in `src/lib/environments.ts`
    *   Use health check functionality

4.  **Environment Variables Not Working**
    *   **System Variables**: Ensure variables are set in the correct shell profile
    *   **File-based**: Check `.env.local` is in root directory with correct naming
    *   **Both**: Restart development server after changes
    *   Visit `/debug` page to verify environment variable status

### Debug Tools

- **OAuth Debug Page**: `/debug` - Inspect tokens and authentication
- **API Testing Page**: `/api-testing` - Test GraphQL queries
- **Health Check**: Built into navigation - Monitor environment status
- **Environment Variables Check**: Visit `/debug` to see which variables are loaded

### Security Troubleshooting

If you suspect security issues:
1. **Rotate all client secrets** immediately
2. **Check access logs** for unauthorized usage
3. **Verify environment variable security** - ensure not stored in project files
4. **Review recent changes** to authentication configuration
5. **Contact security team** if breach is suspected

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MIS GraphQL API Documentation](internal-link)
- [MOGS GraphQL API Documentation](internal-link) {/* TODO: Add actual link if available */}
- [OAuth 2.0 Client Credentials Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow)
