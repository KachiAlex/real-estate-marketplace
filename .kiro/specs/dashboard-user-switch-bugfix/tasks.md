# Implementation Plan

## Phase 1: Exploration - Surface the Bug

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - User Identity Preservation After Login
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - **Scoped Test Case** (single concrete example for speed):
    - Simulate login with Onyedika (id: "53e4eb26-8b1c-460d-80d3-c8d166ffaa7d", email: "onyedika@example.com", roles: ["buyer", "vendor"])
    - Verify that after successful login, currentUser.id remains "53e4eb26-8b1c-460d-80d3-c8d166ffaa7d"
    - Verify that currentUser.email remains "onyedika@example.com"
    - Verify that dashboard does NOT switch to a different user
    - Verify that switchRole is NOT called unexpectedly during login
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document the failure:
    - Does currentUser.id change after login?
    - Is switchRole being called during login?
    - What is the final user displayed?
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

## Phase 2: Preservation - Capture Existing Behavior

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Manual Role Switching and Auto-Sync Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (manual role switches, route navigation, logout)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Manual role switching via "Switch Dashboard" button works correctly
    - Users with multiple roles can switch between their available dashboards
    - Auto-sync based on route navigation works (e.g., navigating to `/vendor/dashboard` auto-syncs to vendor role)
    - Users with only one role do not see the DashboardSwitch component
    - Logout clears all authentication data properly
  - **Scoped Test Cases** (3 core scenarios for speed):
    1. **Manual Role Switch**: User with buyer+vendor roles clicks "Switch Dashboard" to vendor → verify switchRole is called with "vendor" → verify user identity is preserved
    2. **Auto-Sync on Route**: User navigates to `/vendor/dashboard` → verify auto-sync triggers → verify user identity is preserved
    3. **Logout**: User clicks logout → verify currentUser is cleared
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Implementation - Apply the Fix

- [x] 3. Fix for dashboard user switch issue

  - [x] 3.1 Implement the fix
    - **File**: `src/contexts/AuthContext-new.js`
      - Add user identity guard in `switchRole` method: Before calling `/api/users/switch-role`, verify that the role being switched to is actually in the user's roles array. If not, log a warning and skip the switch.
      - Prevent user data overwrite: When normalizing the response from `/api/users/switch-role`, ensure that the user's identity (id, email, firstName, lastName) is preserved from the current user state. Only update the activeRole and roles array.
      - Add logging for debugging: Add console logs to track the user identity before and after switchRole is called, and log the response from the backend.
    - **File**: `src/components/DashboardSwitch.js`
      - Add debouncing to auto-sync logic to prevent repeated calls when state changes rapidly
      - Add user identity check before calling switchRole: verify that the user's identity hasn't changed unexpectedly
      - Implement minimum time delay between auto-sync calls to prevent rapid repeated switches
      - Add cancellation logic: ensure that if component unmounts or user changes, any pending auto-sync is cancelled
    - **File**: `src/utils/roleManager.js`
      - Verify role exists: Add a check to ensure the preferred role actually exists in the user's roles array before returning it
      - Add logging to track which role is being preferred for each route
    - **File**: `src/contexts/AuthContext-new.js` - `normalizeUser` function
      - Preserve user identity: Ensure that when normalizing user data, the user's core identity fields (id, email, firstName, lastName) are never overwritten by partial data
      - Merge roles carefully: When merging roles from multiple sources, ensure that the merge doesn't introduce unexpected roles or lose existing roles
    - _Bug_Condition: isBugCondition(input) where input.loginUser.id = "53e4eb26-8b1c-460d-80d3-c8d166ffaa7d" AND currentDashboardUser.id != input.loginUser.id_
    - _Expected_Behavior: For any login event where a user successfully authenticates with valid credentials and the backend returns the correct user data, the fixed login flow SHALL preserve the user's identity and SHALL NOT switch to a different user account. The dashboard SHALL display the logged-in user's data without entering a repeated refresh loop._
    - _Preservation: For any input that is NOT a login event (manual role switches, route navigation, logout), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for role switching, auto-sync, and other authentication operations._
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - User Identity Preservation After Login
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify that after login with Onyedika, currentUser.id remains "53e4eb26-8b1c-460d-80d3-c8d166ffaa7d"
    - Verify that currentUser.email remains "onyedika@example.com"
    - Verify that dashboard does NOT switch to Oluwaseun
    - Verify that NO repeated role switches are triggered
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Manual Role Switching and Auto-Sync Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify manual role switching via "Switch Dashboard" button still works correctly
    - Verify users with multiple roles can still switch between their available dashboards
    - Verify auto-sync based on route navigation still works
    - Verify users with only one role still don't see the DashboardSwitch component
    - Verify logout still clears all authentication data properly
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 4: Validation

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
