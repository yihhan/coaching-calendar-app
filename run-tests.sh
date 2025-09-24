#!/bin/bash

echo "🧪 Running Coaching Calendar App Tests"
echo "======================================"

# Install dependencies if needed
echo "📦 Installing dependencies..."
cd client && npm install --silent
cd ../server && npm install --silent
cd ..

echo ""
echo "🔬 Running Frontend Tests..."
echo "----------------------------"
cd client
npm test -- --watchAll=false --coverage --silent
FRONTEND_EXIT_CODE=$?
cd ..

echo ""
echo "🔬 Running Backend Tests..."
echo "---------------------------"
cd server
npm test -- --coverage --silent
BACKEND_EXIT_CODE=$?
cd ..

echo ""
echo "📊 Test Results Summary"
echo "========================"

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo "✅ Frontend tests: PASSED"
else
    echo "❌ Frontend tests: FAILED"
fi

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo "✅ Backend tests: PASSED"
else
    echo "❌ Backend tests: FAILED"
fi

if [ $FRONTEND_EXIT_CODE -eq 0 ] && [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed!"
    exit 0
else
    echo ""
    echo "💥 Some tests failed!"
    exit 1
fi
