#!/bin/bash

echo "🚀 Manual Deployment Script for PropertyArk"

# Frontend Deployment (Vercel Manual)
echo "📱 Deploying Frontend to Vercel..."
cd frontend
npm run build
npx vercel --prod --confirm
echo "✅ Frontend deployed successfully!"

# Backend Deployment (Railway/Render)
echo "🔧 Deploying Backend..."
cd ../backend
npm run build

# Option 1: Railway
railway login
railway up

# Option 2: Render (manual upload)
# echo "📤 Upload backend build to Render dashboard manually"

echo "✅ Deployment completed!"
echo "Frontend URL: Check Vercel dashboard"
echo "Backend URL: Check Railway/Render dashboard"
