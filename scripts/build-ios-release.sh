#!/bin/bash

# ============================================================================
# PropertyArk iOS Release Build Script
# ============================================================================
# Builds a release IPA for iOS production deployment
# Usage: ./scripts/build-ios-release.sh
# ============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Source the build utilities
source "$SCRIPT_DIR/build-utils.sh"

# ============================================================================
# Main Build Process
# ============================================================================

main() {
  log_info "Starting PropertyArk iOS Release Build..."
  log_info "Project root: $PROJECT_ROOT"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Step 1: Validate environment
  log_info "Step 1: Validating environment..."
  validate_env_file || exit 1
  load_env_file

  # Step 2: Validate required environment variables for release build
  log_info "Step 2: Validating release build configuration..."
  validate_required_env_vars "IOS_TEAM_ID" "IOS_CERTIFICATE_ID" "IOS_PROVISIONING_PROFILE_ID" || {
    log_warning "Some iOS code signing variables are not set. Release build may fail."
    log_info "Please set the following environment variables in .env.local:"
    log_info "  - IOS_TEAM_ID"
    log_info "  - IOS_CERTIFICATE_ID"
    log_info "  - IOS_PROVISIONING_PROFILE_ID"
  }

  # Step 3: Validate Xcode
  log_info "Step 3: Validating Xcode..."
  validate_xcode || exit 1

  # Step 4: Validate CocoaPods
  log_info "Step 4: Validating CocoaPods..."
  validate_cocoapods || exit 1

  # Step 5: Validate Capacitor configuration
  log_info "Step 5: Validating Capacitor configuration..."
  validate_capacitor_config || exit 1

  # Step 6: Install dependencies
  log_info "Step 6: Installing dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install || exit 1
  fi
  log_success "Dependencies installed"

  # Step 7: Install CocoaPods dependencies
  log_info "Step 7: Installing CocoaPods dependencies..."
  if [ -d "ios/App" ]; then
    cd ios/App
    pod install || exit 1
    cd ../..
    log_success "CocoaPods dependencies installed"
  fi

  # Step 8: Build web assets for production
  log_info "Step 8: Building web assets for production..."
  NODE_ENV=production npm run build || exit 1
  log_success "Production web assets built"

  # Step 9: Sync Capacitor
  log_info "Step 9: Syncing Capacitor..."
  sync_capacitor || exit 1

  # Step 10: Build iOS release app
  log_info "Step 10: Building iOS release app..."
  build_ios_release || exit 1

  # Step 11: Collect artifacts
  log_info "Step 11: Collecting build artifacts..."
  collect_ios_artifacts || exit 1

  # Success
  log_success "iOS release build completed successfully!"
  log_info "Release app location: ios/App/build/Release-iphoneos/App.app"
  log_info "Release IPA location: ios/App/build/Release-iphoneos/App.ipa"
  log_info "The IPA file can be uploaded to App Store Connect"
}

# Run main function
main "$@"
