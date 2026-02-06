# CalOps - Calendar Operations Dashboard

An administrative interface for managing the MasterCalendar system, supporting both TangoTiempo and HarmonyJunction applications.

## Overview

This admin application provides a centralized interface for managing:

1. **User Management**
   - Role assignment and permissions (NU, RO, RA, SA)
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
   - Switch between TangoTiempo (AppId=1) and HarmonyJunction (AppId=2)
   - Application-specific settings

5. **Advanced Logging**
   - Winston + MongoDB log viewer
   - Real-time log monitoring
   - Color-coded severity levels

## Installation

1. **Prerequisites**
   - Azure Functions backend running (`calendar-be-af` on port 7071)
   - Node.js 18+ installed
   - Run `func start` in calendar-be-af directory

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with:

```bash
# Azure Functions Backend (PRIMARY)
NEXT_PUBLIC_AF_ENABLED=true
NEXT_PUBLIC_AF_URL=http://localhost:7071

# Port for this application
PORT=3003

# Google Maps API Key for Geocoding
GOOGLE_MAPS_API_KEY=your_key_here
```

4. **Start the development server**

```bash
npm run dev
```

The admin app will be available at http://localhost:3003

## Backend Architecture

### Primary Backend: Azure Functions (calendar-be-af)

- **Local Development**: http://localhost:7071
- **TEST Environment**: https://calendarbeaf-test-*.azurewebsites.net
- **PROD Environment**: https://calendarbeaf-prod-*.azurewebsites.net

### API Endpoints (73 total)

| Category | Count | Base Path |
|----------|-------|-----------|
| Health & Monitoring | 5 | `/api/health/*` |
| Events | 12 | `/api/events/*` |
| Venues | 9 + timer | `/api/venues/*` |
| Organizers | 10 | `/api/organizers/*` |
| User Services | 10 | `/api/userlogins/*`, `/api/user/*` |
| Geolocation | 15 | `/api/geo/*`, `/api/masteredLocations/*` |
| Analytics | 4 | `/api/analytics/*`, `/api/visitor/*` |

### Legacy Backend (DEPRECATED)

The Express.js backend (`calendar-be` on port 3010) is no longer running. All functionality has been migrated to Azure Functions.

## Authentication

Firebase Authentication is used for user management. The system uses role-based access control:
- **NU** - Named User (basic authenticated user)
- **RO** - Regional Organizer
- **RA** - Regional Admin
- **SA** - System Admin

## Architecture

- **Frontend**: Next.js 14 (App Router) with Material UI
- **Backend**: Azure Functions (Node.js 20)
- **Database**: MongoDB Atlas
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + MUI theming

## JIRA Integration

Access JIRA using direct curl with macOS keychain authentication:

```bash
JIRA_EMAIL="toby.balsley@gmail.com"
JIRA_TOKEN=$(security find-generic-password -a "toby.balsley@gmail.com" -s "jira-api-token" -w)

curl -s -G -u "$JIRA_EMAIL:$JIRA_TOKEN" \
  -H "Accept: application/json" \
  --data-urlencode "jql=project=CALOPS ORDER BY updated DESC" \
  "https://hdtsllc.atlassian.net/rest/api/3/search/jql"
```

## License

This project is proprietary and confidential. All rights reserved.

## Contact

For any questions or support, please contact your system administrator.
