# Event Ownership Model

## Overview

This document describes the event ownership model in TangoTiempo, which ensures clear ownership of events by organizers and proper filtering based on user roles.

## Core Principles

1. **Event Ownership**
   - Every event MUST have an owner
   - The owner is always the organizer associated with the user's RegionalOrganizer role
   - The ownerOrganizerID is automatically set from the user's profile and cannot be manually selected
   - This ensures data integrity and clear responsibility

2. **Event Visibility (GET)**
   - Regular users see all events in their selected location
   - RegionalOrganizers see events where their organizerId appears in ANY of:
     - ownerOrganizerID (events they created)
     - grantedOrganizerID (events where they're granted access)
     - alternateOrganizerID (events where they're an alternate)
   - This ensures organizers see all events relevant to them

3. **Event Creation (POST)**
   - Only users with the RegionalOrganizer role can create events
   - The ownerOrganizerID is automatically set to the user's associated organizerId
   - The ownerOrganizerName is displayed in the form but is not editable
   - The backend verifies the user is a RegionalOrganizer and has an active organizer profile

## Technical Implementation

### Backend (serverEvents.js)

1. **GET /api/events/byMasteredLocations**
   - Accepts optional userRole and organizerId parameters
   - If userRole is 'RegionalOrganizer', adds $or condition to filter events by:
     ```javascript
     query.$or = [
       { ownerOrganizerID: organizerId },
       { grantedOrganizerID: organizerId },
       { alternateOrganizerID: organizerId }
     ];
     ```

2. **POST /api/events/post**
   - Requires authentication
   - Verifies user has RegionalOrganizer role and active organizer profile
   - Automatically sets ownerOrganizerID from user's profile
   - Validates required fields (title, startDate, endDate)
   - Handles empty string conversions for ObjectId fields

### Frontend 

1. **useEvents.js**
   - Automatically adds role and organizerId to event fetch parameters when user is a RegionalOrganizer

2. **CreateEventDetailsBasic.js**
   - Removes editable organizer dropdown
   - Displays the owner organizer name in a non-editable field
   - Sets organization details from the user's profile

## Data Model

The Events collection has three organizer reference fields:

```javascript
ownerOrganizerID: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Organizers",
  required: true,
},
grantedOrganizerID: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Organizers",
  required: false,
},
alternateOrganizerID: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Organizers",
  required: false,
}
```

This model ensures:
1. Clear ownership of every event
2. Proper visibility for RegionalOrganizers
3. Integrity in the event creation process