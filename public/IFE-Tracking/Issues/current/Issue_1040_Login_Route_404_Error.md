# Issue 1040: Login Route 404 Error

## Status: 🚧 In Progress

## Summary
The production site at https://cal-ops.org/login returns a 404 error. This route was removed as part of Feature 3013 (Remove Password Authentication), but there are still references to it in the production environment.

## Environment
- **Production**: https://cal-ops.org
- **Branch**: main (production deployment)

## Steps to Reproduce
1. Navigate to https://cal-ops.org/login
2. Observe 404 error

## Expected Behavior
Users should either be redirected to the appropriate authentication flow or see a meaningful message about the authentication system change.

## Investigation Notes
- Login route was removed as part of Feature 3013 implementation
- Other environments (TEST) may also have references to the deprecated /login route
- Need to identify all remaining references to /login in the codebase

## Related Items
- Feature 3013: Remove Password Authentication System

## Next Steps
1. Search for all references to /login route in the codebase
2. Update any hardcoded links or redirects
3. Consider implementing a redirect from /login to the new authentication flow
4. Test in all environments (DEVL, TEST, PROD)

## Role Updates

### 🪞 Mirror Mode - 2025-01-06
- Created issue documentation for login route 404 error
- Identified relationship to Feature 3013 implementation