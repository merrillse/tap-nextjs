# Complete Testing Implementation Guide for TAP Next.js

## Table of Contents
1. [Overview](#overview)
2. [Testing Infrastructure Setup](#testing-infrastructure-setup)
3. [File Structure](#file-structure)
4. [Running Tests](#running-tests)
5. [Assignment Location Testing](#assignment-location-testing)
6. [Extending to All MGQL/MOGS Queries](#extending-to-all-mgqlmogs-queries)
7. [Test Categories](#test-categories)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Testing Strategies](#advanced-testing-strategies)

---

## Overview

This guide documents the complete testing implementation for the TAP Next.js application, specifically focusing on MOGS (Missionary Oracle Graph Service) and MGQL GraphQL query testing. We use **Vitest** as our testing framework with React Testing Library for component testing.

### Why Vitest?
- ⚡ **Faster** than Jest (native ESM, Vite-powered)
- 🎯 **Better TypeScript support** out of the box
- 🔧 **Modern tooling** with hot module reloading
- 📊 **Excellent coverage reporting**
- 🎨 **Visual test UI** included

---

## Testing Infrastructure Setup

### 1. Dependencies Installed

```bash
# Core testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

**Package Breakdown:**
- `vitest` - Test runner and framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for Node.js
- `@vitejs/plugin-react` - Vite React plugin for Vitest

### 2. Configuration Files Created

#### `vitest.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/mogs-assignment-location',
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})
```

#### `package.json` Scripts Added
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## File Structure

```
src/test/
├── setup.ts                     # Global test configuration
├── mocks/
│   └── assignmentLocationMocks.ts   # Mock data and API responses
├── pages/
│   └── mogs-assignment-location.test.tsx  # Component unit tests
├── integration/
│   └── assignmentLocationApi.test.ts      # API integration tests
└── performance/
    └── assignmentLocationPerformance.test.tsx  # Performance tests

docs/
├── testing-guide.md            # This comprehensive guide
└── testing-strategy.md         # Strategic overview
```

### Mock Data Structure (`src/test/mocks/assignmentLocationMocks.ts`)

```typescript
export const mockValidAssignmentLocation = {
  id: "12345",
  name: "Test Mission Brazil",
  assignmentMeetingName: "Brazil Sao Paulo Mission",
  status: { value: 1, label: "ACTIVE" },
  // ... complete mock object
}

export const mockApiClient = {
  executeGraphQLQuery: vi.fn()
}

export const mockEnvironments = {
  'mogs-gql-dev': { /* config */ },
  'mogs-gql-local': { /* config */ },
  'mogs-gql-prod': { /* config */ }
}
```

---

## Running Tests

### Basic Commands

#### Run All Tests
```bash
npm test
# Runs in watch mode - auto-reruns when files change
```

#### Run Tests Once (CI Mode)
```bash
npm run test:run
# Runs all tests once and exits
```

#### Visual Test Interface
```bash
npm run test:ui
# Opens browser-based test runner with interactive UI
```

#### Coverage Report
```bash
npm run test:coverage
# Generates coverage report in coverage/ directory
```

### Specific Test Execution

#### Assignment Location Tests Only
```bash
# All Assignment Location tests
npm test -- assignment-location

# Specific test files
npm test -- src/test/pages/mogs-assignment-location.test.tsx
npm test -- src/test/integration/assignmentLocationApi.test.ts
npm test -- src/test/performance/assignmentLocationPerformance.test.tsx
```

#### Test Categories
```bash
# Component rendering tests
npm test -- --grep "Component Rendering"

# API integration tests
npm test -- --grep "API Integration"

# Performance tests
npm test -- --grep "Performance"

# Error handling tests
npm test -- --grep "Error Handling"

# Input validation tests
npm test -- --grep "Input Validation"
```

#### Debugging Tests
```bash
# Verbose output
npm test -- --reporter=verbose assignment-location

# Single test debugging
npm test -- --grep "should render the page title"

# Run with console logs
npm test -- --reporter=verbose --no-coverage
```

---

## Assignment Location Testing

### Test Categories Implemented

#### 1. 🧪 Unit Tests (`src/test/pages/mogs-assignment-location.test.tsx`)

**Component Rendering Tests:**
- ✅ Page title and header display
- ✅ Environment selector functionality  
- ✅ Search form elements
- ✅ Connection status indicator

**Input Validation Tests:**
- ✅ Empty input validation
- ✅ Whitespace trimming
- ✅ Button state management
- ✅ Loading state handling

**User Interaction Tests:**
- ✅ Search button clicks
- ✅ Clear button functionality
- ✅ Enter key search
- ✅ Environment switching
- ✅ History interaction

**Data Display Tests:**
- ✅ Assignment location information
- ✅ Organization details
- ✅ Numerical data formatting
- ✅ Missing data handling ("N/A" display)

**Export Functionality Tests:**
- ✅ Export button visibility
- ✅ JSON download trigger
- ✅ File naming convention

**Search History Tests:**
- ✅ localStorage persistence
- ✅ History entry creation
- ✅ Click-to-reload functionality
- ✅ History clearing

#### 2. 🔗 Integration Tests (`src/test/integration/assignmentLocationApi.test.ts`)

**GraphQL Query Tests:**
- ✅ Query syntax validation
- ✅ Required field verification
- ✅ Variable passing

**Error Handling Tests:**
- ✅ Malformed query handling
- ✅ Network timeout simulation
- ✅ API client initialization

**Data Validation Tests:**
- ✅ Response structure validation
- ✅ Type checking
- ✅ Required field presence

#### 3. ⚡ Performance Tests (`src/test/performance/assignmentLocationPerformance.test.tsx`)

**Render Performance:**
- ✅ Initial page load < 100ms
- ✅ Large dataset handling (100+ items)
- ✅ Search operation < 200ms

**Memory Management:**
- ✅ Repeated search memory stability
- ✅ Component cleanup verification
- ✅ No memory leak detection

**Network Resilience:**
- ✅ Intermittent failure recovery
- ✅ Slow response handling
- ✅ UI responsiveness during load

**Stress Testing:**
- ✅ Rapid sequential searches
- ✅ Edge case input handling
- ✅ XSS/injection attempt safety

### Sample Test Execution

```bash
# Run assignment location tests with detailed output
npm test -- --reporter=verbose assignment-location

# Expected output:
✓ Component Rendering > should render the page title (15ms)
✓ Input Validation > should show error when searching with empty input (25ms)
✓ API Integration > should make correct GraphQL query (45ms)
✓ Performance > should render initial page within acceptable time (48ms)
```

---

## Extending to All MGQL/MOGS Queries

### 1. Create Test Structure for Each Query Type

For each MOGS page (Component, Missionary Component, Assignment Location, etc.):

```bash
# Create test files for new query type
src/test/mocks/[queryType]Mocks.ts
src/test/pages/mogs-[queryType].test.tsx
src/test/integration/[queryType]Api.test.ts
src/test/performance/[queryType]Performance.test.tsx
```

### 2. Mock Data Template

For each GraphQL query, create comprehensive mock data:

```typescript
// src/test/mocks/componentMocks.ts
export const mockValidComponent = {
  id: "comp123",
  description: "Test Component",
  missionaryType: { /* ... */ },
  assignmentLocation: { /* ... */ },
  // Include ALL possible fields from GraphQL schema
}

export const mockComponentApiClient = {
  executeGraphQLQuery: vi.fn()
}

// Edge case mocks
export const mockEmptyComponent = { id: "empty" }
export const mockLargeComponent = { /* 100+ related objects */ }
export const mockMalformedComponent = { /* missing required fields */ }
```

### 3. Universal Test Template

Create a reusable test template for all MOGS queries:

```typescript
// src/test/templates/mogsQueryTestTemplate.ts
export function createMOGSQueryTests(config: {
  queryName: string
  component: React.ComponentType
  mockData: any
  apiClient: any
  requiredFields: string[]
  searchLabel: string
}) {
  return {
    renderTests: () => { /* Universal render tests */ },
    validationTests: () => { /* Universal validation tests */ },
    apiTests: () => { /* Universal API tests */ },
    performanceTests: () => { /* Universal performance tests */ }
  }
}
```

### 4. Query-Specific Test Implementation

#### MOGS Component Tests
```bash
# Create component-specific tests
src/test/pages/mogs-component.test.tsx
src/test/integration/componentApi.test.ts
src/test/performance/componentPerformance.test.tsx
```

#### MOGS Missionary Component Tests
```bash
# Create missionary component tests
src/test/pages/mogs-missionary-component.test.tsx
src/test/integration/missionaryComponentApi.test.ts
src/test/performance/missionaryComponentPerformance.test.tsx
```

#### Additional MOGS Queries
Follow the same pattern for:
- Missionary History
- Proselytizing Areas
- Assignment Meetings
- Organizations
- Any custom GraphQL queries

### 5. Bulk Test Execution

```bash
# Run all MOGS tests
npm test -- mogs-

# Run specific query type
npm test -- mogs-component
npm test -- mogs-missionary

# Run by test category across all queries
npm test -- --grep "Component Rendering"  # All component render tests
npm test -- --grep "API Integration"      # All API tests
npm test -- --grep "Performance"          # All performance tests
```

---

## Test Categories

### 🧪 Unit Tests
**Purpose:** Test individual component functionality in isolation

**What to Test:**
- Component rendering with correct elements
- User interactions (clicks, typing, form submissions)
- State management and data flow
- Conditional rendering based on props/state
- Event handlers and callbacks
- Form validation and error handling

**File Pattern:** `src/test/pages/[component].test.tsx`

**Example Structure:**
```typescript
describe('MOGS [QueryType] Page', () => {
  describe('Component Rendering', () => {
    it('should render the page title and header correctly', () => {})
    it('should render search form with correct elements', () => {})
  })
  
  describe('Input Validation', () => {
    it('should validate required fields', () => {})
    it('should handle edge case inputs', () => {})
  })
  
  describe('User Interactions', () => {
    it('should handle search submission', () => {})
    it('should allow data export', () => {})
  })
})
```

### 🔗 Integration Tests
**Purpose:** Test API integration and data flow

**What to Test:**
- GraphQL query structure and syntax
- API client configuration and initialization
- Error handling for network failures
- Response data structure validation
- Environment switching functionality

**File Pattern:** `src/test/integration/[queryType]Api.test.ts`

**Example Structure:**
```typescript
describe('[QueryType] API Integration', () => {
  describe('GraphQL Query Structure', () => {
    it('should have valid GraphQL syntax', () => {})
    it('should include required fields', () => {})
  })
  
  describe('Error Handling', () => {
    it('should handle network failures', () => {})
    it('should validate malformed responses', () => {})
  })
})
```

### ⚡ Performance Tests
**Purpose:** Ensure acceptable performance under various conditions

**What to Test:**
- Initial render performance (< 100ms)
- Large dataset handling (100+ items)
- Memory usage and cleanup
- Network resilience and timeout handling
- Stress testing with rapid operations

**File Pattern:** `src/test/performance/[queryType]Performance.test.tsx`

**Performance Benchmarks:**
```typescript
const PERFORMANCE_BUDGETS = {
  initialRender: 100,    // ms
  searchOperation: 200,  // ms
  largeDataset: 500,     // ms
  memoryStable: true     // no leaks
}
```

### 🛡️ Security Tests
**Purpose:** Validate input sanitization and security measures

**What to Test:**
- XSS injection attempts
- SQL injection attempts
- Path traversal attempts
- Input length boundaries
- Special character handling

**Example Edge Cases:**
```typescript
const securityTestCases = [
  '<script>alert("xss")</script>',
  'SELECT * FROM users WHERE id = 1',
  '../../etc/passwd',
  'a'.repeat(10000),
  '🎯📊🔍' // Unicode/emoji
]
```

---

## Best Practices

### 1. Test Organization

#### File Naming Convention
```
[component-name].test.tsx        # Unit tests
[component-name]Api.test.ts      # Integration tests  
[component-name]Performance.test.tsx  # Performance tests
[component-name]Mocks.ts         # Mock data
```

#### Test Grouping
```typescript
describe('Component Name', () => {
  describe('Feature Group', () => {
    it('should do specific thing', () => {})
  })
})
```

### 2. Mock Data Strategy

#### Comprehensive Mocks
```typescript
// Include all possible fields from GraphQL schema
export const mockComplete[QueryType] = {
  // Required fields
  id: "test-id",
  name: "Test Name",
  
  // Optional fields  
  description: "Test Description",
  status: { value: 1, label: "ACTIVE" },
  
  // Nested objects
  relatedEntity: {
    id: "related-id",
    name: "Related Name"
  },
  
  // Collections
  items: [
    { id: "item1", name: "Item 1" },
    { id: "item2", name: "Item 2" }
  ]
}

// Edge case mocks
export const mockEmpty[QueryType] = { id: "empty" }
export const mockLarge[QueryType] = { /* 100+ items */ }
export const mockMalformed[QueryType] = { /* missing fields */ }
```

#### Dynamic Mock Generation
```typescript
export function generateMock[QueryType](overrides = {}) {
  return {
    ...mockDefault[QueryType],
    ...overrides
  }
}
```

### 3. Test Data Management

#### Environment Isolation
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  // Reset to clean state
})

afterEach(() => {
  cleanup()
  // Cleanup after each test
})
```

#### Deterministic Tests
```typescript
// Use fixed dates/times
const FIXED_DATE = new Date('2024-01-01T00:00:00Z')
vi.setSystemTime(FIXED_DATE)

// Use predictable IDs
const TEST_ID = 'test-12345'
```

### 4. Assertion Patterns

#### User-Centric Testing
```typescript
// Good - test what user sees
expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()

// Better - test user interactions
await user.click(screen.getByRole('button', { name: /search/i }))
expect(screen.getByText('Loading...')).toBeInTheDocument()
```

#### Robust Selectors
```typescript
// Good - semantic queries
screen.getByRole('button', { name: /search/i })
screen.getByLabelText(/assignment location id/i)

// Better - test IDs for complex elements
screen.getByTestId('assignment-location-details')
```

### 5. Error Testing Patterns

#### Network Errors
```typescript
mockApiClient.executeGraphQLQuery.mockRejectedValueOnce(
  new Error('Network error: Connection timeout')
)
```

#### Validation Errors
```typescript
const invalidInputs = ['', ' ', null, undefined, '<script>']
for (const input of invalidInputs) {
  // Test each invalid input
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Mock Import Errors
**Error:** `Cannot find module '../app/mogs-[page]/page'`

**Solution:** Use relative interfaces in mock files:
```typescript
// Instead of importing from page component
interface AssignmentLocation {
  id: string
  name?: string
  // Define locally in mock file
}
```

#### 2. Multiple Element Matches
**Error:** `Found multiple elements with role "button" and name /clear/i`

**Solution:** Use more specific selectors:
```typescript
// Instead of
screen.getByRole('button', { name: /clear/i })

// Use
screen.getByRole('button', { name: 'Clear Search' })
// or
screen.getByTestId('clear-search-button')
```

#### 3. API Client Mocking Issues
**Error:** `vi.mock` hoisting problems

**Solution:** Move mocks to setup files:
```typescript
// In src/test/setup.ts
vi.mock('@/lib/api-client', () => ({
  ApiClient: vi.fn()
}))
```

#### 4. Async Test Timing
**Error:** Tests failing due to timing issues

**Solution:** Use proper async patterns:
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})

// Set appropriate timeouts
await waitFor(() => {
  expect(/* assertion */).toBeTruthy()
}, { timeout: 5000 })
```

#### 5. Environment Configuration
**Error:** Tests failing in CI/CD

**Solution:** Ensure consistent environment:
```typescript
// In vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
})
```

### Debug Commands

#### Verbose Test Output
```bash
npm test -- --reporter=verbose [test-pattern]
```

#### Single Test Debugging
```bash
npm test -- --grep "specific test name"
```

#### Coverage Analysis
```bash
npm run test:coverage
open coverage/index.html  # View detailed coverage report
```

#### Test Performance Analysis
```bash
npm test -- --reporter=verbose --no-coverage
```

---

## Advanced Testing Strategies

### 1. Contract Testing
Ensure API contracts between frontend and GraphQL schema:

```typescript
// src/test/contracts/mogsSchema.test.ts
describe('MOGS GraphQL Schema Contracts', () => {
  it('should match expected AssignmentLocation schema', () => {
    const query = `
      query GetAssignmentLocation($id: ID!) {
        assignmentLocation(id: $id) {
          id
          name
          status { value label }
        }
      }
    `
    
    // Validate against actual schema
    expect(validateGraphQLQuery(query)).toBeTruthy()
  })
})
```

### 2. Visual Regression Testing
Add screenshot testing for UI consistency:

```bash
npm install --save-dev @storybook/test-runner playwright
```

```typescript
// Visual regression tests
describe('Visual Regression', () => {
  it('should match assignment location page screenshot', async () => {
    render(<MOGSAssignmentLocationPage />)
    await expect(screen.getByTestId('main-content')).toMatchSnapshot()
  })
})
```

### 3. Accessibility Testing
Ensure WCAG compliance:

```bash
npm install --save-dev @axe-core/react jest-axe
```

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MOGSAssignmentLocationPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 4. End-to-End Testing Strategy
For complete user workflows:

```bash
npm install --save-dev @playwright/test
```

```typescript
// e2e/assignment-location.spec.ts
import { test, expect } from '@playwright/test'

test('complete assignment location workflow', async ({ page }) => {
  await page.goto('/mogs-assignment-location')
  await page.fill('[data-testid="location-id-input"]', '12345')
  await page.click('[data-testid="search-button"]')
  await expect(page.locator('[data-testid="location-details"]')).toBeVisible()
})
```

### 5. Load Testing with K6
Test GraphQL endpoints under load:

```javascript
// k6-load-test.js
import http from 'k6/http'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 }
  ]
}

export default function() {
  const query = `
    query GetAssignmentLocation($id: ID!) {
      assignmentLocation(id: $id) { id name }
    }
  `
  
  const response = http.post('http://localhost:8080/graphql', {
    query,
    variables: { id: '12345' }
  })
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })
}
```

### 6. Continuous Integration Setup

#### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:run
      
      - name: Run integration tests
        run: npm test -- integration/
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

---

## Summary

This comprehensive testing implementation provides:

1. **🏗️ Complete Infrastructure** - Vitest setup with all necessary tooling
2. **📋 Test Categories** - Unit, Integration, Performance, and Security tests
3. **🎯 Assignment Location Example** - Fully implemented test suite
4. **🔄 Scalable Pattern** - Template for extending to all MOGS queries
5. **📚 Best Practices** - Proven patterns for maintainable tests
6. **🐛 Troubleshooting Guide** - Solutions for common issues
7. **🚀 Advanced Strategies** - Contract, visual, accessibility, and E2E testing

### Next Steps:

1. **Run existing tests:** `npm test -- assignment-location`
2. **Review test results** and fix any failing tests
3. **Create tests for additional MOGS queries** using the established patterns
4. **Implement advanced testing strategies** as your application grows
5. **Set up CI/CD integration** for automated testing

This foundation ensures robust, maintainable testing for all your GraphQL queries and provides confidence in your application's reliability and performance.
