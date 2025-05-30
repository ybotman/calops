# Calendar Admin Application


An administrative interface for managing the Calendar Backend system, supporting both TangoTiempo and HarmonyJunction applications.

## Overview

This admin application provides a centralized interface for managing:

1. **User Management**
   - Role assignment and permissions
   - User approval and activation
   - User profile management

2. **Location Hierarchy Management**
   - Countries, Regions, Divisions, and Cities
   - Activation/deactivation of locations
   - Geographical assignments

3. **Organization Management**
   - Creating and editing organizers
   - Approval workflows
   - Linking organizers to users and locations

4. **Multi-Application Support**
   - Switch between TangoTiempo and HarmonyJunction
   - Application-specific settings

## Installation

1. **Prerequisites**
   - Make sure the `calendar-be` backend is running (default port 3010)
   - Node.js 18+ installed

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with:

```
# API Backend URL
NEXT_PUBLIC_BE_URL=http://localhost:3010

# Port for this application
PORT=3003
```

4. **Start the development server**

```bash
npm run dev
```

The admin app will be available at http://localhost:3003

## Authentication

Authentication is temporarily bypassed for development purposes. The authentication system will be implemented in a future update.

## Architecture

- **Frontend**: Next.js with Material UI for the interface
- **Backend Connection**: Direct API calls to the calendar-be backend
- **API Client**: Centralized in `src/lib/api-client.js`

## API Routes

The application provides the following API routes:

- `/api/users` - User management
- `/api/venues` - Physical venue management
- `/api/geo-hierarchy` - Geographic hierarchy management
- `/api/organizers` - Organizer management
- `/api/applications` - Application settings management

## License

This project is proprietary and confidential. All rights reserved.

## Contact

For any questions or support, please contact your system administrator.# Trigger Vercel deployment - Fri May 30 00:52:47 EDT 2025
