#!/bin/bash

# ============================================================================
# PropertyArk Capacitor Sync Script
# ============================================================================
# Syncs web assets to native Android and iOS projects
# Usage: ./scripts/sync-capacitor.sh
# ============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Source the build utilities
source "$SCRIPT_DIR/build-utils.sh"

# ============================================================================
# Main Sync Process
# ============================================================================

main() {
  log_info "Starting Capacitor Sync..."
  log_info "Project root: $PROJECT_ROOT"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Step 1: Validate environment
  log_info "Step 1: Validating environment..."
  validate_env_file || exit 1
  load_env_file

  # Step 2: Validate Capacitor configuration
  log_info "Step 2: Validating Capacitor configuration..."
  validate_capacitor_config || exit 1

  # Step 3: Install dependencies
  log_info "Step 3: Installing dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install || exit 1
  fi
  log_success "Dependencies installed"

  # Step 4: Build web assets
  log_info "Step 4: Building web assets..."
  npm run build || exit 1
  log_success "Web assets built"

  # Step 5: Sync Capacitor
  log_info "Step 5: Syncing Capacitor..."
  sync_capacitor || exit 1

  # Success
  log_success "Capacitor sync completed successfully!"
  log_info "Web assets have been synced to native projects"
  log_info "Android project: android/"
  log_info "iOS project: ios/"
}

# Run main function
main "$@"
