# Complete Implementation Prompt for GraphQL Multiple Operations Support

## Task Description
Implement support for GraphQL documents with multiple operations in the API testing page. When a GraphQL document contains multiple named operations (queries, mutations, or subscriptions), the user should be able to select which operation to execute, and the selected `operationName` must be sent to the GraphQL server.

## Current Problem
The API testing page at `/api-testing` currently fails when executing GraphQL documents with multiple operations, returning the error:
```
"Must provide operation name if query contains multiple operations."
```

This happens because the GraphQL specification requires an `operationName` parameter when a document contains multiple operations, but the current implementation doesn't parse, select, or send this parameter.

## Requirements

### 1. Operation Parsing
- Parse GraphQL documents to extract all named operations (query, mutation, subscription)
- Use regex pattern: `/(?:query|mutation|subscription)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g`
- Handle edge cases: unnamed operations, malformed queries, empty documents

### 2. UI Components
- Add an "Operation" dropdown selector in the response panel header (next to Environment and Proxy selectors)
- Only show the dropdown when multiple operations are detected
- Auto-select the first operation when multiple operations are found
- Update the dropdown options when the query changes

### 3. State Management
- Add state for `operationName: string` and `availableOperations: string[]`
- Update available operations when query input changes (useEffect)
- Reset operation selection when operations change
- Auto-select first operation if current selection becomes invalid

### 4. API Integration
- Modify the `executeGraphQLQuery` function in `src/lib/api-client.ts` to accept `operationName` parameter
- Include `operationName` in the request body sent to the proxy when provided
- Update the proxy route to forward `operationName` to the GraphQL server
- Only send `operationName` when it's not empty/undefined

### 5. Request Flow
The complete request flow should be:
```
Client Query + Selected Operation Name
    ↓
API Testing Page (handleTest function)
    ↓
API Client (executeGraphQLQuery function)
    ↓
Next.js Proxy Route (/api/graphql/proxy)
    ↓
GraphQL Server (with operationName in request body)
```

## Files to Modify

### 1. `/src/app/api-testing/page.tsx`
- Add state variables for operation management
- Add parsing function to extract operation names from GraphQL document
- Add useEffect to update available operations when query changes
- Add operation selector dropdown in the response panel header
- Update the `handleTest` function to use selected operation name
- Add validation to ensure operation is selected for multi-operation documents

### 2. `/src/lib/api-client.ts`
- Update `executeGraphQLQuery` function signature to accept optional `operationName` parameter
- Include `operationName` in request body when provided using spread operator: `...(operationName && { operationName })`

### 3. `/src/app/api/graphql/proxy/route.ts`
- Extract `operationName` from request body alongside query and variables
- Forward `operationName` to GraphQL server in request body when provided

## Implementation Details

### Operation Parsing Function
```typescript
const parseOperations = (query: string): string[] => {
  if (!query.trim()) return [];
  
  try {
    const operationRegex = /(?:query|mutation|subscription)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    const operations: string[] = [];
    let match;
    
    while ((match = operationRegex.exec(query)) !== null) {
      operations.push(match[1]);
    }
    
    return operations;
  } catch (error) {
    console.warn('Error parsing operations:', error);
    return [];
  }
};
```

### State Management Pattern
```typescript
const [operationName, setOperationName] = useState<string>('');
const [availableOperations, setAvailableOperations] = useState<string[]>([]);

useEffect(() => {
  const operations = parseOperations(queryInput);
  setAvailableOperations(operations);
  
  // Reset operation name if it's no longer available
  if (operationName && !operations.includes(operationName)) {
    setOperationName('');
  }
  
  // Auto-select first operation if operations exist and no operation is selected
  if (operations.length > 0 && !operationName) {
    setOperationName(operations[0]);
  }
}, [queryInput, operationName]);
```

### UI Placement
Add the operation selector in the response panel header, after the Proxy selector and before the debug info:

```typescript
{/* Operation Name Selector */}
{availableOperations.length > 1 && (
  <div className="flex items-center space-x-2">
    <span className="text-xs text-gray-500 font-medium">Operation:</span>
    <select
      value={operationName}
      onChange={(e) => setOperationName(e.target.value)}
      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {availableOperations.map((operation) => (
        <option key={operation} value={operation}>
          {operation}
        </option>
      ))}
    </select>
  </div>
)}
```

### API Client Update
```typescript
async executeGraphQLQuery(
  query: string, 
  variables: Record<string, unknown> = {},
  customHeaders: Record<string, string> = {},
  proxyClient?: string,
  operationName?: string  // Add this parameter
): Promise<GraphQLResponse> {
  // ... existing code ...
  
  const response = await fetch('/api/graphql/proxy', {
    method: 'POST',
    headers: proxyHeaders,
    body: JSON.stringify({
      query,
      variables,
      access_token: accessToken,
      ...(operationName && { operationName }),  // Add this line
    }),
  });
  
  // ... rest of function ...
}
```

### Validation Logic
```typescript
// In handleTest function, before executing the query
const currentOperations = parseOperations(queryInput);
if (currentOperations.length > 1 && !operationName) {
  setError('Multiple operations detected. Please select an operation to execute.');
  return;
}
```

## Testing Instructions
After implementation, test with this sample query:
```graphql
query GetMissionary {
  __typename
}

query GetSchema {
  __schema {
    types {
      name
    }
  }
}
```

Expected behavior:
1. Both operations should appear in the dropdown
2. First operation should be auto-selected
3. Query should execute successfully with the selected operation
4. No "Must provide operation name" error should occur

## Debug Requirements
Add console logging to verify:
- Operations are parsed correctly
- Operation name is included in request body
- Server receives and forwards operation name
- GraphQL server gets the operation name parameter

This implementation should fully support GraphQL documents with multiple operations while maintaining backward compatibility with single-operation documents.
