# Bugfix Requirements Document: Dashboard User Switch After Login

## Introduction

After successful login with one account (Onyedika - 53e4eb26-8b1c-460d-80d3-c8d166ffaa7d), the dashboard keeps switching to a different user account (Oluwaseun). The authentication flow completes successfully with correct user credentials and the `/auth/me` endpoint returns the correct user data, but the active user in the dashboard switches unexpectedly. This causes the dashboard to display the wrong user's data and repeatedly refresh with role/dashboard switching, creating a confusing and broken user experience.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user logs in successfully with valid credentials THEN the dashboard displays the correct logged-in user initially but then switches to a different user account (Oluwaseun)

1.2 WHEN the dashboard switches to the wrong user THEN the dashboard repeatedly refreshes with continuous role/dashboard switching, creating a loop

1.3 WHEN the user is switched to Oluwaseun THEN the dashboard displays Oluwaseun's data instead of the logged-in user's data (Onyedika)

1.4 WHEN the dashboard is in the switching loop THEN the console shows repeated calls to `switchRole` being triggered

### Expected Behavior (Correct)

2.1 WHEN a user logs in successfully with valid credentials THEN the dashboard SHALL display the logged-in user's data (Onyedika) and SHALL NOT switch to a different user

2.2 WHEN the dashboard loads after login THEN the dashboard SHALL remain stable on the logged-in user's account without repeated refreshes or role switching

2.3 WHEN the user's role is determined from the current route THEN the dashboard SHALL only auto-sync the role if it differs from the user's active role AND SHALL NOT trigger unnecessary user switches

2.4 WHEN a user manually switches roles THEN the dashboard SHALL switch to the target role without affecting the currently logged-in user's identity

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user with multiple roles manually clicks the "Switch Dashboard" button THEN the system SHALL CONTINUE TO switch to the selected role and navigate to the correct dashboard path

3.2 WHEN a user navigates to a route that prefers a specific role (e.g., `/vendor/dashboard` prefers vendor role) THEN the system SHALL CONTINUE TO auto-sync the active role to match the route preference

3.3 WHEN a user logs out THEN the system SHALL CONTINUE TO clear all authentication data and user state properly

3.4 WHEN a user with only one role logs in THEN the system SHALL CONTINUE TO display the dashboard without showing the role switch component

3.5 WHEN the `/auth/me` endpoint returns fresh user data THEN the system SHALL CONTINUE TO use that data to update the current user state

## Bug Condition Analysis

**Bug Condition C(X):** The bug occurs when:
- A user successfully logs in with valid credentials
- The authentication context receives the correct user data from `/auth/me`
- The DashboardSwitch component's auto-sync logic is triggered
- The auto-sync logic incorrectly calls `switchRole` with a role value that causes the user to switch to a different account

**Root Cause Areas to Investigate:**
1. The `switchRole` method in AuthContext may be switching the user identity instead of just the active role
2. The DashboardSwitch component's auto-sync logic may be calling `switchRole` with incorrect parameters
3. The role normalization logic may be mapping roles to different user accounts
4. The `/api/users/switch-role` endpoint may be returning a different user's data
5. The `normalizeUser` function may be incorrectly merging user data from different sources

**Property Specification:**

```pascal
// Property: Fix Checking - User Identity Preservation After Login
FOR ALL X WHERE isBugCondition(X) DO
  result ← dashboard_after_login(X)
  ASSERT result.currentUser.id = X.loginUser.id
  ASSERT result.currentUser.email = X.loginUser.email
  ASSERT result.currentUser.firstName = X.loginUser.firstName
  ASSERT NO_REPEATED_ROLE_SWITCHES(result)
END FOR

// Property: Preservation Checking - Role Switching Still Works
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
  // Manual role switches should still work correctly
  // Auto-sync should still work for route-based role preferences
END FOR
```

**Key Definitions:**
- **F**: The original (unfixed) code - current behavior where user switches to Oluwaseun
- **F'**: The fixed code - user remains as Onyedika after login
- **isBugCondition(X)**: Returns true when user logs in successfully but dashboard switches to wrong user
- **NO_REPEATED_ROLE_SWITCHES**: Verifies dashboard doesn't enter a refresh loop with repeated role switching
