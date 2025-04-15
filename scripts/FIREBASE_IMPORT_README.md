# Firebase User Import for TangoTiempo

This script imports Firebase authentication users into the TangoTiempo userLogins collection by connecting to the backend REST API. If the API is unavailable, it can fall back to direct MongoDB connection as a last resort.

## Architecture Overview

- **Frontend (calendaradmin)**: Next.js application that provides the UI
- **Backend (calendar-be)**: Node.js server running on port 3010 that handles API requests
- **Database**: MongoDB running on standard port 27017 (accessed through the backend)

The normal flow is: Frontend → Backend API → MongoDB. This script follows the same flow by default.

## Prerequisites

- Node.js installed
- TangoTiempo backend running (typically on port 3010)
- Firebase users exported as a JSON file

## Installation

Ensure you have the needed dependencies:

```bash
npm install axios mongodb
```

The script uses:
- `fs` and `path` (Node.js built-in)
- `axios` (for API requests)
- `mongodb` (only used as fallback if API is unavailable)

## Usage

```bash
# Basic usage - connects to backend API
node scripts/import-firebase-users.js ./path/to/firebase-users.json

# Specify custom backend URL if needed
API_URL="http://localhost:3010" node scripts/import-firebase-users.js ./firebase-users.json

# Alternative command-line options
node scripts/import-firebase-users.js ./firebase-users.json --apiUrl=http://localhost:3010
```

## Command-line Options

You can configure the script using either environment variables or command-line options:

| Environment Variable | Command-line Option | Description | Default |
|---------------------|---------------------|-------------|---------|
| `API_URL` | `--apiUrl=http://...` | Backend API URL | `http://localhost:3010` |
| `APP_ID` | `--appId=1` | Application ID | `1` |

## Fallback Mode

If the backend API is unavailable, the script will automatically fall back to direct MongoDB connection. This should only be used when the backend is down:

```
API approach failed. Connecting directly to MongoDB at mongodb://localhost:27017 as fallback...
NOTE: This should only be used when the backend API is unavailable.
```

## Firebase User Format

The script accepts different formats of Firebase user exports:

1. Array of user objects:
```json
[
  {
    "uid": "g11kldrWYrgm4b6VnTbRex4hLvi2",
    "email": "user@example.com",
    "displayName": "John Smith"
  },
  ...
]
```

2. Object with `users` array:
```json
{
  "users": [
    {
      "uid": "g11kldrWYrgm4b6VnTbRex4hLvi2",
      "email": "user@example.com",
      "displayName": "John Smith"
    },
    ...
  ]
}
```

3. Single user object:
```json
{
  "uid": "g11kldrWYrgm4b6VnTbRex4hLvi2",
  "email": "user@example.com",
  "displayName": "John Smith"
}
```

## Special Fields

The script recognizes these fields in your Firebase user objects:

- `uid` or `localId`: The Firebase user ID (required)
- `email`: User's email address
- `displayName` or `name`: User's display name (will be split into first/last name)
- `isRegionalOrganizer`: Boolean flag to mark user as RegionalOrganizer (optional)

## Import Process

1. The script first attempts to use the backend API to import users
2. If the API is unreachable, it falls back to direct MongoDB connection
3. Users receive the basic `User` role by default
4. Users with `isRegionalOrganizer: true` also get the `RegionalOrganizer` role

## Error Handling

- The script includes robust error handling for API connection issues
- A detailed log file (`firebase-import-log.json`) is created in the scripts directory
- Each user is processed individually, so errors with one user won't stop the entire import

## Troubleshooting

### Backend Connection Problems

If you encounter API connection errors:

```
API import failed: connect ECONNREFUSED 127.0.0.1:3010
Falling back to direct MongoDB connection...
```

Try these fixes:

1. Make sure the backend server is running on port 3010
2. Check if the backend URL is correct (`http://localhost:3010` by default)
3. If you're running in a different environment, set the correct API URL:
   ```bash
   API_URL="http://your-backend-url" node scripts/import-firebase-users.js ./firebase-users.json
   ```

### MongoDB Fallback Problems

If both API and MongoDB fallback approaches fail:

1. Ensure that MongoDB is running (typically on port 27017)
2. Check that you have the necessary MongoDB connection permissions
3. Verify that the database name is correct (default: "TangoTiempo")

### Input File Problems

If you see errors about the input file:

```
Error reading/parsing the input file: Unexpected token ... in JSON at position ...
```

1. Make sure your JSON file is valid (use a JSON validator)
2. Check if the file path is correct (should be relative to where you run the command)

## After Import

After successfully importing users:

1. Check the log file for details (`firebase-import-log.json`)
2. Verify the users in the MongoDB collection via the admin interface
3. Use the TangoTiempo admin interface to manage user roles if needed

For connecting users to organizers, use the User-Organizer connection functionality in the admin interface.