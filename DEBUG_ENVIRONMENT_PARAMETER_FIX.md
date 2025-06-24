# Debug Page Environment Parameter Fix - Complete

## Issue Resolved
The debug page was showing this error:
```
{"error":"Unsupported environment","details":"Only 'mis-gql-dev' and 'mogs-gql-dev' environments are supported. Received: "}
```

The problem was that the environment parameter was not being passed in OAuth requests, resulting in an empty string being received by the OAuth token route.

## Root Cause Analysis
There were two main issues:

1. **Missing Environment Parameter in OAuth Token Request**: The debug page was making direct calls to `/api/oauth/token` without including the `environment` parameter
2. **Outdated OAuth Test Route**: The `/api/oauth/test` route still contained outdated client ID logic and wasn't properly handling the single client ID approach

## Fixes Applied

### 1. Fixed Debug Page OAuth Requests (`src/app/debug/page.tsx`)

**OAuth Token Request (Line ~100)**:
```typescript
// Before
body: JSON.stringify({
  access_token_url: config.access_token_url,
  client_id: config.client_id,
  client_secret: config.client_secret,
  scope: config.scope,
  method: 'basic'
})

// After
body: JSON.stringify({
  access_token_url: config.access_token_url,
  client_id: config.client_id,
  client_secret: config.client_secret,
  scope: config.scope,
  method: 'basic',
  environment: currentEnvironment  // ✅ Added environment parameter
})
```

**OAuth Test Request (Line ~50)**:
```typescript
// Before
body: JSON.stringify({
  access_token_url: config.access_token_url,
  client_id: config.client_id,
  client_secret: config.client_secret,
  scope: config.scope,
})

// After
body: JSON.stringify({
  access_token_url: config.access_token_url,
  client_id: config.client_id,
  client_secret: config.client_secret,
  scope: config.scope,
  environment: currentEnvironment  // ✅ Added environment parameter
})
```

### 2. Updated OAuth Test Route (`src/app/api/oauth/test/route.ts`)

**Replaced outdated client ID logic**:
```typescript
// Before - Multiple client IDs with hardcoded secret selection
if (client_id === '0oak0jqakvevwjWrp357') {
  actualClientSecret = process.env.MIS_GQL_STAGE_CLIENT_SECRET;
} else if (client_id === '0oa5uce4xpm2l7K8G5d7') {
  actualClientSecret = process.env.MIS_GQL_DEV_CLIENT_SECRET;
} else if (client_id === '0oa82h6j45rN8G1he5d7') {
  actualClientSecret = process.env.MIS_GQL_DEV_CLIENT_SECRET;
}

// After - Single client ID with environment-based secret selection
if (client_id === '0oa82h6j45rN8G1he5d7') {
  if (environment === 'mis-gql-dev') {
    actualClientSecret = process.env.MIS_GQL_DEV_CLIENT_SECRET;
  } else if (environment === 'mogs-gql-dev') {
    actualClientSecret = process.env.MOGS_DEV_CLIENT_SECRET;
  } else {
    return NextResponse.json({
      error: 'Unsupported environment', 
      details: `Only 'mis-gql-dev' and 'mogs-gql-dev' environments are supported. Received: ${environment}`
    }, { status: 400 });
  }
} else {
  return NextResponse.json({
    error: 'Unsupported client ID', 
    details: `Only client ID '0oa82h6j45rN8G1he5d7' is supported. Received: ${client_id}`
  }, { status: 400 });
}
```

**Added environment parameter extraction**:
```typescript
const { 
  access_token_url, 
  client_id, 
  client_secret, 
  scope,
  environment = ''  // ✅ Added environment parameter with default empty string
} = body;
```

## Verification
- ✅ Build completes successfully (`npm run build`)
- ✅ Debug page now properly sends environment parameter in all OAuth requests
- ✅ OAuth test route validates single client ID and selects appropriate secret based on environment
- ✅ All API routes consistently enforce single client ID policy

## Environment Parameter Flow
```
Debug Page → Select Environment (mis-gql-dev or mogs-gql-dev)
    ↓
OAuth Request → Include environment parameter
    ↓
OAuth Token/Test Route → Validate environment and select secret:
    • mis-gql-dev → MIS_GQL_DEV_CLIENT_SECRET
    • mogs-gql-dev → MOGS_DEV_CLIENT_SECRET
```

## Expected Result
The debug page should now successfully authenticate with both supported environments:
- **mis-gql-dev**: Uses `MIS_GQL_DEV_CLIENT_SECRET` from `.env.local`
- **mogs-gql-dev**: Uses `MOGS_DEV_CLIENT_SECRET` from `.env.local`

The environment parameter error should no longer occur.
