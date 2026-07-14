#!/bin/bash

# Frontend Migration to Render Script
echo "🚀 Starting Frontend Migration to Render..."

# Step 1: Create production build
echo "📦 Building React app for production..."
npm run build

# Step 2: Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful!"
    echo "📁 Build files ready in /build directory"
else
    echo "❌ Build failed!"
    exit 1
fi

# Step 3: Show build summary
echo "📊 Build Summary:"
echo "   - Build directory: $(du -sh build | cut -f1)"
echo "   - Files created: $(find build -type f | wc -l)"
echo "   - Ready for Render deployment!"

# Step 4: Instructions for Render
echo ""
echo "🎯 Next Steps for Render Deployment:"
echo "   1. Go to Render Dashboard"
echo "   2. Create New Web Service"
echo "   3. Connect your GitHub repository"
echo "   4. Use 'render-frontend.yaml' configuration"
echo "   5. Set environment variables"
echo "   6. Deploy! 🚀"
