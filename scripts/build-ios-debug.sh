#!/bin/bash

# ============================================================================
# PropertyArk iOS Debug Build Script
# ============================================================================
# Builds a debug app for iOS development and testing
# Usage: ./scripts/build-ios-debug.sh
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
  log_info "Starting PropertyArk iOS Debug Build..."
  log_info "Project root: $PROJECT_ROOT"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Step 1: Validate environment
  log_info "Step 1: Validating environment..."
  validate_env_file || exit 1
  load_env_file

  # Step 2: Validate Xcode
  log_info "Step 2: Validating Xcode..."
  validate_xcode || exit 1

  # Step 3: Validate CocoaPods
  log_info "Step 3: Validating CocoaPods..."
  validate_cocoapods || exit 1

  # Step 4: Validate Capacitor configuration
  log_info "Step 4: Validating Capacitor configuration..."
  validate_capacitor_config || exit 1

  # Step 5: Install dependencies
  log_info "Step 5: Installing dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install || exit 1
  fi
  log_success "Dependencies installed"

  # Step 6: Install CocoaPods dependencies
  log_info "Step 6: Installing CocoaPods dependencies..."
  if [ -d "ios/App" ]; then
    cd ios/App
    pod install || exit 1
    cd ../..
    log_success "CocoaPods dependencies installed"
  fi

  # Step 7: Build web assets
  log_info "Step 7: Building web assets..."
  npm run build || exit 1
  log_success "Web assets built"

  # Step 8: Sync Capacitor
  log_info "Step 8: Syncing Capacitor..."
  sync_capacitor || exit 1

  # Step 9: Build iOS debug app
  log_info "Step 9: Building iOS debug app..."
  build_ios_debug || exit 1

  # Step 10: Collect artifacts
  log_info "Step 10: Collecting build artifacts..."
  collect_ios_artifacts || exit 1

  # Success
  log_success "iOS debug build completed successfully!"
  log_info "Debug app location: ios/App/build/Debug-iphoneos/App.app"
  log_info "You can now run the app on an iOS simulator or device"
  log_info "Command: xcrun simctl install booted ios/App/build/Debug-iphoneos/App.app"
}

# Run main function
main "$@"
