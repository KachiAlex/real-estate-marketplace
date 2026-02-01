#!/bin/bash
set -euo pipefail

# Cloud Shell deployment script for real-estate-marketplace
# Run in Google Cloud Shell after enabling Firebase and setting project

echo "🔧 Setting up Cloud Shell environment..."

# Install Node.js 20 (Cloud Shell defaults to 18)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Firebase CLI
npm install -g firebase-tools

# Authenticate Firebase (only needed once per session)
firebase login --no-localhost

echo "📦 Cloning repo and installing dependencies..."
git clone https://github.com/KachiAlex/real-estate-marketplace.git
cd real-estate-marketplace

# Install root dependencies
npm ci

# Install functions dependencies
cd functions && npm ci && cd ..

echo "🏗️ Building React app..."
npm run build

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Hosting deployed. To deploy functions after network stabilizes:"
echo "   firebase deploy --only functions"
echo ""
echo "📝 After successful functions deploy, re-enable routes by:"
echo "   cd functions"
echo "   git checkout HEAD~1 -- index.js  # or manually uncomment routes"
echo "   firebase deploy --only functions"
