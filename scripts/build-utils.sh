#!/bin/bash

# ============================================================================
# PropertyArk Mobile Build Utilities
# ============================================================================
# Common functions and utilities for mobile build scripts
# ============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Logging Functions
# ============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# Environment Validation Functions
# ============================================================================

validate_env_file() {
  if [ ! -f ".env.local" ]; then
    log_error ".env.local file not found"
    log_info "Please copy .env.example to .env.local and fill in the required values"
    return 1
  fi
  log_success ".env.local file found"
  return 0
}

load_env_file() {
  if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    log_success "Environment variables loaded from .env.local"
  else
    log_warning "No .env.local file found, using system environment variables"
  fi
}

validate_required_env_vars() {
  local required_vars=("$@")
  local missing_vars=()

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done

  if [ ${#missing_vars[@]} -gt 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    return 1
  fi

  log_success "All required environment variables are set"
  return 0
}

# ============================================================================
# Capacitor Functions
# ============================================================================

validate_capacitor_config() {
  log_info "Validating Capacitor configuration..."
  
  if [ ! -f "capacitor.config.ts" ]; then
    log_error "capacitor.config.ts not found"
    return 1
  fi

  if ! npx capacitor --version > /dev/null 2>&1; then
    log_error "Capacitor CLI not found. Please install it with: npm install -g @capacitor/cli"
    return 1
  fi

  log_success "Capacitor configuration is valid"
  return 0
}

sync_capacitor() {
  log_info "Syncing Capacitor web assets to native projects..."
  
  if ! npx capacitor sync; then
    log_error "Capacitor sync failed"
    return 1
  fi

  log_success "Capacitor sync completed successfully"
  return 0
}

# ============================================================================
# Android Functions
# ============================================================================

validate_android_sdk() {
  log_info "Validating Android SDK..."

  if [ -z "$ANDROID_SDK_ROOT" ] && [ -z "$ANDROID_HOME" ]; then
    log_error "ANDROID_SDK_ROOT or ANDROID_HOME environment variable not set"
    return 1
  fi

  local sdk_path="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

  if [ ! -d "$sdk_path" ]; then
    log_error "Android SDK not found at: $sdk_path"
    return 1
  fi

  log_success "Android SDK found at: $sdk_path"
  return 0
}

validate_gradle() {
  log_info "Validating Gradle..."

  if ! command -v gradle &> /dev/null && ! [ -f "android/gradlew" ]; then
    log_error "Gradle not found. Please install Android SDK or ensure gradlew exists"
    return 1
  fi

  log_success "Gradle is available"
  return 0
}

build_android_debug() {
  log_info "Building Android debug APK..."

  if [ ! -d "android" ]; then
    log_error "Android project directory not found"
    return 1
  fi

  cd android
  if [ -f "gradlew" ]; then
    ./gradlew assembleDebug
  else
    gradle assembleDebug
  fi
  cd ..

  log_success "Android debug APK built successfully"
  return 0
}

build_android_release() {
  log_info "Building Android release APK..."

  if [ ! -d "android" ]; then
    log_error "Android project directory not found"
    return 1
  fi

  cd android
  if [ -f "gradlew" ]; then
    ./gradlew assembleRelease
  else
    gradle assembleRelease
  fi
  cd ..

  log_success "Android release APK built successfully"
  return 0
}

# ============================================================================
# iOS Functions
# ============================================================================

validate_xcode() {
  log_info "Validating Xcode..."

  if ! command -v xcode-select &> /dev/null; then
    log_error "Xcode not found. Please install Xcode from the App Store"
    return 1
  fi

  local xcode_version=$(xcode-select --version)
  log_success "Xcode found: $xcode_version"
  return 0
}

validate_cocoapods() {
  log_info "Validating CocoaPods..."

  if ! command -v pod &> /dev/null; then
    log_error "CocoaPods not found. Please install it with: sudo gem install cocoapods"
    return 1
  fi

  log_success "CocoaPods is installed"
  return 0
}

build_ios_debug() {
  log_info "Building iOS debug app..."

  if [ ! -d "ios" ]; then
    log_error "iOS project directory not found"
    return 1
  fi

  cd ios/App
  xcodebuild -scheme App -configuration Debug -derivedDataPath build
  cd ../..

  log_success "iOS debug app built successfully"
  return 0
}

build_ios_release() {
  log_info "Building iOS release app..."

  if [ ! -d "ios" ]; then
    log_error "iOS project directory not found"
    return 1
  fi

  cd ios/App
  xcodebuild -scheme App -configuration Release -derivedDataPath build
  cd ../..

  log_success "iOS release app built successfully"
  return 0
}

# ============================================================================
# Artifact Functions
# ============================================================================

collect_android_artifacts() {
  log_info "Collecting Android build artifacts..."

  local apk_path="android/app/build/outputs/apk/debug/app-debug.apk"
  local aab_path="android/app/build/outputs/bundle/release/app-release.aab"

  if [ -f "$apk_path" ]; then
    log_success "Found debug APK: $apk_path"
  fi

  if [ -f "$aab_path" ]; then
    log_success "Found release AAB: $aab_path"
  fi

  return 0
}

collect_ios_artifacts() {
  log_info "Collecting iOS build artifacts..."

  local app_path="ios/App/build/Debug-iphoneos/App.app"
  local ipa_path="ios/App/build/Release-iphoneos/App.ipa"

  if [ -d "$app_path" ]; then
    log_success "Found debug app: $app_path"
  fi

  if [ -f "$ipa_path" ]; then
    log_success "Found release IPA: $ipa_path"
  fi

  return 0
}

# ============================================================================
# Error Handling
# ============================================================================

handle_error() {
  local line_number=$1
  local error_message=$2
  log_error "Build failed at line $line_number: $error_message"
  exit 1
}

# Set error trap
trap 'handle_error ${LINENO} "$BASH_COMMAND"' ERR

# ============================================================================
# Export functions for use in other scripts
# ============================================================================

export -f log_info
export -f log_success
export -f log_warning
export -f log_error
export -f validate_env_file
export -f load_env_file
export -f validate_required_env_vars
export -f validate_capacitor_config
export -f sync_capacitor
export -f validate_android_sdk
export -f validate_gradle
export -f build_android_debug
export -f build_android_release
export -f validate_xcode
export -f validate_cocoapods
export -f build_ios_debug
export -f build_ios_release
export -f collect_android_artifacts
export -f collect_ios_artifacts
export -f handle_error
