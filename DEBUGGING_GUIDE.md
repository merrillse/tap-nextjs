# GraphQL Request Debugging Guide

## Overview

The TAP NextJS application includes comprehensive debugging capabilities that show detailed information about GraphQL requests, including **clientId** and **target URL** (lane) for every request.

## 🚀 Request Debugging Features

### Client-Side Debugging (Browser Console)

When you make any GraphQL request, detailed debugging information is automatically logged to the browser console:

#### 📋 Request Information
- **Environment**: Which environment is being used (e.g., `mis-gql-stage`, `mis-gql-dev`)
- **Target URL**: The actual GraphQL endpoint URL being hit (the "lane")
- **Primary Client ID**: The main OAuth client identifier
- **Proxy Client ID**: The selected proxy client (primary/alternate)
- **OAuth Token URL**: The authentication endpoint
- **Request Timestamp**: When the request was made
- **Request Body Size**: Size of the GraphQL query/variables
- **Query Preview**: First 200 characters of the GraphQL query

#### 🔐 Authentication Information
- **Token Type**: Usually "Bearer"
- **Token Scope**: OAuth scope permissions
- **Token Expiration**: How many minutes until token expires

#### 📤 Request Headers
All proxy request headers are logged, including debug headers like:
- `x-debug-client-id`: Primary client ID
- `x-debug-target-url`: Target GraphQL URL
- `x-selected-environment`: Current environment
- `proxy-client`: Selected proxy client

### Server-Side Debugging (Server Console)

The GraphQL proxy API route also logs detailed information:

#### 🌐 Server Analysis
- **Target URL**: Destination GraphQL endpoint
- **Environment**: Selected environment configuration
- **Primary Client ID**: OAuth client identifier
- **Proxy Client ID**: Selected proxy client
- **Request Timestamp**: Server-side request time
- **Request Body Size**: Size of the request payload
- **Query Preview**: First 150 characters of the query
- **Token Preview**: First 30 characters of the access token

#### 📥 Response Information
- **HTTP Status**: Response status code
- **Content Type**: Response content type
- **Response Size**: Size of the response in KB
- **Has Data/Errors**: Whether the GraphQL response contains data or errors

### Debug Headers in Response

Every GraphQL response includes debug headers:
- `x-environment`: Which environment was used
- `x-proxy-client`: Which proxy client was used
- `x-primary-client`: Primary client ID
- `x-target-url`: Target GraphQL URL
- `x-debug-timestamp`: Server processing timestamp
- `x-response-size`: Response size in KB

## 🐛 Debug Panel (UI)

### Accessing the Debug Panel

1. **Keyboard Shortcut**: Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
2. **Debug Button**: Click the "🐛 Debug" button in the bottom-left corner

### Debug Panel Information

The debug panel shows real-time information about:

#### 🔐 Current Client
- **Client ID**: Currently selected OAuth client
- **Client Name**: Human-readable name of the client

#### 📊 Session Information
- **Session ID**: Unique identifier for the current user session
- **Session Start Time**: When the current session began
- **Last Activity**: When the session was last active

#### 🎫 Token Cache Statistics
- **Memory Count**: Number of tokens cached in memory
- **Valid Tokens**: Number of unexpired tokens
- **Expired Tokens**: Number of expired tokens
- **Environments**: List of environments with cached tokens

#### 🌐 Current Context
- **Current URL**: The page you're currently on
- **Environment**: Selected environment (mis-gql-stage, mis-gql-dev, etc.)
- **Proxy Client**: Selected proxy client (primary, alternate)

#### 🚀 GraphQL Debug Status
- **Console Logging**: Confirmation that all debugging is active
- **Logged Information**: Client ID, Target URL, Environment, Request/Response details

#### 💾 Local Storage Statistics
- **Total Keys**: Number of items in local storage
- **Search Histories**: Number of saved search history entries

## 📍 How to View Debug Information

### 1. Open Browser DevTools Console

Before making any GraphQL request:
1. Open your browser's Developer Tools (F12)
2. Go to the "Console" tab
3. Make sure console logging is enabled

### 2. Make a GraphQL Request

When you execute any GraphQL query or mutation, you'll see detailed console output like:

```
🚀 GraphQL Request Debug Info
📋 Request Details:
  • Environment: mis-gql-stage
  • Target URL: https://api-stage.churchofjesuschrist.org/mis/graphql
  • Primary Client ID: your-client-id-here
  • Proxy Client ID: primary
  • OAuth Token URL: https://id-stage.churchofjesuschrist.org/oauth2/token
  • Request Timestamp: 2025-06-24T12:34:56.789Z
  • Request Body Size: 245 bytes
  • Query Preview: query { missionaries { id name } }

🔐 Authentication Info:
  • Token Type: Bearer
  • Token Scope: read:missionaries
  • Token Expires In: 45 minutes
```

### 3. Check Response Headers

In the Network tab of DevTools, you can also see the debug headers in the response:
- Look for headers starting with `x-debug-`, `x-environment`, etc.

## 🔧 Debug Actions

The debug panel includes helpful actions:

### Log Current State
- **Log localStorage**: Dumps all localStorage data to console
- **Log Debug Info**: Logs the current debug panel information
- **Log Token Cache**: Shows detailed token cache statistics

## 🚨 Troubleshooting

### Not Seeing Debug Information?

1. **Check Console**: Make sure browser DevTools console is open and logging is enabled
2. **Check Environment**: Verify you're in development mode or debug logging is enabled
3. **Make a Request**: Debug info only appears when you actually make GraphQL requests
4. **Clear Cache**: Try clearing browser cache and localStorage if debug info seems stale

### Debug Panel Not Appearing?

1. **Keyboard Shortcut**: Try `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
2. **Look for Button**: Check for the "🐛 Debug" button in bottom-left corner
3. **Refresh Page**: Try refreshing the page if the panel isn't responding

## 📚 Key Benefits

✅ **Complete Visibility**: See exactly which client ID and URL every request uses  
✅ **Environment Awareness**: Always know which environment you're hitting  
✅ **Request Tracing**: Full request/response cycle visibility  
✅ **Security Debugging**: Verify token information and session state  
✅ **Performance Monitoring**: Track request sizes and response times  
✅ **Real-time Information**: Live updates of current client and session state  

## 🎯 Summary

With these debugging features, you have complete visibility into:
- **What client ID** is being used for each request
- **What URL/lane** each request is targeting
- **What environment** configuration is active
- **What authentication tokens** are being used
- **What proxy settings** are in effect

This comprehensive debugging setup ensures you always know exactly where your GraphQL requests are going and what credentials they're using.
