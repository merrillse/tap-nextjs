# Security & Environment Configuration Guide

## Overview

This guide outlines the security best practices for environment configuration in the TAP Next.js application, including what should be stored in environment variables vs. committed to git.

## Security Classifications

### ✅ SAFE TO COMMIT TO GIT

These values can be safely committed to the repository as they are not sensitive:

1. **Base URLs and Endpoints**
   - `base_url`
   - `graph_url` 
   - `health_url`
   - `scheme`
   - `domain`
   - `path`

2. **OAuth Configuration (Public)**
   - `access_token_url` - OAuth token endpoints are public
   - `client_id` - Client IDs are considered public in OAuth 2.0 spec
   - `scope` - Scopes define access levels and are not secret

3. **Environment Names and Labels**
   - `name` field for display purposes

### 🔒 MUST BE IN ENVIRONMENT VARIABLES

These values contain sensitive information and MUST NEVER be committed to git:

1. **Client Secrets**
   - `client_secret` - OAuth client secrets are highly sensitive
   - Environment variables: `MIS_GQL_*_CLIENT_SECRET`, `MOGS_*_CLIENT_SECRET`

## Environment Structure

### MIS (MGQL) - 4 Lanes
- **Local**: `mis-gql-local` → `MIS_GQL_LOCAL_CLIENT_SECRET`
- **Development**: `mis-gql-dev` → `MIS_GQL_DEV_CLIENT_SECRET`
- **Staging**: `mis-gql-stage` → `MIS_GQL_STAGE_CLIENT_SECRET`
- **Production**: `mis-gql-prod` → `MIS_GQL_PROD_CLIENT_SECRET`

### MOGS - 3 Lanes
- **Local**: `mogs-gql-local` → `MOGS_LOCAL_CLIENT_SECRET`
- **Development**: `mogs-gql-dev` → `MOGS_DEV_CLIENT_SECRET`
- **Production**: `mogs-gql-prod` → `MOGS_PROD_CLIENT_SECRET`

## Implementation Details

### Environment Configuration (`src/lib/environments.ts`)
- Contains all non-sensitive configuration
- Client secrets are empty strings with comments indicating env var names
- All other configuration (URLs, client IDs, scopes) are committed to git

### OAuth Handler (`src/app/api/oauth/token/route.ts`)
- Maps environment keys to appropriate environment variables
- Validates that required secrets are available at runtime
- Provides clear error messages for missing configurations

### Security Benefits

1. **Separation of Concerns**: Public configuration in code, secrets in environment
2. **Deployment Flexibility**: Different secrets per environment without code changes
3. **Security Compliance**: No secrets in version control history
4. **Team Collaboration**: Developers can share public config without exposing secrets

## Best Practices

### For Development
1. Set environment variables in your shell profile (`~/.zshrc` or `~/.bash_profile`)
2. Never put secrets in `.env.local` files that might be accidentally committed
3. Use the provided `.env.example` as a template

### For Production Deployment
1. Use your deployment platform's environment variable system
2. Rotate secrets regularly
3. Monitor for any accidental commits of sensitive data

### For CI/CD
1. Store secrets in your CI/CD platform's secure variables
2. Never echo or log environment variables containing secrets
3. Use masked variables where available

## Security Validation

The application validates security at runtime:
- Checks for required environment variables
- Fails gracefully with clear error messages if secrets are missing
- Logs which environment variable is being used (without revealing the secret value)

## Migration Notes

When adding new environments:
1. Add the environment configuration to `environments.ts` with empty `client_secret`
2. Update the OAuth handler mapping in `route.ts`
3. Update `.env.example` with the new environment variable
4. Document the new environment variable name

This approach ensures that the application remains secure while being flexible for different deployment scenarios.
