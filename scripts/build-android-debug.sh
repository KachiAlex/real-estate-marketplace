#!/bin/bash

# ============================================================================
# PropertyArk Android Debug Build Script
# ============================================================================
# Builds a debug APK for Android development and testing
# Usage: ./scripts/build-android-debug.sh
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
  log_info "Starting PropertyArk Android Debug Build..."
  log_info "Project root: $PROJECT_ROOT"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Step 1: Validate environment
  log_info "Step 1: Validating environment..."
  validate_env_file || exit 1
  load_env_file

  # Step 2: Validate Android SDK
  log_info "Step 2: Validating Android SDK..."
  validate_android_sdk || exit 1

  # Step 3: Validate Gradle
  log_info "Step 3: Validating Gradle..."
  validate_gradle || exit 1

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

  # Step 8: Build Android debug APK
  log_info "Step 8: Building Android debug APK..."
  build_android_debug || exit 1

  # Step 9: Collect artifacts
  log_info "Step 9: Collecting build artifacts..."
  collect_android_artifacts || exit 1

  # Success
  log_success "Android debug build completed successfully!"
  log_info "Debug APK location: android/app/build/outputs/apk/debug/app-debug.apk"
  log_info "You can now install the APK on an Android device or emulator"
  log_info "Command: adb install android/app/build/outputs/apk/debug/app-debug.apk"
}

# Run main function
main "$@"
