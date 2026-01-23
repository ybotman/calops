# Application Playbook

## CALOPS - Calendar Operations Dashboard

### Overview
CALOPS (Calendar Operations) is a Next.js 14 administrative dashboard that serves as the central operations console for managing multiple frontend calendar applications. It provides comprehensive administrative tools for managing users, events, organizers, and geographic hierarchies across different calendar applications.

### Multi-Application Architecture

#### Application Management
- **AppId System**: Each frontend application has a unique AppId identifier
- **Tango Tiempo**: AppId = 1 (current primary application)
- **Data Segregation**: All data operations filtered by AppId for complete multi-tenant isolation
- **App Context**: Full context switching system with localStorage persistence and event broadcasting
- **Applications Collection**: MongoDB collection stores configuration for each frontend app

#### Supported Frontend Applications
1. **TangoTiempo (AppId=1)** - Primary tango calendar application
2. **HarmonyJunction** - Secondary application (mentioned in docs)
3. **Future Applications** - Architecture supports unlimited additional frontends

### Core Administrative Features

#### User Management
- Firebase authentication integration
- Role-based access control (NU/RO/RA/SA roles)
- User profile management with role assignments
- Regional organizer and admin permission grants

#### Geographic Hierarchy Management
- **Countries**: Top-level geographic entities
- **Regions**: State/province level divisions
- **Divisions**: Sub-regional groupings
- **Cities**: Curated city list with geolocation
- Full CRUD operations for all hierarchy levels
- Geolocation support with 2dsphere indexing

#### Organizer Management
- Support for multiple organizer types:
  - DJ (Disc Jockey)
  - Teacher
  - Orchestra
  - Venue
- Visibility controls per organizer
- Linking to user accounts
- Organizer approval workflows

#### Event Management
- Full CRUD operations for events
- AppId filtering for multi-app support
- Status tracking and moderation
- Bulk operations support
- Event series management

#### Advanced Logging System
- Winston + MongoDB integration
- Sophisticated log viewer (CALOPS-34 in development)
- Advanced filtering capabilities
- Real-time log monitoring
- Color-coded severity levels

### Technical Architecture

#### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **UI Components**: Material-UI (MUI)
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + MUI theming

#### Backend Integration
- **API Proxy**: `/api/*` requests proxied to calendar-be (port 3010)
- **Models Bridge**: Direct import from calendar-be models for consistency
- **Environment Handling**: 
  - Development: Local proxy configuration
  - Production: NEXT_PUBLIC_BE_URL environment variable

#### File Structure
```
/calops/
├── src/app/dashboard/    # Main admin interface pages
├── src/components/       # Reusable UI components
├── src/lib/api-client/   # Backend API integration
├── src/models/           # Data model definitions
├── src/contexts/         # React contexts (App, Auth)
├── logs/                 # Winston MongoDB log outputs
└── scripts/              # Maintenance and sync utilities
```

### JIRA Project Management

#### CALOPS Project
- **Project Key**: CALOPS
- **JIRA URL**: https://hdtsllc.atlassian.net
- **Active Development**:
  - CALOPS-34: Advanced log viewer implementation
  - CALOPS-33: Geocoding service integration
  - CALOPS-32: Dashboard event count fixes
  - CALOPS-28: New organizer type management

#### Development Workflow
- **Branches**: 
  - main (primary)
  - PROD (production)
  - TEST (testing)
  - feature/CALOPS-XX-description
- **TRACKING Integration**: All work documented in JIRA using MCP

### Current Development Focus

#### Log Viewer System (CALOPS-34)
- Advanced filtering with DataGrid patterns
- Mobile-responsive design
- Color-coded severity levels
- Real-time updates
- Export capabilities

#### Known Issues
- Event counts showing zero on dashboard (CALOPS-32)
- Geocoding integration in progress (CALOPS-33)
- Organizer type pages being added (CALOPS-28)

## Backend System Design (Calendar-BE)

### Event Access Control Security Design

### Overview
The calendar system uses a two-tier access control model for events:

1. **Viewing Access** - Who can see events
2. **CRUD Access** - Who can create, update, delete events

### Authentication & Authorization Flow

1. **Firebase Authentication**
   - Users authenticate via Firebase Auth
   - Firebase provides JWT tokens with user UID
   - Backend verifies tokens using Firebase Admin SDK

2. **User Login & Roles**
   - Each Firebase user has a corresponding `userlogins` record
   - Users are automatically assigned NU (NamedUser) role on creation
   - Additional roles granted: RO (Regional Organizer), RA (Regional Admin), SA (System Admin)

### Role Definitions

#### NU (NamedUser)
- **Description**: Basic authenticated user role, automatically assigned on account creation
- **Permissions**: 
  - View events within geographic range (production: city-based, future: lat/long distance)
  - Create their own organizer profile
  - No event CRUD without additional roles

#### RO (Regional Organizer)
- **Description**: Event organizer with regional management capabilities
- **Permissions**:
  - CRUD their own events (where organizerId matches)
  - CRUD any events in their granted cities/divisions/regions
  - Managed through `regionalOrganizerInfo` in userlogins
- **Requirements**:
  - Must have `isApproved = true` and `isEnabled = true`
  - Must have an associated organizer record
  - Must have granted locations (cities/divisions/regions)

#### RA (Regional Admin)
- **Description**: Administrative role for managing organizers and events within regions
- **Permissions**:
  - Grant/revoke cities to ROs within their jurisdiction
  - CRUD any events in their granted cities/divisions/regions
  - Approve and enable RO accounts
  - Managed through `localAdminInfo` in userlogins
- **Requirements**:
  - Must have `isApproved = true` and `isEnabled = true`
  - Must have granted admin locations

#### SA (System Admin)
- **Description**: Full system administrative access
- **Permissions**:
  - All permissions across all regions
  - User management
  - System configuration
  - No location restrictions

### Event CRUD Permission Logic

Events can be modified by users who meet ANY of these criteria:

1. **Organizer-based Access**
   - User's organizerId matches event's `ownerOrganizerID`
   - User's organizerId matches event's `grantedOrganizerID`
   - User's organizerId matches event's `alternateOrganizerID`
   - User's organizerId is in event's `alternateOrganizers` array

2. **City-based Access (RO Role)**
   - User has RO role
   - User's `regionalOrganizerInfo.isApproved` = true
   - User's `regionalOrganizerInfo.isEnabled` = true
   - Event's `masteredCityId` is in user's `regionalOrganizerInfo.allowedMasteredCityIds`

3. **City-based Access (RA Role)**
   - User has RA role
   - User's `localAdminInfo.isApproved` = true
   - User's `localAdminInfo.isEnabled` = true
   - Event's `masteredCityId` is in user's `localAdminInfo.allowedAdminMasteredCityIds`

### Data Model Relationships

```
userlogins
├── firebaseUserId (unique)
├── roleIds[] → roles collection
├── regionalOrganizerInfo
│   ├── organizerId → organizers collection
│   ├── isApproved, isEnabled, isActive
│   └── allowedMasteredCityIds[] → masteredcities
└── localAdminInfo
    ├── isApproved, isEnabled, isActive
    └── allowedAdminMasteredCityIds[] → masteredcities

organizers
├── linkedUserLogin → userlogins
├── firebaseUserId
└── fullName, shortName

events
├── ownerOrganizerID → organizers
├── grantedOrganizerID → organizers
├── alternateOrganizerID → organizers
├── alternateOrganizers[]
├── masteredCityId → masteredcities
└── venueID → venues

venues
├── geolocation (lat/long)
└── masteredCityId → masteredcities (mapped via nearestLogic)

masteredcities
├── location (2dsphere coordinates)
└── masteredDivisionId → mastereddivisions
```

### Two Types of Event Access

#### 1. Viewing Access (Read-Only)
Controls which events users can see in the calendar interface.

**Production (Current) - City-Based**
- Users select a masteredCity from the curated hierarchy
- See ALL events in that selected city
- Simple discrete selection model
- No geographic distance calculations

**Test/Future (Moving to Production) - Geolocation-Based**
- Users provide their location (lat/long)
- System shows events within radius (≤250 miles)
- Uses MongoDB 2dsphere geospatial queries
- Query: `{ venueGeolocation: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: radiusInMeters } } }`
- More flexible and intuitive for users
- Better for border areas between cities

#### 2. Administrative Access (CRUD)
Controls which events users can create, update, or delete.

**Always City-Based (Not Changing)**
- Based on masteredCity hierarchy assignments
- ROs and RAs are granted specific cities/divisions/regions
- Uses the curated mastered location system
- Ensures consistent administrative boundaries
- Not affected by the viewing access changes

### Nearest City Mapping (nearestLogic)

When venues are created or updated:
1. System takes venue's lat/long coordinates
2. Finds nearest masteredCity using 2dsphere query
3. Assigns `masteredCityId` to venue
4. Event inherits `masteredCityId` from its venue
5. This mapping determines administrative jurisdiction

Example: A venue in Cambridge, MA (lat: 42.3736, lng: -71.1097) would be mapped to nearest mastered city "Boston, MA" if that's the closest in the curated system.

**Important**: Both access models will remain in the end state:
- **Viewing**: Transitioning to flexible geolocation-based
- **Admin**: Remaining with stable city-based grants

### Key Security Checks in Code

1. **Authentication Middleware** (`authMiddleware.js`)
   - Verifies Firebase JWT tokens
   - Loads user's roles from database

2. **Regional Admin Middleware** (`requireRegionalAdmin.js`)
   - Checks RA role
   - Validates localAdminInfo status
   - Ensures granted locations exist

3. **Event Routes** (`serverEvents.js`)
   - PUT/DELETE check both organizer ownership AND city grants
   - Complex permission logic combining multiple access types

## Project Management

### JIRA Integration
- **Project**: CALBE (Calendar Backend)
- **JIRA URL**: https://hdtsllc.atlassian.net
- **Recent Issues**:
  - CALBE-37: Event summary API for map explorer
  - CALBE-36: cityIds filter returns empty for cities with no events
  - CALBE-35: Multi-city filtering support for events API
  - CALBE-33: Venue geocoding with automatic city detection
  - CALBE-32: Winston + MongoDB logging integration

### Git Branches
- **Main Branch**: DEVL (for development)
- **Production**: PROD
- **Testing**: TEST
- **Feature Branches**: feature/CALBE-XX-description
- **Bugfix Branches**: bugfix/CALBE-XX-description

## Development Guidelines

### ALWAYS check what's exported from a module before importing
```bash
grep -n "export.*useAuth\|export.*{.*useAuth" src/app/contexts/AuthContext.js
```

### After creating new components:
```bash
# ALWAYS verify the app still compiles
npm run dev
# or at minimum check the browser console for errors
```