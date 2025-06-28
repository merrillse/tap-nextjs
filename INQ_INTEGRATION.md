# INQ Dataverse API Integration

This page provides a secure interface for querying the INQ Dataverse OData API with proper OAuth2 authentication.

## Security Architecture

### 🔒 Secret Management
- **Client secrets are NOT stored in `.env.local` or any project files**
- **Secrets are managed via environment variables outside the project**
- **Server-side API endpoint checks secret presence without exposing values**
- **All authentication happens server-side for maximum security**

### 🛡️ Why This Approach?
- Prevents accidental secret commits to version control
- Protects secrets from AI coding assistants accessing project files
- Follows security best practices for secret management
- Prepares for production deployment with proper secret stores

## Environment Variables

Set these environment variables in your system (NOT in `.env.local`):

```bash
# Development Environment
export INQ_CLIENT_SECRET_DEV="your_dev_secret_here"

# Test Environment
export INQ_CLIENT_SECRET_TEST="your_test_secret_here"

# Staging Environment
export INQ_CLIENT_SECRET_STAGE="your_stage_secret_here"

# Production Environment
export INQ_CLIENT_SECRET_PROD="your_prod_secret_here"
```

## Local Development Setup

### Option 1: Terminal Environment Variables
```bash
# Set environment variables in your terminal
export INQ_CLIENT_SECRET_DEV="your_actual_secret"
export INQ_CLIENT_SECRET_TEST="your_actual_secret"

# Start the development server
npm run dev
```

### Option 2: Using the Setup Script
```bash
# Copy and customize the example script
cp setup-inq-env.example.sh setup-inq-env.sh

# Edit setup-inq-env.sh with your actual secrets
# Then source it
source setup-inq-env.sh

# Start the development server
npm run dev
```

### Option 3: Shell Profile (Persistent)
Add to your `~/.zshrc` or `~/.bashrc`:
```bash
export INQ_CLIENT_SECRET_DEV="your_actual_secret"
export INQ_CLIENT_SECRET_TEST="your_actual_secret"
# ... etc
```

## Production Deployment

### AWS Deployment
- **AWS Systems Manager Parameter Store**: Store secrets as SecureString parameters
- **AWS Secrets Manager**: Use for automatic rotation capabilities
- **ECS/Lambda**: Inject via environment variables from Parameter Store/Secrets Manager

### Azure Deployment
- **Azure Key Vault**: Store client secrets securely
- **Azure App Configuration**: Reference Key Vault secrets
- **Azure Functions/App Service**: Inject via application settings

### Vercel Deployment
- Go to Project Settings → Environment Variables
- Add each `INQ_CLIENT_SECRET_*` variable
- Set appropriate environment scopes (Development, Preview, Production)

### Docker Deployment
```bash
# Using environment variables
docker run -e INQ_CLIENT_SECRET_DEV="secret" my-app

# Using environment file
docker run --env-file inq-secrets.env my-app
```

## API Endpoints

### `/api/inq-secret-status`
- **Method**: GET
- **Query Params**: `env` (DEV, TEST, STAGE, PROD)
- **Purpose**: Check if client secret is configured for an environment
- **Returns**: `{ hasSecret: boolean, environment: string, envVarName: string }`
- **Security**: Only returns presence status, never exposes actual secrets

## OAuth2 Configuration

### Grant Type
- **Type**: `client_credentials`
- **Tenant ID**: `61e6eeb3-5fd7-4aaa-ae3c-61e8deb09b79`
- **Token URL**: `https://login.microsoftonline.com/61e6eeb3-5fd7-4aaa-ae3c-61e8deb09b79/oauth2/v2.0/token`

### Environment-Specific Settings

| Environment | Client ID | Scope |
|-------------|-----------|-------|
| Dev | `563efa39-c095-4882-a49d-3ecd0cca40e3` | `https://inq-dev.crm.dynamics.com/.default` |
| Test | `563efa39-c095-4882-a49d-3ecd0cca40e3` | `https://inq-test.crm.dynamics.com/.default` |
| Stage | `563efa39-c095-4882-a49d-3ecd0cca40e3` | `https://inq-stage.crm.dynamics.com/.default` |
| Prod | `5e6b7d0b-7247-429b-b8c1-d911d8f13d40` | `https://inq.crm.dynamics.com/.default` |

## Page Features

- **Environment Selection**: Switch between Dev, Test, Stage, and Prod
- **Real-time Secret Status**: Shows whether secrets are configured
- **OData Query Builder**: Interactive query construction with examples
- **OAuth2 Documentation**: Complete authentication workflow
- **Sample Data**: Representative missionary record structure
- **Comprehensive Documentation**: API usage examples and best practices

## Future Enhancements

1. **Server-side OAuth Flow**: Move token acquisition to API routes
2. **AWS Integration**: Direct integration with Parameter Store/Secrets Manager
3. **Token Caching**: Implement secure token caching and refresh
4. **Query History**: Save and manage frequently used queries
5. **Data Export**: Export query results to various formats

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive configuration
3. **Implement least privilege** access controls
4. **Rotate secrets regularly** using proper secret management tools
5. **Monitor and log** authentication activities
6. **Use HTTPS** for all communications
7. **Validate and sanitize** all user inputs

## Troubleshooting

### Secret Not Found Error
- Verify environment variable is set: `echo $INQ_CLIENT_SECRET_DEV`
- Restart development server after setting variables
- Check variable naming (must be exact: `INQ_CLIENT_SECRET_DEV`)

### Authentication Failures
- Verify client ID matches the environment
- Check scope URL format
- Ensure client secret is valid and not expired
- Contact Azure AD administrator for secret verification

### Build Issues
- Ensure all TypeScript types are properly imported
- Check that API routes are in correct directory structure
- Verify Next.js configuration supports API routes
