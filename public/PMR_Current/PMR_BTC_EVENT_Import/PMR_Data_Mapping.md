# PMR_BTC_EVENT_Import Data Mapping

This document details the field-by-field mapping between the Boston Tango Calendar (BTC) WordPress event data and the TangoTiempo (TT) event schema.

## Field Mapping Table

| BTC Field (WordPress) | TT Field (MongoDB) | Transformation | Notes |
|----------------------|-------------------|----------------|-------|
| `id` | N/A | Store as metadata | Used for reference only, not stored in TT |
| `title` | `title` | Direct mapping | No transformation needed |
| `description` | `description` | HTML cleanup | Remove WordPress-specific formatting if needed |
| `start_date` | `startDate` | Convert to ISO UTC | Format: `2025-05-01T19:00:00Z` |
| `end_date` | `endDate` | Convert to ISO UTC | Format: `2025-05-01T22:00:00Z` |
| `all_day` | `allDay` | Direct mapping | Boolean value |
| `url` | `url` | Direct mapping | External URL (if applicable) |
| `venue.venue` | N/A | Lookup reference | Used to find matching venueId |
| `venue.id` | N/A | Store as metadata | Used for reference only |
| `venue.address` | N/A | Verify in TT | Used for verification during lookup |
| `venue.city` | N/A | Verify in TT | Used for verification during lookup |
| `organizer.organizer` | N/A | Lookup reference | Used to find matching organizerId |
| `organizer.id` | N/A | Store as metadata | Used for reference only |
| `categories[].name` | N/A | Lookup reference | Used to find matching categoryId |
| N/A | `appId` | Set value: 1 | TangoTiempo app identifier |
| N/A | `status` | Set value: "active" | Default status for imported events |
| N/A | `createdAt` | Current timestamp | When import creates the record |
| N/A | `updatedAt` | Current timestamp | When import creates the record |

## Entity Resolution Process

### 1. Venue Lookup
Venues are matched by name between BTC and TT systems:

```javascript
// Pseudo-code for venue lookup
async function lookupVenue(btcVenue) {
  // Search for venue by name
  const ttVenue = await api.get(`/api/venues?name=${encodeURIComponent(btcVenue.venue)}`);
  
  if (ttVenue && ttVenue.length > 0) {
    return ttVenue[0]._id; // Return the venueId
  }
  
  // Log unmatched venue for manual resolution
  logUnmatchedEntity('venue', btcVenue);
  return null;
}
```

### 2. Organizer Lookup
Organizers are matched by name between BTC and TT systems:

```javascript
// Pseudo-code for organizer lookup
async function lookupOrganizer(btcOrganizer) {
  // Search for organizer by name
  const ttOrganizer = await api.get(`/api/organizers?name=${encodeURIComponent(btcOrganizer.organizer)}`);
  
  if (ttOrganizer && ttOrganizer.length > 0) {
    return ttOrganizer[0]._id; // Return the organizerId
  }
  
  // Log unmatched organizer for manual resolution
  logUnmatchedEntity('organizer', btcOrganizer);
  return null;
}
```

### 3. Category Mapping
Categories use the predefined mapping file at `/public/importingBTC/categoryMapping.js`:

```javascript
// Actual code from categoryMapping.js
export const categoryNameMap = {
  "Class": "Class",
  "Drop-in Class": "Class",
  "Progressive Class": "Class",
  "Workshop": "Workshop",
  "DayWorkshop": "DayWorkshop",
  "Festivals": "Festival",
  "Milonga": "Milonga",
  "Practica": "Practica",
  "Trips-Hosted": "Trip",
  "Virtual": "Virtual",
  "Party/Gathering": "Gathering",
  "Live Orchestra": "Orchestra",
  "Concert/Show": "Concert",
  "Forum/RoundTable/Labs": "Forum",
  "First Timer Friendly": "NewBee",
};

// Optionally handle unmapped or ignored categories
export const ignoredCategories = new Set([
  "Canceled",
  "Other",
]);

// Helper: maps incoming name to TT name or null if ignored/unmapped
export function mapToTTCategory(sourceName) {
  if (ignoredCategories.has(sourceName)) return null;
  return categoryNameMap[sourceName] || null;
}
```

After mapping the name, look up the corresponding category ID:

```javascript
// Pseudo-code for category lookup
async function lookupCategory(btcCategory) {
  // Map category name using the mapping file
  const ttCategoryName = mapToTTCategory(btcCategory.name);
  
  if (!ttCategoryName) {
    return null; // Category is ignored or unmapped
  }
  
  // Look up category ID by mapped name
  const ttCategory = await api.get(`/api/event-categories?name=${encodeURIComponent(ttCategoryName)}`);
  
  if (ttCategory && ttCategory.length > 0) {
    return ttCategory[0]._id; // Return the categoryId
  }
  
  // Log unmatched category for manual resolution
  logUnmatchedEntity('category', { 
    original: btcCategory.name, 
    mapped: ttCategoryName 
  });
  return null;
}
```

## Date/Time Handling

BTC provides dates in the format: "2025-05-01 19:00:00" (local time)
TT requires dates in ISO UTC format: "2025-05-01T19:00:00Z"

```javascript
// Pseudo-code for date conversion
function convertToISOUTC(dateString) {
  // Parse the local date string
  const localDate = new Date(dateString.replace(' ', 'T'));
  
  // Convert to ISO UTC string
  return localDate.toISOString();
}
```

## Complete Event Transformation

```javascript
// Pseudo-code for full event transformation
async function transformEvent(btcEvent) {
  // Look up related entities
  const venueId = await lookupVenue(btcEvent.venue);
  const organizerId = await lookupOrganizer(btcEvent.organizer);
  const categoryId = await lookupCategory(btcEvent.categories[0]); // Using primary category
  
  // Create TT event object
  const ttEvent = {
    title: btcEvent.title,
    description: cleanHtml(btcEvent.description),
    startDate: convertToISOUTC(btcEvent.start_date),
    endDate: convertToISOUTC(btcEvent.end_date),
    allDay: btcEvent.all_day,
    url: btcEvent.url,
    venueId: venueId,
    organizerId: organizerId,
    categoryId: categoryId,
    appId: 1, // TangoTiempo app ID
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    // Metadata for tracking
    importMetadata: {
      btcId: btcEvent.id,
      importDate: new Date(),
      venueMapping: btcEvent.venue.venue,
      organizerMapping: btcEvent.organizer.organizer,
      categoryMapping: btcEvent.categories[0].name
    }
  };
  
  // Validate required fields
  if (!venueId || !organizerId || !categoryId) {
    logIncompleteEvent(btcEvent, ttEvent);
    return null; // Skip events with missing required relationships
  }
  
  return ttEvent;
}
```

## Error and Exception Handling

For each type of mapping failure, the system will:

1. Log the failure details (entity type, source value, error reason)
2. Generate a report of all unmapped entities for manual resolution
3. Provide statistics on mapping success rates

The final import will include reconciliation of these mapping exceptions through:
- Manual creation of missing entities in TT
- Updates to the mapping configuration
- Custom handling for special cases