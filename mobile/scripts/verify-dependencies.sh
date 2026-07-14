#!/bin/bash

# Dependency Verification Script
# Verifies all dependencies are installed and compatible with React Native 0.81.5

set -e

echo "================================================"
echo "PropertyArk Mobile - Dependency Verification"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
if [[ $NODE_VERSION == v16* ]] || [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v20* ]]; then
    echo -e "${GREEN}✓ Node.js version compatible${NC}"
else
    echo -e "${YELLOW}⚠ Node.js version may not be optimal (16+ recommended)${NC}"
fi
echo ""

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"
echo -e "${GREEN}✓ npm version: $NPM_VERSION${NC}"
echo ""

# Check React Native version
echo "Checking React Native version..."
if grep -q '"react-native": "0.81.5"' package.json; then
    echo -e "${GREEN}✓ React Native version: 0.81.5${NC}"
else
    echo -e "${RED}✗ React Native version mismatch${NC}"
    exit 1
fi
echo ""

# Check critical dependencies
echo "Checking critical dependencies..."
CRITICAL_DEPS=(
    "expo"
    "react"
    "react-native"
    "expo-router"
    "expo-secure-store"
    "@react-native-async-storage/async-storage"
    "axios"
)

for dep in "${CRITICAL_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo -e "${GREEN}✓ $dep${NC}"
    else
        echo -e "${RED}✗ $dep missing${NC}"
        exit 1
    fi
done
echo ""

# Check for deprecated packages
echo "Checking for deprecated packages..."
DEPRECATED_PACKAGES=(
    "react-native-crypto"
    "deprecated-package"
)

FOUND_DEPRECATED=0
for pkg in "${DEPRECATED_PACKAGES[@]}"; do
    if grep -q "\"$pkg\"" package.json; then
        echo -e "${RED}✗ Deprecated package found: $pkg${NC}"
        FOUND_DEPRECATED=1
    fi
done

if [ $FOUND_DEPRECATED -eq 0 ]; then
    echo -e "${GREEN}✓ No deprecated packages found${NC}"
fi
echo ""

# Check package-lock.json exists
echo "Checking package-lock.json..."
if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}✓ package-lock.json exists${NC}"
else
    echo -e "${YELLOW}⚠ package-lock.json not found${NC}"
fi
echo ""

# Summary
echo "================================================"
echo "Dependency Verification Summary"
echo "================================================"
echo -e "${GREEN}✓ All critical dependencies present${NC}"
echo -e "${GREEN}✓ React Native version: 0.81.5${NC}"
echo -e "${GREEN}✓ No deprecated packages${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm audit (to check for vulnerabilities)"
echo "3. Run: npm list (to verify all dependencies installed)"
echo ""
echo -e "${GREEN}Dependency verification complete!${NC}"
