#!/bin/bash

# ============================================================================
# PropertyArk Setup Validation Script
# ============================================================================
# Validates the complete mobile development environment setup
# Usage: ./scripts/validate-setup.sh
# ============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Source the build utilities
source "$SCRIPT_DIR/build-utils.sh"

# ============================================================================
# Validation Counters
# ============================================================================

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# ============================================================================
# Validation Helper Functions
# ============================================================================

check_pass() {
  local check_name=$1
  log_success "✓ $check_name"
  ((PASSED_CHECKS++))
  ((TOTAL_CHECKS++))
}

check_fail() {
  local check_name=$1
  local error_message=$2
  log_error "✗ $check_name"
  if [ -n "$error_message" ]; then
    log_info "  Reason: $error_message"
  fi
  ((FAILED_CHECKS++))
  ((TOTAL_CHECKS++))
}

check_warning() {
  local check_name=$1
  local warning_message=$2
  log_warning "⚠ $check_name"
  if [ -n "$warning_message" ]; then
    log_info "  Note: $warning_message"
  fi
  ((WARNING_CHECKS++))
  ((TOTAL_CHECKS++))
}

# ============================================================================
# Environment Validation
# ============================================================================

validate_environment() {
  log_info ""
  log_info "=========================================="
  log_info "Environment Validation"
  log_info "=========================================="

  # Check .env.local
  if [ -f ".env.local" ]; then
    check_pass ".env.local file exists"
  else
    check_warning ".env.local file not found" "Using system environment variables"
  fi

  # Check Node.js
  if command -v node &> /dev/null; then
    local node_version=$(node --version)
    check_pass "Node.js installed ($node_version)"
  else
    check_fail "Node.js not installed" "Please install Node.js from https://nodejs.org"
  fi

  # Check npm
  if command -v npm &> /dev/null; then
    local npm_version=$(npm --version)
    check_pass "npm installed ($npm_version)"
  else
    check_fail "npm not installed" "npm should be installed with Node.js"
  fi

  # Check git
  if command -v git &> /dev/null; then
    local git_version=$(git --version)
    check_pass "Git installed ($git_version)"
  else
    check_fail "Git not installed" "Please install Git from https://git-scm.com"
  fi
}

# ============================================================================
# Configuration Validation
# ============================================================================

validate_configuration() {
  log_info ""
  log_info "=========================================="
  log_info "Configuration Validation"
  log_info "=========================================="

  # Check capacitor.config.ts
  if [ -f "capacitor.config.ts" ]; then
    check_pass "capacitor.config.ts exists"
  else
    check_fail "capacitor.config.ts not found" "Run: npm run build to generate it"
  fi

  # Check eas.json
  if [ -f "eas.json" ]; then
    check_pass "eas.json exists"
  else
    check_fail "eas.json not found" "EAS configuration is required for cloud builds"
  fi

  # Check app.json
  if [ -f "app.json" ]; then
    check_pass "app.json exists"
  else
    check_fail "app.json not found" "Expo configuration is required"
  fi

  # Check package.json
  if [ -f "package.json" ]; then
    check_pass "package.json exists"
  else
    check_fail "package.json not found" "Project configuration is missing"
  fi
}

# ============================================================================
# Dependency Validation
# ============================================================================

validate_dependencies() {
  log_info ""
  log_info "=========================================="
  log_info "Dependency Validation"
  log_info "=========================================="

  # Check node_modules
  if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
  else
    check_warning "node_modules directory not found" "Run: npm install"
  fi

  # Check Capacitor CLI
  if command -v capacitor &> /dev/null || npx capacitor --version > /dev/null 2>&1; then
    check_pass "Capacitor CLI available"
  else
    check_warning "Capacitor CLI not found" "Run: npm install -g @capacitor/cli"
  fi

  # Check EAS CLI
  if command -v eas &> /dev/null; then
    check_pass "EAS CLI installed"
  else
    check_warning "EAS CLI not installed" "Run: npm install -g eas-cli"
  fi
}

# ============================================================================
# Android Validation
# ============================================================================

validate_android() {
  log_info ""
  log_info "=========================================="
  log_info "Android Development Environment"
  log_info "=========================================="

  # Check Android SDK
  if [ -n "$ANDROID_SDK_ROOT" ] || [ -n "$ANDROID_HOME" ]; then
    local sdk_path="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
    if [ -d "$sdk_path" ]; then
      check_pass "Android SDK found at: $sdk_path"
    else
      check_fail "Android SDK path not found" "Set ANDROID_SDK_ROOT or ANDROID_HOME"
    fi
  else
    check_warning "Android SDK environment variables not set" "Set ANDROID_SDK_ROOT or ANDROID_HOME"
  fi

  # Check Gradle
  if command -v gradle &> /dev/null; then
    local gradle_version=$(gradle --version | head -1)
    check_pass "Gradle installed ($gradle_version)"
  elif [ -f "android/gradlew" ]; then
    check_pass "Gradle wrapper found (android/gradlew)"
  else
    check_warning "Gradle not found" "Install Android SDK or ensure gradlew exists"
  fi

  # Check Android project
  if [ -d "android" ]; then
    check_pass "Android project directory exists"
  else
    check_warning "Android project directory not found" "Run: npx capacitor add android"
  fi
}

# ============================================================================
# iOS Validation
# ============================================================================

validate_ios() {
  log_info ""
  log_info "=========================================="
  log_info "iOS Development Environment"
  log_info "=========================================="

  # Check Xcode
  if command -v xcode-select &> /dev/null; then
    local xcode_version=$(xcode-select --version)
    check_pass "Xcode found ($xcode_version)"
  else
    check_fail "Xcode not found" "Install Xcode from the App Store"
  fi

  # Check CocoaPods
  if command -v pod &> /dev/null; then
    local pod_version=$(pod --version)
    check_pass "CocoaPods installed ($pod_version)"
  else
    check_warning "CocoaPods not installed" "Run: sudo gem install cocoapods"
  fi

  # Check iOS project
  if [ -d "ios" ]; then
    check_pass "iOS project directory exists"
  else
    check_warning "iOS project directory not found" "Run: npx capacitor add ios"
  fi

  # Check Podfile
  if [ -f "ios/App/Podfile" ]; then
    check_pass "Podfile exists"
  else
    check_warning "Podfile not found" "Run: npx capacitor add ios"
  fi
}

# ============================================================================
# Build Scripts Validation
# ============================================================================

validate_build_scripts() {
  log_info ""
  log_info "=========================================="
  log_info "Build Scripts Validation"
  log_info "=========================================="

  local scripts=(
    "scripts/build-utils.sh"
    "scripts/build-android-debug.sh"
    "scripts/build-android-release.sh"
    "scripts/build-ios-debug.sh"
    "scripts/build-ios-release.sh"
    "scripts/build-eas.sh"
    "scripts/sync-capacitor.sh"
    "scripts/validate-setup.sh"
  )

  for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
      if [ -x "$script" ]; then
        check_pass "$script exists and is executable"
      else
        check_warning "$script exists but is not executable" "Run: chmod +x $script"
      fi
    else
      check_fail "$script not found" "Build script is missing"
    fi
  done
}

# ============================================================================
# Summary Report
# ============================================================================

print_summary() {
  log_info ""
  log_info "=========================================="
  log_info "Validation Summary"
  log_info "=========================================="
  log_info "Total checks: $TOTAL_CHECKS"
  log_success "Passed: $PASSED_CHECKS"
  if [ $WARNING_CHECKS -gt 0 ]; then
    log_warning "Warnings: $WARNING_CHECKS"
  fi
  if [ $FAILED_CHECKS -gt 0 ]; then
    log_error "Failed: $FAILED_CHECKS"
  fi

  log_info ""
  if [ $FAILED_CHECKS -eq 0 ]; then
    log_success "Setup validation completed successfully!"
    if [ $WARNING_CHECKS -gt 0 ]; then
      log_warning "Please address the warnings above for optimal development experience"
    fi
    return 0
  else
    log_error "Setup validation failed. Please fix the errors above."
    return 1
  fi
}

# ============================================================================
# Main Validation Process
# ============================================================================

main() {
  log_info "PropertyArk Mobile Development Setup Validation"
  log_info "Project root: $PROJECT_ROOT"

  # Change to project root
  cd "$PROJECT_ROOT"

  # Run all validations
  validate_environment
  validate_configuration
  validate_dependencies
  validate_android
  validate_ios
  validate_build_scripts

  # Print summary
  print_summary
}

# Run main function
main "$@"
