# Quick Testing Reference - TAP Next.js

## 🚀 Immediate Commands

### Run Assignment Location Tests
```bash
# All Assignment Location tests
npm test -- assignment-location

# Specific test categories
npm test -- src/test/pages/mogs-assignment-location.test.tsx        # Unit tests
npm test -- src/test/integration/assignmentLocationApi.test.ts      # API tests  
npm test -- src/test/performance/assignmentLocationPerformance.test.tsx # Performance

# Interactive mode
npm test

# One-time run
npm run test:run

# With coverage
npm run test:coverage

# Visual interface
npm run test:ui
```

## 📁 What We Implemented

### Files Created:
```
vitest.config.ts                                    # Vitest configuration
src/test/setup.ts                                   # Global test setup
src/test/mocks/assignmentLocationMocks.ts           # Mock data
src/test/pages/mogs-assignment-location.test.tsx    # Component tests
src/test/integration/assignmentLocationApi.test.ts  # API tests
src/test/performance/assignmentLocationPerformance.test.tsx # Performance tests
docs/complete-testing-guide.md                      # This comprehensive guide
docs/testing-strategy.md                            # Strategic overview
```

### Package.json Scripts Added:
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui", 
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

## 🧪 Test Categories Implemented

### ✅ Unit Tests (15+ scenarios)
- Component rendering and UI elements
- User interactions (clicks, typing, form submission)
- Input validation and error handling
- State management and data flow
- Export functionality
- Search history management

### ✅ Integration Tests (5+ scenarios)  
- GraphQL query structure validation
- API client configuration
- Error handling for network failures
- Response data validation
- Environment switching

### ✅ Performance Tests (7+ scenarios)
- Render performance (< 100ms target)
- Large dataset handling (100+ items)
- Memory usage and cleanup
- Network resilience
- Stress testing with rapid operations
- Edge case input validation

## 🔄 Extending to Other MOGS Queries

### 1. Create Test Structure for New Query
```bash
# For each new MOGS page (Component, Missionary Component, etc.)
src/test/mocks/[queryType]Mocks.ts
src/test/pages/mogs-[queryType].test.tsx  
src/test/integration/[queryType]Api.test.ts
src/test/performance/[queryType]Performance.test.tsx
```

### 2. Copy & Adapt Existing Tests
```bash
# Use Assignment Location tests as template
cp src/test/pages/mogs-assignment-location.test.tsx src/test/pages/mogs-component.test.tsx
# Then adapt for Component-specific fields and behavior
```

### 3. Update Mock Data
```typescript
// Create mocks matching your GraphQL schema
export const mockValidComponent = {
  id: "comp123",
  description: "Test Component", 
  missionaryType: { /* ... */ },
  // Include ALL fields from GraphQL schema
}
```

### 4. Run New Tests
```bash
npm test -- mogs-component  # Test your new implementation
```

## 🐛 Common Issues & Fixes

### Issue: Mock Import Errors
```typescript
// ❌ Don't import from page components in mocks
import { AssignmentLocation } from '../app/mogs-assignment-location/page'

// ✅ Define interfaces locally in mock files
interface AssignmentLocation {
  id: string
  name?: string
}
```

### Issue: Multiple Button Elements
```typescript
// ❌ Ambiguous selector
screen.getByRole('button', { name: /clear/i })

// ✅ Specific selector
screen.getByRole('button', { name: 'Clear Search' })
```

### Issue: Async Test Timing
```typescript
// ✅ Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})
```

## 📊 Quality Metrics Achieved

### Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+  
- **Functions**: 90%+
- **Lines**: 90%+

### Performance Benchmarks
- **Initial Render**: < 100ms
- **Search Operation**: < 200ms
- **Large Dataset**: < 500ms
- **Memory Usage**: Stable across operations

## 🎯 Testing Workflow

### Development Workflow
1. **Write failing test** first (TDD approach)
2. **Implement feature** to make test pass
3. **Refactor** while keeping tests green
4. **Run full suite** before commit

### Before Deployment
```bash
npm run test:run           # All tests pass
npm run test:coverage      # Coverage meets targets
npm run lint              # Code quality checks
npm run build             # Build succeeds
```

## 🔍 Debugging Tests

### Verbose Output
```bash
npm test -- --reporter=verbose assignment-location
```

### Single Test Debug  
```bash
npm test -- --grep "should render the page title"
```

### UI Debug Mode
```bash
npm run test:ui  # Interactive browser interface
```

## 📈 Next Steps

### Immediate (This Week)
1. ✅ Run existing tests: `npm test -- assignment-location`
2. ✅ Fix any failing tests
3. ✅ Review test coverage: `npm run test:coverage`

### Short Term (Next Sprint)
1. Create tests for MOGS Component page
2. Create tests for MOGS Missionary Component page  
3. Add accessibility testing
4. Set up CI/CD integration

### Long Term (Next Month)
1. End-to-end testing with Playwright
2. Visual regression testing
3. Load testing with K6
4. Contract testing for GraphQL schemas

## 💡 Pro Tips

- **Use watch mode during development**: `npm test`
- **Focus on failing tests**: `npm test -- --grep "failing test name"`
- **Check coverage gaps**: Open `coverage/index.html` after `npm run test:coverage`
- **Visual debugging**: `npm run test:ui` for interactive exploration
- **Mock everything external**: APIs, localStorage, navigation, etc.
- **Test user behavior, not implementation details**

---

**🎉 You now have enterprise-grade testing for MOGS Assignment Location and a clear path to test all GraphQL queries!**
