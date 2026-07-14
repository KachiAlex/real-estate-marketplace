#!/bin/bash

echo "🏠 Starting PropertyArk Local Development"

# Start Backend
echo "🔧 Starting Backend..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

# Start Frontend
echo "📱 Starting Frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

# Start Mobile App (if needed)
echo "📲 Starting Mobile App..."
cd ../mobile-app
npm install
npx expo start &
MOBILE_PID=$!

echo "✅ All services started!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Mobile: Check Expo QR code"

# Wait for user to stop
read -p "Press Enter to stop all services..."

# Cleanup
kill $BACKEND_PID $FRONTEND_PID $MOBILE_PID
echo "🛑 All services stopped"
