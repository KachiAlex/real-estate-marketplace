#!/bin/bash

# ============================================================================
# PropertyArk Android Release Build Script
# ============================================================================
# Builds a release APK/AAB for Android production deployment
# Usage: ./scripts/build-android-release.sh
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
  log_info "Starting PropertyArk Android Release Build..."
  log_info "Project root: $PROJECT_ROOT"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Step 1: Validate environment
  log_info "Step 1: Validating environment..."
  validate_env_file || exit 1
  load_env_file

  # Step 2: Validate required environment variables for release build
  log_info "Step 2: Validating release build configuration..."
  validate_required_env_vars "ANDROID_KEYSTORE_PATH" "ANDROID_KEYSTORE_PASSWORD" "ANDROID_KEY_ALIAS" "ANDROID_KEY_PASSWORD" || {
    log_warning "Some keystore variables are not set. Release build may fail."
    log_info "Please set the following environment variables in .env.local:"
    log_info "  - ANDROID_KEYSTORE_PATH"
    log_info "  - ANDROID_KEYSTORE_PASSWORD"
    log_info "  - ANDROID_KEY_ALIAS"
    log_info "  - ANDROID_KEY_PASSWORD"
  }

  # Step 3: Validate Android SDK
  log_info "Step 3: Validating Android SDK..."
  validate_android_sdk || exit 1

  # Step 4: Validate Gradle
  log_info "Step 4: Validating Gradle..."
  validate_gradle || exit 1

  # Step 5: Validate Capacitor configuration
  log_info "Step 5: Validating Capacitor configuration..."
  validate_capacitor_config || exit 1

  # Step 6: Install dependencies
  log_info "Step 6: Installing dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install || exit 1
  fi
  log_success "Dependencies installed"

  # Step 7: Build web assets for production
  log_info "Step 7: Building web assets for production..."
  NODE_ENV=production npm run build || exit 1
  log_success "Production web assets built"

  # Step 8: Sync Capacitor
  log_info "Step 8: Syncing Capacitor..."
  sync_capacitor || exit 1

  # Step 9: Build Android release APK
  log_info "Step 9: Building Android release APK..."
  build_android_release || exit 1

  # Step 10: Collect artifacts
  log_info "Step 10: Collecting build artifacts..."
  collect_android_artifacts || exit 1

  # Success
  log_success "Android release build completed successfully!"
  log_info "Release APK location: android/app/build/outputs/apk/release/app-release.apk"
  log_info "Release AAB location: android/app/build/outputs/bundle/release/app-release.aab"
  log_info "The AAB file can be uploaded to Google Play Console"
}

# Run main function
main "$@"
