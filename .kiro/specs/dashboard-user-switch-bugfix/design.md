# Dashboard User Switch Bugfix Design

## Overview

After successful login with one account (Onyedika), the dashboard unexpectedly switches to a different user account (Oluwaseun) and enters a repeated refresh loop with continuous role/dashboard switching. The authentication flow completes successfully and `/auth/me` returns the correct user data, but the active user in the dashboard switches incorrectly. This design document outlines the investigation strategy, root cause analysis, and fix approach to preserve user identity after login while maintaining the ability to manually switch roles.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user logs in successfully but the dashboard switches to a different user account
- **Property (P)**: The desired behavior when a user logs in - the dashboard should display the logged-in user's data without switching to a different user
- **Preservation**: Existing manual role switching functionality and auto-sync for route-based role preferences that must remain unchanged
- **switchRole**: The method in AuthContext that changes the active role and calls `/api/users/switch-role` endpoint
- **normalizeUser**: The function in AuthContext that normalizes user data from various sources (roles, role, userType, activeRole)
- **DashboardSwitch**: The component in `src/components/DashboardSwitch.js` that handles manual role switching and auto-sync logic
- **activeRole**: The currently active role for the user (determines which dashboard is displayed)
- **currentUser**: The user object stored in React state in AuthContext
- **auto-sync**: The automatic role switching triggered by route changes (e.g., navigating to `/vendor/dashboard` auto-syncs to vendor role)

## Bug Details

### Bug Condition

The bug manifests when a user logs in successfully with valid credentials and the dashboard receives the correct user data from the backend. The `switchRole` method or the DashboardSwitch component's auto-sync logic is either:
1. Calling `switchRole` with incorrect parameters that cause the `/api/users/switch-role` endpoint to return a different user's data
2. Incorrectly merging user data from multiple sources, causing the user identity to be overwritten
3. Triggering auto-sync logic repeatedly due to state changes, creating a refresh loop
4. Not properly preserving the user identity when normalizing user data

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type LoginEvent
  OUTPUT: boolean
  
  RETURN input.loginUser.id = "53e4eb26-8b1c-460d-80d3-c8d166ffaa7d"  // Onyedika
         AND input.loginUser.email = "onyedika@example.com"
         AND input.loginSuccessful = true
         AND currentDashboardUser.id != input.loginUser.id  // User switched to different account
         AND currentDashboardUser.id = "oluwaseun-id"  // Switched to Oluwaseun
         AND repeatedRoleSwitchesDetected = true  // Dashboard enters refresh loop
END FUNCTION
```

### Examples

**Example 1: Login with Onyedika, Dashboard Switches to Oluwaseun**
- User logs in with email: onyedika@example.com, password: correct
- Backend returns: `{ user: { id: "53e4eb26-8b1c-460d-80d3-c8d166ffaa7d", firstName: "Onyedika", roles: ["buyer", "vendor"] }, accessToken: "..." }`
- Expected: Dashboard displays "Onyedika" with buyer/vendor role options
- Actual: Dashboard displays "Oluwaseun" (different user) and repeatedly refreshes

**Example 2: Repeated Role Switching Loop**
- After login, console shows repeated calls to `switchRole` being triggered
- Dashboard keeps switching between roles without user interaction
- Page keeps refreshing, creating a broken user experience

**Example 3: Correct User Data in Console, Wrong User in Dashboard**
- Network tab shows `/auth/me` returns correct user (Onyedika)
- React DevTools shows currentUser is initially correct
- But dashboard displays wrong user (Oluwaseun)
- Indicates data is being overwritten after initial load

**Edge Case: User with Multiple Roles**
- User has both buyer and vendor roles
- After login, dashboard should show buyer role (primary) but may auto-sync to vendor
- If auto-sync is triggered incorrectly, it may call switchRole with wrong parameters

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Manual role switching via "Switch Dashboard" button must continue to work correctly
- Users with multiple roles must be able to switch between their available dashboards
- Auto-sync based on route navigation must continue to work (e.g., navigating to `/vendor/dashboard` auto-syncs to vendor role)
- Users with only one role must not see the DashboardSwitch component
- Logout must continue to clear all authentication data properly
- `/auth/me` endpoint must continue to return fresh user data

**Scope:**
All inputs that do NOT involve the login flow or auto-sync logic should be completely unaffected by this fix. This includes:
- Manual role switching via button clicks
- Navigation to different routes
- Logout functionality
- User profile updates
- Other authentication flows (Google sign-in, registration)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Incorrect switchRole Parameters**: The DashboardSwitch auto-sync logic may be calling `switchRole` with a role value that doesn't match the user's actual roles, causing the backend to return a different user's data or trigger unexpected behavior.

2. **User Data Merging Issue**: The `normalizeUser` function may be incorrectly merging user data from multiple sources (the login response, the `/auth/me` response, and the `/api/users/switch-role` response), causing user identity to be overwritten.

3. **Auto-Sync Triggered During Login**: The DashboardSwitch auto-sync effect may be triggered immediately after login before the user state is fully settled, causing it to call `switchRole` with incomplete or incorrect data.

4. **Repeated Auto-Sync Loop**: The auto-sync logic may not have proper guards to prevent repeated calls, causing a refresh loop where each role switch triggers another auto-sync.

5. **Role Normalization Mismatch**: The role values used in DashboardSwitch (from `getRoutePreferredRole`) may not match the role values in the user's roles array, causing `canSwitchToRole` to fail or `switchRole` to be called with unexpected values.

6. **Backend Endpoint Issue**: The `/api/users/switch-role` endpoint may be returning a different user's data when called with certain role values, or the endpoint may have a bug that causes user switching.

## Correctness Properties

Property 1: Bug Condition - User Identity Preservation After Login

_For any_ login event where a user successfully authenticates with valid credentials and the backend returns the correct user data, the fixed login flow SHALL preserve the user's identity and SHALL NOT switch to a different user account. The dashboard SHALL display the logged-in user's data without entering a repeated refresh loop.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Manual Role Switching and Auto-Sync

_For any_ input that is NOT a login event (manual role switches, route navigation, logout), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for role switching, auto-sync, and other authentication operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Investigation Strategy

The fix requires a systematic investigation to identify which component is causing the user switch:

**Phase 1: Trace the User Switch**
1. Add detailed logging to track user identity changes through the login flow
2. Log user data at each step: login response → normalizeUser → setCurrentUser
3. Log when DashboardSwitch auto-sync is triggered and what parameters are passed to switchRole
4. Log the response from `/api/users/switch-role` to see if it returns a different user
5. Identify the exact point where the user identity changes from Onyedika to Oluwaseun

**Phase 2: Identify Root Cause**
1. Check if the issue is in AuthContext (switchRole method or normalizeUser function)
2. Check if the issue is in DashboardSwitch (auto-sync logic or parameters)
3. Check if the issue is in roleManager (role normalization or route preference logic)
4. Check if the issue is in the backend endpoint (returning wrong user data)

**Phase 3: Verify Fix**
1. Confirm that login preserves user identity
2. Confirm that manual role switching still works
3. Confirm that auto-sync still works for route navigation
4. Confirm that no repeated refresh loop occurs

### Changes Required

Assuming our root cause analysis is correct, the following changes are needed:

**File**: `src/contexts/AuthContext-new.js`

**Function**: `switchRole`

**Specific Changes**:
1. **Add User Identity Guard**: Before calling `/api/users/switch-role`, verify that the role being switched to is actually in the user's roles array. If not, log a warning and skip the switch.

2. **Prevent User Data Overwrite**: When normalizing the response from `/api/users/switch-role`, ensure that the user's identity (id, email, firstName, lastName) is preserved from the current user state. Only update the activeRole and roles array.

3. **Add Logging for Debugging**: Add console logs to track the user identity before and after switchRole is called, and log the response from the backend.

**File**: `src/components/DashboardSwitch.js`

**Function**: `useEffect` (auto-sync effect)

**Specific Changes**:
1. **Add Debouncing**: Debounce the auto-sync logic to prevent repeated calls when state changes rapidly.

2. **Add User Identity Check**: Before calling switchRole, verify that the user's identity hasn't changed unexpectedly. If it has, log a warning and skip the auto-sync.

3. **Add Timing Guard**: Implement a minimum time delay between auto-sync calls to prevent rapid repeated switches.

4. **Add Cancellation Logic**: Ensure that if the component unmounts or the user changes, any pending auto-sync is cancelled.

**File**: `src/utils/roleManager.js`

**Function**: `getRoutePreferredRole`

**Specific Changes**:
1. **Verify Role Exists**: Add a check to ensure the preferred role actually exists in the user's roles array before returning it.

2. **Add Logging**: Add console logs to track which role is being preferred for each route.

**File**: `src/contexts/AuthContext-new.js`

**Function**: `normalizeUser`

**Specific Changes**:
1. **Preserve User Identity**: Ensure that when normalizing user data, the user's core identity fields (id, email, firstName, lastName) are never overwritten by partial data.

2. **Merge Roles Carefully**: When merging roles from multiple sources, ensure that the merge doesn't introduce unexpected roles or lose existing roles.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code by simulating the login flow and observing user switches, then verify the fix works correctly and preserves existing functionality.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the login flow with a user that has multiple roles, then observe whether the dashboard switches to a different user. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Login with Multi-Role User**: Simulate logging in with Onyedika (who has buyer and vendor roles), then verify that the dashboard displays Onyedika and not a different user (will fail on unfixed code)
2. **Check Auto-Sync Behavior**: After login, verify that auto-sync doesn't trigger unnecessary role switches (will fail on unfixed code)
3. **Verify No Repeated Refresh Loop**: After login, verify that the dashboard doesn't enter a repeated refresh loop (will fail on unfixed code)
4. **Check User Identity Preservation**: Verify that the user's identity (id, email, firstName) is preserved throughout the login flow (will fail on unfixed code)

**Expected Counterexamples**:
- Dashboard displays wrong user (Oluwaseun instead of Onyedika)
- Console shows repeated calls to switchRole being triggered
- User identity changes from Onyedika to Oluwaseun after login
- Possible causes: incorrect switchRole parameters, user data merging issue, auto-sync triggered during login, repeated auto-sync loop

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := login_fixed(input)
  ASSERT result.currentUser.id = input.loginUser.id
  ASSERT result.currentUser.email = input.loginUser.email
  ASSERT result.currentUser.firstName = input.loginUser.firstName
  ASSERT NO_REPEATED_ROLE_SWITCHES(result)
  ASSERT dashboard_displays_correct_user(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for manual role switching and auto-sync, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Manual Role Switch Preservation**: Verify that clicking "Switch Dashboard" button continues to work correctly after fix
2. **Auto-Sync Preservation**: Verify that navigating to `/vendor/dashboard` continues to auto-sync to vendor role after fix
3. **Multi-Role User Preservation**: Verify that users with multiple roles can still switch between dashboards after fix
4. **Single-Role User Preservation**: Verify that users with only one role don't see the DashboardSwitch component after fix
5. **Logout Preservation**: Verify that logout continues to clear all authentication data after fix

### Unit Tests

- Test login flow with multi-role user and verify user identity is preserved
- Test switchRole method with valid and invalid role values
- Test normalizeUser function with various user data formats
- Test DashboardSwitch auto-sync logic with different routes
- Test that auto-sync doesn't trigger repeated calls
- Test that manual role switching works correctly

### Property-Based Tests

- Generate random multi-role users and verify login preserves user identity
- Generate random role switch sequences and verify user identity is never lost
- Generate random route navigations and verify auto-sync works correctly
- Generate random user data formats and verify normalizeUser handles them correctly
- Test that all non-login inputs continue to work as before

### Integration Tests

- Test full login flow with multi-role user and verify dashboard displays correct user
- Test switching between dashboards and verify user identity is preserved
- Test navigating to different routes and verify auto-sync works correctly
- Test logout and verify all authentication data is cleared
- Test that repeated role switches don't cause user identity to change
- Test that the dashboard doesn't enter a repeated refresh loop after login
