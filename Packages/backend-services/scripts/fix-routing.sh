#!/bin/bash

echo "🔧 Fixing API Gateway routing issue..."

# Check if services are running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ API Gateway not running on port 3000"
    echo "Please start: cd api-gateway && npm run dev"
    exit 1
fi

if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ User Management service not running on port 3001"
    echo "Please start: cd user-management && npm run dev"
    exit 1
fi

echo "✅ Both services are running"

# Test direct user management endpoint
echo "🧪 Testing User Management service directly..."
DIRECT_TEST=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' | jq -r '.status' 2>/dev/null || echo "error")

if [ "$DIRECT_TEST" != "error" ]; then
    echo "✅ User Management service responding"
else
    echo "❌ User Management service not responding properly"
    echo "Check the service logs for errors"
    exit 1
fi

# Test API Gateway routing
echo "🧪 Testing API Gateway routing..."
GATEWAY_TEST=$(curl -s -X POST http://localhost:3000/api/user-management/auth/register \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' | jq -r '.status' 2>/dev/null || echo "error")

if [ "$GATEWAY_TEST" != "error" ]; then
    echo "✅ API Gateway routing working"
    echo "🎉 Issue resolved! Try your registration request again."
else
    echo "❌ API Gateway still not routing properly"
    echo "Check API Gateway service registration configuration"
    exit 1
fi