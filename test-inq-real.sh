#!/bin/bash

# Test setup for INQ API - Real Environment Variable Example
# This script shows how to test with a real client secret

echo "🔧 Setting up INQ API test environment..."
echo ""

# For DEVELOPMENT testing with a real secret:
# export INQ_CLIENT_SECRET_DEV="your_actual_dev_secret_here"

# For TEST environment:
# export INQ_CLIENT_SECRET_TEST="your_actual_test_secret_here"

# Example test with dummy secret (this will fail authentication but test the flow):
export INQ_CLIENT_SECRET_DEV="dummy_secret_for_testing"

echo "✅ Environment variable set: INQ_CLIENT_SECRET_DEV"
echo "🚀 Starting development server..."
echo ""
echo "To test with real data:"
echo "1. Replace 'dummy_secret_for_testing' with actual client secret"
echo "2. Restart the server"
echo "3. Visit http://localhost:3000/inq-missionaries"
echo "4. Select Dev environment and click 'Execute Query'"
echo ""

# Start the development server
npm run dev
