#!/bin/bash

# ============================================================================
# PropertyArk EAS Cloud Build Script
# ============================================================================
# Submits a build to EAS (Expo Application Services) for cloud building
# Usage: ./scripts/build-eas.sh [profile] [platform]
# Examples:
#   ./scripts/build-eas.sh development android
#   ./scripts/build-eas.sh staging ios
#   ./scripts/build-eas.sh production all
# ============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Source the build utilities
source "$SCRIPT_DIR/build-utils.sh"

# ============================================================================
# Configuration
# ============================================================================

BUILD_PROFILE="${1:-development}"
PLATFORM="${2:-all}"

# Validate profile
case "$BUILD_PROFILE" in
  development|staging|production)
    ;;
  *)
    log_error "Invalid build profile: $BUILD_PROFILE"
    log_info "Valid profiles: development, staging, production"
    exit 1
    ;;
esac

# Validate platform
case "$PLATFORM" in
  android|ios|all)
    ;;
  *)
    log_error "Invalid platform: $PLATFORM"
    log_info "Valid platforms: android, ios, all"
    exit 1
    ;;
esac

# ============================================================================
# Main Build Process
# ============================================================================

main() {
  log_info "Starting PropertyArk EAS Cloud Build..."
  log_info "Project root: $PROJECT_ROOT"
  log_info "Build profile: $BUILD_PROFILE"
  log_info "Platform: $PLATFORM"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Step 1: Validate environment
  log_info "Step 1: Validating environment..."
  validate_env_file || exit 1
  load_env_file

  # Step 2: Validate EAS CLI
  log_info "Step 2: Validating EAS CLI..."
  if ! command -v eas &> /dev/null; then
    log_error "EAS CLI not found. Please install it with: npm install -g eas-cli"
    exit 1
  fi
  log_success "EAS CLI is installed"

  # Step 3: Validate EAS configuration
  log_info "Step 3: Validating EAS configuration..."
  if [ ! -f "eas.json" ]; then
    log_error "eas.json not found"
    exit 1
  fi
  log_success "EAS configuration found"

  # Step 4: Validate Capacitor configuration
  log_info "Step 4: Validating Capacitor configuration..."
  validate_capacitor_config || exit 1

  # Step 5: Install dependencies
  log_info "Step 5: Installing dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install || exit 1
  fi
  log_success "Dependencies installed"

  # Step 6: Build web assets
  log_info "Step 6: Building web assets..."
  npm run build || exit 1
  log_success "Web assets built"

  # Step 7: Sync Capacitor
  log_info "Step 7: Syncing Capacitor..."
  sync_capacitor || exit 1

  # Step 8: Check EAS login
  log_info "Step 8: Checking EAS authentication..."
  if ! eas whoami > /dev/null 2>&1; then
    log_warning "Not logged in to EAS. Please log in..."
    eas login || exit 1
  fi
  log_success "EAS authentication verified"

  # Step 9: Submit build to EAS
  log_info "Step 9: Submitting build to EAS..."
  
  case "$PLATFORM" in
    android)
      log_info "Building for Android..."
      eas build --platform android --profile "$BUILD_PROFILE" || exit 1
      ;;
    ios)
      log_info "Building for iOS..."
      eas build --platform ios --profile "$BUILD_PROFILE" || exit 1
      ;;
    all)
      log_info "Building for all platforms..."
      eas build --platform all --profile "$BUILD_PROFILE" || exit 1
      ;;
  esac

  # Success
  log_success "EAS build submitted successfully!"
  log_info "You can monitor the build progress at: https://expo.dev/builds"
  log_info "Build profile: $BUILD_PROFILE"
  log_info "Platform: $PLATFORM"
}

# Run main function
main "$@"
