#!/bin/bash

# INQ Environment Variables Setup Script
# This script demonstrates how to set environment variables securely

echo "Setting up INQ environment variables..."
echo ""
echo "IMPORTANT: Replace 'your_actual_secret_here' with real values from Azure AD"
echo "Contact your Azure AD administrator for the actual client secret values"
echo ""

# Uncomment and replace with actual secrets:
# export INQ_CLIENT_SECRET_DEV="your_actual_dev_secret_here"
# export INQ_CLIENT_SECRET_TEST="your_actual_test_secret_here" 
# export INQ_CLIENT_SECRET_STAGE="your_actual_stage_secret_here"
# export INQ_CLIENT_SECRET_PROD="your_actual_prod_secret_here"

echo "Example usage:"
echo "1. Copy this file to setup-inq-env.sh"
echo "2. Edit the file and add your actual secrets"
echo "3. Run: source setup-inq-env.sh"
echo "4. Start your development server: npm run dev"
echo ""
echo "For production, use proper secret management:"
echo "- AWS: Systems Manager Parameter Store or Secrets Manager"
echo "- Azure: Key Vault or App Configuration"
echo "- Vercel: Project Settings → Environment Variables"
echo "- Docker: Use --env-file or environment variables"
echo ""

# Check if variables are set
if [ -z "$INQ_CLIENT_SECRET_DEV" ]; then
    echo "❌ INQ_CLIENT_SECRET_DEV not set"
else
    echo "✅ INQ_CLIENT_SECRET_DEV is configured"
fi

if [ -z "$INQ_CLIENT_SECRET_TEST" ]; then
    echo "❌ INQ_CLIENT_SECRET_TEST not set"
else
    echo "✅ INQ_CLIENT_SECRET_TEST is configured"
fi

if [ -z "$INQ_CLIENT_SECRET_STAGE" ]; then
    echo "❌ INQ_CLIENT_SECRET_STAGE not set"
else
    echo "✅ INQ_CLIENT_SECRET_STAGE is configured"
fi

if [ -z "$INQ_CLIENT_SECRET_PROD" ]; then
    echo "❌ INQ_CLIENT_SECRET_PROD not set"
else
    echo "✅ INQ_CLIENT_SECRET_PROD is configured"
fi

echo ""
echo "Ready to run: npm run dev"
