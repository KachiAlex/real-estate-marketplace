#!/bin/bash

echo "🚨 Emergency Deployment Script (No GitHub Required)"

# Configuration
FRONTEND_DIR="./frontend"
BACKEND_DIR="./backend"
DEPLOY_HOST="your-server.com"
DEPLOY_USER="username"

echo "📦 Building Frontend..."
cd $FRONTEND_DIR
npm install
npm run build

echo "📦 Building Backend..."
cd ../$BACKEND_DIR
npm install
npm run build

echo "🚀 Deploying to server..."

# Option 1: SCP deployment
# scp -r build/* $DEPLOY_USER@$DEPLOY_HOST:/var/www/frontend/
# scp -r dist/* $DEPLOY_USER@$DEPLOY_HOST:/var/www/backend/

# Option 2: Docker deployment
docker-compose -f deploy-docker.yml up -d

echo "✅ Emergency deployment completed!"
echo "🌐 Access your app at: http://$DEPLOY_HOST"
