# BTC Import Authentication Testing

This guide explains how to test and fix the authentication issues encountered during the BTC event import process.

## Overview

The actual import process requires a valid authentication token to create events in the TangoTiempo API. During our initial test, we encountered 401 (Unauthorized) errors with the message "No token provided", which prevented successful event creation.

## Testing Authentication

Use the `test-authentication.js` script to verify your authentication token works correctly:

```bash
# Option 1: Set token as environment variable first
export AUTH_TOKEN=your_token_here
node scripts/btc-import/test-authentication.js

# Option 2: Pass token directly to script
AUTH_TOKEN=your_token_here node scripts/btc-import/test-authentication.js
```

The script will run three tests:
1. Read operation without auth token (should work)
2. Read operation with auth token (should work)
3. Authentication check (to verify the token is valid)

## Obtaining a Valid Token

To obtain a valid authentication token for the TangoTiempo API:

1. Log in to the TangoTiempo admin interface
2. Access the developer tools (F12) and go to the Network tab
3. Look for API requests that include an Authorization header
4. Copy the token (without the "Bearer " prefix)

Alternatively, if you have access to the backend code, you can generate a token programmatically:

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'admin_user_id', roles: ['admin'] },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
console.log(token);
```

## Running the Actual Import With Authentication

Once you have a valid token, run the actual import:

```bash
# Set the token and run the import
AUTH_TOKEN=your_token_here node scripts/btc-import/run-actual-import.js
```

## Troubleshooting

If authentication still fails, check the following:

1. **Token Format**: Ensure the token is a valid JWT without the "Bearer " prefix
2. **Token Expiration**: Tokens typically expire after a certain time (24h, 7d, etc.)
3. **Permissions**: The token must have sufficient permissions to create events
4. **API URL**: Verify the API base URL is correct (default: http://localhost:3010/api)
5. **Backend Status**: Ensure the TangoTiempo backend is running and accessible

## For Development Testing

If you're testing in a development environment, you can use a mock token by:

1. Modifying the server's authentication middleware to accept a test token
2. Creating a special development endpoint that returns a valid token

Example backend code modification (for development only):

```javascript
// In authMiddleware.js
if (process.env.NODE_ENV === 'development' && req.headers.authorization === 'Bearer TEST_TOKEN') {
  req.user = { uid: 'test_admin', roles: ['admin'] };
  return next();
}
```

## Security Considerations

- Never commit authentication tokens to version control
- Use environment variables to pass tokens to scripts
- For production, implement more secure token management (e.g., Azure Key Vault, AWS Secrets Manager)
- Consider implementing token rotation for long-running import processes