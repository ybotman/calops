# PMR_BTC_EVENT_Import API Changes

This document details the API endpoints required for the Boston Tango Calendar (BTC) to TangoTiempo (TT) event import process. No significant API changes are needed, but specific endpoints must be leveraged for the migration.

## Source API (WordPress/BTC)

### The Events Calendar REST API

**Base URL**: `https://bostontangocalendar.com/wp-json/tribe/events/v1/`

#### Endpoints Used:

1. **GET /events**
   - Purpose: Retrieve event listings
   - Query Parameters:
     - `start_date` (YYYY-MM-DD) - Beginning date for event retrieval
     - `end_date` (YYYY-MM-DD) - Ending date for event retrieval
     - `per_page` (int) - Number of events to retrieve
   - Example: `/events?start_date=2025-05-01&end_date=2025-05-01&per_page=50`

2. **GET /events/{id}**
   - Purpose: Retrieve detailed information for a specific event
   - Example: `/events/12345`

#### Response Format (Key Fields):

```json
{
  "id": 12345,
  "title": "Tango Workshop with Instructor",
  "description": "Event description text...",
  "start_date": "2025-05-01 19:00:00",
  "end_date": "2025-05-01 22:00:00",
  "all_day": false,
  "venue": {
    "id": 678,
    "venue": "Dance Studio Name",
    "address": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zip": "02110"
  },
  "organizer": {
    "id": 901,
    "organizer": "Organizer Name",
    "email": "email@example.com"
  },
  "categories": [
    {
      "id": 234,
      "name": "Class",
      "slug": "class"
    }
  ]
}
```

## Target API (TangoTiempo)

### TangoTiempo REST API

**Base URL**: `/api/` (relative to application)

#### Endpoints Used:

1. **GET /api/events**
   - Purpose: Query existing events
   - Query Parameters:
     - `appId` (int) - Application identifier (1 for TangoTiempo)
     - `startDate` (ISO date) - Filter by start date
     - `endDate` (ISO date) - Filter by end date
   - Example: `/api/events?appId=1&startDate=2025-05-01&endDate=2025-05-01`

2. **POST /api/events**
   - Purpose: Create new events
   - Required Fields: See Event Schema below

3. **DELETE /api/events/{id}**
   - Purpose: Remove existing events
   - Example: `/api/events/abcd1234`

4. **GET /api/venues**
   - Purpose: Look up venue data for mapping
   - Query Parameters: 
     - `name` (string) - Filter by venue name
   - Example: `/api/venues?name=Dance%20Studio%20Name`

5. **GET /api/organizers**
   - Purpose: Look up organizer data for mapping
   - Query Parameters:
     - `name` (string) - Filter by organizer name
   - Example: `/api/organizers?name=Organizer%20Name`

6. **GET /api/event-categories**
   - Purpose: Retrieve event categories for mapping
   - Example: `/api/event-categories`

## Target Event Schema

The migration script must map WordPress event data to the TangoTiempo event schema:

```json
{
  "title": "String - Event title",
  "description": "String - Event description",
  "startDate": "Date - ISO format start date/time",
  "endDate": "Date - ISO format end date/time",
  "allDay": "Boolean - Whether event is all day",
  "venueId": "String/ObjectId - Reference to venue collection",
  "organizerId": "String/ObjectId - Reference to organizer collection",
  "categoryId": "String/ObjectId - Reference to category collection",
  "appId": "Number - Application identifier (1 for TangoTiempo)",
  "status": "String - Event status (e.g., 'active')",
  "createdAt": "Date - Creation timestamp",
  "updatedAt": "Date - Last update timestamp"
}
```

## API Authentication

- **WordPress API**: Public read access, no authentication required
- **TangoTiempo API**: Requires authentication token in request headers:
  ```
  Authorization: Bearer <token>
  ```

## API Usage Considerations

1. **Rate Limiting**:
   - WordPress API may have rate limits that need to be respected
   - Implement delay between requests to avoid server overload

2. **Batch Processing**:
   - Process events in daily batches to manage load
   - Consider using bulk insert operations for efficiency

3. **Error Handling**:
   - Implement retry logic for transient API failures
   - Log detailed error information for troubleshooting

4. **Date/Time Handling**:
   - WordPress provides dates in local timezone
   - Convert to UTC/ISO format for TangoTiempo

## API Integration Testing

Before proceeding with the migration:

1. Verify WordPress API access and response format
2. Test venue, organizer, and category lookup functionality
3. Validate event creation and deletion operations
4. Test idempotent operation (repeated imports don't create duplicates)