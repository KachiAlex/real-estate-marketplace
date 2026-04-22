---
inclusion: manual
---

# Role Switch Endpoint Maintenance Guide

## Critical Endpoint: `/api/users/switch-role`

This endpoint is essential for multi-role support in the application. It allows users to switch between different dashboard roles (buyer, vendor, admin, etc.).

## Why This Matters

- **User Experience**: Users with multiple roles need to switch between them seamlessly
- **Frontend Dependency**: The `DashboardSwitch` component and `AuthContext` depend on this endpoint
- **Common Breakage**: This endpoint is frequently missing after deployments or refactoring

## Files to Maintain

### Core Implementation
- `api/users/switch-role.js` - Main endpoint handler
- `api/utils/jwt.js` - JWT verification utility

### Tests (MUST PASS)
- `api/users/__tests__/switch-role.test.js` - Endpoint tests
- `api/utils/__tests__/jwt.test.js` - JWT utility tests

### Documentation
- `api/users/SWITCH_ROLE_ENDPOINT.md` - Full API documentation
- `.kiro/steering/role-switch-maintenance.md` - This file

### Frontend Integration
- `src/contexts/AuthContext-new.js` - Contains `switchRole` function
- `src/components/DashboardSwitch.js` - Uses the endpoint

## Pre-Deployment Checklist

Before deploying, verify:

```bash
# 1. Run tests
npm test -- api/users/__tests__/switch-role.test.js
npm test -- api/utils/__tests__/jwt.test.js

# 2. Check endpoint exists
ls -la api/users/switch-role.js

# 3. Check JWT utility exists
ls -la api/utils/jwt.js

# 4. Verify JWT_SECRET is set in environment
echo $JWT_SECRET

# 5. Test endpoint manually
curl -X POST http://localhost:5001/api/users/switch-role \
  -H "Authorization: Bearer <valid_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"vendor"}'
```

## Common Issues & Solutions

### Issue: 404 Error on Role Switch
**Cause**: Endpoint file is missing or not deployed
**Solution**: 
1. Verify `api/users/switch-role.js` exists
2. Redeploy to production
3. Check deployment logs

### Issue: 401 Unauthorized
**Cause**: JWT token is invalid or JWT_SECRET is not set
**Solution**:
1. Verify JWT_SECRET environment variable is set
2. Check token is valid and not expired
3. Verify Authorization header format: `Bearer <token>`

### Issue: 400 Invalid Role
**Cause**: Role value is not in the valid list
**Solution**:
1. Use only: `buyer`, `vendor`, `admin`, `inspector`, `mortgage_bank`
2. Role is case-insensitive but will be normalized to lowercase

## Database Integration TODO

The current implementation returns mock data. For production:

1. **Fetch user from database** using userId from JWT
2. **Verify user has access** to the requested role
3. **Update user's activeRole** in database
4. **Return updated user object** with all roles

See `api/users/SWITCH_ROLE_ENDPOINT.md` for implementation details.

## Monitoring

Monitor these metrics in production:

- **Error Rate**: Track 401, 400, 404 responses
- **Response Time**: Should be < 100ms
- **Usage**: Track which roles users switch to most
- **Failures**: Log all errors for debugging

## Related Endpoints

These endpoints should also be maintained:

- `POST /api/auth/login` - Initial authentication
- `GET /auth/jwt/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

## Questions?

Refer to:
1. `api/users/SWITCH_ROLE_ENDPOINT.md` - Full API documentation
2. `src/contexts/AuthContext-new.js` - Frontend implementation
3. `src/components/DashboardSwitch.js` - Component usage
