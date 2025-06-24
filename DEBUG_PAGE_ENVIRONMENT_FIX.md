# Debug Page Environment Fix

## Issue
The debug page was showing this error:
```
Error: form Auth failed: Unsupported environment - Only 'mis-gql-dev' and 'mogs-gql-dev' environments are supported. Received: 
```

The error occurred because the environment value was empty/undefined when sent to the OAuth token API.

## Root Cause
The `ApiClient` constructor requires two parameters:
1. `config` - The environment configuration object
2. `environmentKey` - The environment key string (e.g., 'mis-gql-dev')

In the debug page, the `ApiClient` was being instantiated like this:
```typescript
const apiClient = new ApiClient(config); // ❌ Missing environmentKey
```

Without the `environmentKey`, the OAuth request was sending an empty string for the environment parameter.

## Fix Applied
Updated the debug page to properly pass the environment key:

### `/src/app/debug/page.tsx`
```typescript
// Before (line 165)
const apiClient = new ApiClient(config);

// After  
const apiClient = new ApiClient(config, currentEnvironment);
```

### `/src/app/missionary/page.tsx`
Also found and fixed the same issue in the missionary page:
```typescript
// Before (line 109)
setApiClient(new ApiClient(config));

// After
setApiClient(new ApiClient(config, settings.environment));
```

## Verification
- ✅ Build completes successfully
- ✅ Debug page will now properly send the environment parameter
- ✅ OAuth requests will include the correct environment for secret selection

## Technical Details
The `ApiClient.requestTokenViaAPI()` method sends this payload to `/api/oauth/token`:
```typescript
{
  access_token_url: this.config.access_token_url,
  client_id: this.config.client_id,
  client_secret: this.config.client_secret,
  scope: this.config.scope,
  method: method,
  environment: this.environmentKey, // Now properly populated
}
```

The OAuth token route uses the `environment` field to select the correct client secret:
- `mis-gql-dev` → `MIS_GQL_DEV_CLIENT_SECRET`
- `mogs-gql-dev` → `MOGS_DEV_CLIENT_SECRET`
