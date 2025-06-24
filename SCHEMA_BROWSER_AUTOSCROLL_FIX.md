# Schema Browser Auto-Scroll Fix

## Problem
When clicking on type references (like `ArrivalDate`) in the schema-browser page, the auto-scroll functionality would sometimes fail to scroll to the correct line, especially when the target type was not currently visible in the schema view.

## Root Causes
1. **Timing Issues**: The original implementation used a fixed 100ms delay, which wasn't always sufficient for DOM updates
2. **Missing Elements**: When the target line wasn't currently rendered/visible, the querySelector would fail
3. **Fallback Calculation**: The fallback scroll calculation was sometimes inaccurate
4. **Click Handler Interference**: Click events could interfere with the scroll timing

## Solution Implemented

### 1. Robust Retry Mechanism
- Replaced single-attempt scroll with a retry mechanism (up to 5 attempts)
- Progressive delays: 50ms, 100ms, 150ms, etc., for better DOM synchronization
- Graceful fallback when elements aren't found

### 2. Enhanced Jump Function
```typescript
const attemptScroll = (retryCount = 0) => {
  if (!schemaViewRef.current || retryCount > 5) {
    return;
  }
  
  const targetLineElement = schemaViewRef.current.querySelector(`[data-line="${targetLine}"]`);
  
  if (targetLineElement) {
    // Direct scroll to element when found
    // ... precise scroll calculation
  } else {
    // Retry logic with progressive delays
    setTimeout(() => attemptScroll(retryCount + 1), 50 * (retryCount + 1));
  }
};
```

### 3. Improved Click Handling
- Added `preventDefault()` and `stopPropagation()` to type reference clicks
- Added 10ms delay before triggering jump to prevent click interference
- Better event isolation to ensure smooth scrolling

### 4. Better DOM Element Detection
- More robust line height calculation using actual rendered elements
- Fallback strategies when line elements aren't immediately available
- Progressive retry delays to handle different rendering scenarios

## Key Changes Made

### In `jumpToType` function:
- Replaced single setTimeout with retry-based `attemptScroll` function
- Added progressive delay mechanism (50ms base with multiplier)
- Enhanced element detection and fallback logic
- Maintained smooth scrolling behavior with centering

### In `highlightSchemaContent` function:
- Added event prevention for type reference clicks
- Added 10ms delay before triggering jump to prevent interference
- Improved click event isolation

## Testing Scenarios Covered
1. **Visible Target**: Type already visible in schema view
2. **Hidden Target**: Type not currently rendered/visible
3. **Large Schema**: Many types with long scroll distances
4. **Rapid Clicks**: Multiple quick clicks on different type references
5. **Edge Cases**: First/last types in schema, nested type references

## Benefits
- **Reliability**: Auto-scroll now works consistently for all type references
- **Performance**: Minimal overhead with smart retry logic
- **User Experience**: Smooth, predictable navigation behavior
- **Robustness**: Handles edge cases and timing variations gracefully

## Files Modified
- `src/app/schema-browser/page.tsx`: Enhanced `jumpToType` and `highlightSchemaContent` functions

## Verification
- TypeScript compilation: ✅ No errors
- Dev server: ✅ Running successfully
- Functionality: ✅ Auto-scroll works for all type references including previously problematic cases like `ArrivalDate`

The schema-browser now provides reliable auto-scroll functionality for all type references, ensuring users can navigate the schema efficiently regardless of the current view state or target location.
