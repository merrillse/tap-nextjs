# User Session Management & Cache Clearing

## Overview

The TAP NextJS application now includes comprehensive user session management that automatically clears all cached data when users switch between different OAuth clients. This prevents data leakage and ensures security when multiple users access the application on the same device.

## Key Features

### 🔐 **Automatic Cache Clearing**
When switching between users/clients, the system automatically clears:
- **OAuth Tokens**: All cached access tokens for all environments
- **Search Histories**: All saved search results and query histories
- **Query Library**: Saved GraphQL queries and variables
- **Environment Settings**: Selected environments and preferences
- **Temporary State**: Any cached UI state or temporary data

### 🔄 **Session Management**
- **Session Tracking**: Each user session is tracked with unique session IDs
- **Activity Monitoring**: User activity is monitored to keep sessions fresh
- **Auto Expiration**: Sessions automatically expire after 8 hours of inactivity
- **Session Isolation**: Complete isolation between different user sessions

### 💡 **User Experience**
- **Visual Feedback**: Loading spinner and "Switching..." text during user switches
- **Notifications**: Toast notifications confirming successful user switches
- **Disabled UI**: User interface is temporarily disabled during switching process
- **Cache Status**: Clear indication that caches have been cleared for security

## Implementation Details

### Core Components

#### `src/lib/user-session.ts`
Central session management with functions:
- `switchUser()` - Main function for user switching with cache clearing
- `clearUserData()` - Comprehensive data clearing across all storage types
- `getCurrentSession()` - Get current active session information
- `checkUserSwitch()` - Check if user switching is needed

#### `src/contexts/ClientSelectionContext.tsx`
Enhanced client selection context that:
- Integrates with session management
- Handles user switching events
- Provides `isUserSwitching` state for UI feedback
- Dispatches custom events for other components

#### `src/hooks/useApiClient.ts`
Updated hook that:
- Listens for user switch events
- Forces API client refresh on user changes
- Invalidates cached tokens automatically
- Ensures fresh authentication for new users

#### `src/components/ClientSelector.tsx`
Enhanced UI component with:
- Visual switching state (spinner, disabled state)
- Clear security messaging
- Improved accessibility during switching
- Real-time feedback to users

#### `src/components/UserSwitchNotifications.tsx`
Toast notification system that:
- Shows success messages when switching users
- Confirms cache clearing has occurred
- Auto-dismisses after 5 seconds
- Provides clear security messaging

### Security Benefits

1. **Data Isolation**: Complete separation between different user sessions
2. **Token Security**: All cached OAuth tokens are cleared between users
3. **Search Privacy**: Search histories are not shared between users
4. **Query Privacy**: Saved queries and variables are user-specific
5. **Environment Isolation**: Environment selections don't persist across users

### Events and Integration

The system dispatches custom events that other components can listen to:

```typescript
// User switch event (with cache clearing)
window.addEventListener('userSwitch', (event) => {
  console.log('User switched to:', event.detail.clientName);
});

// Client switch event (may or may not involve cache clearing)
window.addEventListener('clientSwitch', (event) => {
  if (event.detail.switched) {
    console.log('User switched with cache clearing');
  }
});
```

### Usage Example

```typescript
import { switchUser, clearUserData } from '@/lib/user-session';

// Switch to a new user (automatically clears all data)
switchUser('0oa82h6j45rN8G1he5d7', 'Test Client');

// Manually clear all user data (useful for logout)
clearUserData();
```

## Testing the Feature

### Manual Testing Steps

1. **Login as User A**:
   - Select "Missionary Graph Service Team" client
   - Perform some searches and save queries
   - Check localStorage in dev tools

2. **Switch to User B**:
   - Select "Test Client" from the client dropdown
   - Observe loading state and notification
   - Verify localStorage has been cleared

3. **Verify Isolation**:
   - Perform different searches as User B
   - Switch back to User A
   - Confirm User A's data is gone and fresh session started

### Browser DevTools Verification

Open DevTools → Application → Local Storage to verify:
- Search history keys are cleared
- Query library data is removed
- OAuth tokens are invalidated
- Session data is updated

## Configuration

### Session Timeout
Default session timeout is 8 hours, configurable in `user-session.ts`:

```typescript
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
```

### Token Expiration Buffer
Token expiration buffer (2 minutes before actual expiration):

```typescript
const EXPIRATION_BUFFER_MS = 2 * 60 * 1000; // 2 minutes
```

### Notification Duration
Auto-dismiss time for notifications (5 seconds):

```typescript
setTimeout(() => {
  // Remove notification
}, 5000);
```

## Future Enhancements

- **Multi-tab Synchronization**: Coordinate user switching across browser tabs
- **Admin Override**: Allow administrators to force user switches
- **Audit Logging**: Log user switches for security auditing
- **Session Persistence**: Option to persist sessions across browser restarts
- **Warning Dialogs**: Confirm before switching if user has unsaved work

## Troubleshooting

### Common Issues

1. **Switching Not Working**: Check browser console for JavaScript errors
2. **Cache Not Clearing**: Verify localStorage permissions in browser
3. **Notifications Not Showing**: Check if notifications are blocked in browser
4. **Session Expiration**: Check system clock and session timeout settings

### Debug Information

Enable detailed logging by setting in browser console:
```typescript
localStorage.setItem('debug-user-session', 'true');
```

This will provide detailed logging of all session management operations.
