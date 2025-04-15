# BTC Import Cleanup Scripts

These scripts help clean up temporary data created during the BostonTangoCalendar (BTC) data import process.

## Overview

During the BTC import process, temporary users and organizers may be created with temporary IDs. These scripts help identify and remove this temporary data to keep your database clean.

## Enhanced Resilience Features

The cleanup scripts have been enhanced with the following reliability features:

1. **Multi-endpoint fallback**: The scripts now try multiple API endpoints in sequence, providing resilience against endpoint changes or configuration differences.
2. **Direct MongoDB access**: If API endpoints fail, the scripts can optionally connect directly to MongoDB as a last resort.
3. **Detailed error reporting**: Each step of the process is logged with clear error messages to help diagnose issues.
4. **ID format handling**: The scripts handle different ID formats (string vs ObjectId) for better compatibility.
5. **Connection validation**: MongoDB connection strings are validated before use to provide helpful error messages.

## Available Scripts

### 1. Remove Temporary Users

**Script:** `remove-temp-users.js`

This script removes user login records where the `firebaseUserId` starts with "temp_". These are temporary users that might have been created during the organizer import process.

**Usage:**
```bash
# Install dependencies if needed
npm install dotenv axios mongoose

# Run the script (dry run by default)
node scripts/remove-temp-users.js

# To actually delete users
DRY_RUN=false node scripts/remove-temp-users.js
```

**Configuration:**
- `DRY_RUN`: Set to `false` to actually delete the users (default is `true`)
- `APP_ID`: The app ID to filter users by (default is "1")
- `NEXT_PUBLIC_BE_URL`: The backend URL (defaults to localhost:3003)
- `MONGODB_URI`: Optional MongoDB connection string for direct database access as a fallback

**Endpoints:**
The script will automatically try multiple endpoints to find and delete users:
1. First tries `/api/userlogins` endpoint (from server.js routes)
2. Falls back to `/api/users` endpoint
3. As a last resort, attempts direct MongoDB connection if MONGODB_URI is configured

### 2. Remove Temporary Organizers

**Script:** `remove-temp-organizers.js`

This script identifies organizers created during the import process and optionally removes them. It can be configured to:
- Remove only organizers with temporary `firebaseUserId` (starting with "temp_" or "fake_firebase_")
- Remove all BTC-imported organizers (those with a `btcNiceName` field)

**Usage:**
```bash
# Install dependencies if needed
npm install dotenv axios mongoose

# Run the script (dry run by default)
node scripts/remove-temp-organizers.js

# To actually delete organizers
DRY_RUN=false node scripts/remove-temp-organizers.js

# To delete all BTC imported organizers, not just temp ones
DRY_RUN=false REMOVE_BTC_ORGANIZERS=true node scripts/remove-temp-organizers.js
```

**Configuration:**
- `DRY_RUN`: Set to `false` to actually delete the organizers (default is `true`)
- `REMOVE_BTC_ORGANIZERS`: Set to `true` to remove all BTC imported organizers (default is `false`)
- `APP_ID`: The app ID to filter organizers by (default is "1")
- `NEXT_PUBLIC_BE_URL`: The backend URL (defaults to localhost:3003)
- `MONGODB_URI`: Optional MongoDB connection string for direct database access as a fallback

**Endpoints:**
The script will automatically try these methods to find and delete organizers:
1. First tries `/api/organizers` endpoint (from server.js routes)
2. As a last resort, attempts direct MongoDB connection if MONGODB_URI is configured

## Safety Measures

1. **Dry Run Mode:** Both scripts default to "dry run" mode, which shows what would be deleted without actually deleting anything.
2. **Detailed Logging:** The scripts log each step of the process and each item that would be deleted.
3. **Item-by-Item Processing:** When deleting, the scripts process each item individually and log any errors.

## When to Run

Run these scripts after completing the BTC data import and verifying the imported data:

1. First verify the imported data is correct
2. Update the script configuration as needed
3. Run the scripts with DRY_RUN=true to preview what will be deleted
4. Once confirmed, set DRY_RUN=false and run again to perform the actual deletion

## Troubleshooting

If the scripts encounter errors:

1. Check the logged error messages
2. Verify your backend is running and accessible
3. Check that your API endpoints match what the scripts are using
4. Try running with fewer deletions (e.g., set a smaller limit)
5. For endpoint errors:
   - The scripts now automatically try multiple endpoints, which should resolve most API-related issues
   - If all endpoints fail, consider providing a direct MongoDB connection via the MONGODB_URI environment variable
6. For MongoDB connection errors:
   - Ensure your MONGODB_URI is correctly formatted and includes authentication credentials if needed
   - Check that your MongoDB instance is running and accessible from your environment
   - Verify that the user has appropriate permissions for the operations being performed