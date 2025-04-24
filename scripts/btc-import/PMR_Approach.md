# PMR: BTC Event Import - API Integration Approach

## Overview
This document outlines the API integration approach used in the BTC Event Import project. It documents the discovered API patterns, authentication requirements, and lessons learned during implementation.

## API Response Structure Patterns

During implementation, we discovered inconsistent API response structures across different endpoints in the TangoTiempo API. This document captures these patterns to assist future integrations.

### API Response Structure by Endpoint

| Endpoint | Response Structure | Example |
|----------|-------------------|---------|
| `/api/venues` | `response.data.data` | `{ data: { data: [{ _id: '123', name: 'Venue' }] } }` |
| `/api/organizers` | `response.data.organizers` | `{ data: { organizers: [{ _id: '123', name: 'Organizer' }] } }` |
| `/api/categories` | `response.data.data` | `{ data: { data: [{ _id: '123', categoryName: 'Class' }] } }` |
| `/api/events` | `response.data.events` | `{ data: { events: [{ _id: '123', title: 'Event' }] } }` |

### API Authentication Requirements

The TangoTiempo API requires authentication for write operations but allows read operations without authentication in some cases:

| Operation | Endpoint | Auth Required | Token Location |
|-----------|----------|--------------|----------------|
| GET | `/api/venues` | No | N/A |
| GET | `/api/organizers` | No | N/A |
| GET | `/api/categories` | No | N/A |
| GET | `/api/events` | No | N/A |
| POST | `/api/events/post` | Yes | Bearer Token in Header |
| PUT | `/api/events/:id` | Yes | Bearer Token in Header |
| DELETE | `/api/events/:id` | Yes | Bearer Token in Header |

## Authentication Implementation

For successful event creation, the import script must include a valid authentication token:

```javascript
// Authentication headers
const headers = {
  'Authorization': `Bearer ${config.authToken}`
};

// API call
const response = await axios.post(`${config.ttApiBase}/events/post`, eventData, { headers });
```

The authentication token must be provided via an environment variable for security:

```bash
# Set token as environment variable
export AUTH_TOKEN=your_token_here

# Or pass directly to script
AUTH_TOKEN=your_token_here node scripts/btc-import/run-actual-import.js
```

## Entity Resolution Strategy

### Venue Resolution
1. Perform exact name match via API: `/api/venues?appId=1&name=Venue+Name`
2. If match found, use `response.data.data[0]._id`
3. If no match, use "NotFound" venue as fallback

### Organizer Resolution
1. Try match by BTC name via API: `/api/organizers?appId=1&btcNiceName=Organizer+Name`
2. If no match, try regular name match: `/api/organizers?appId=1&name=Organizer+Name`
3. If still no match, use "DEFAULT" organizer (`shortName=DEFAULT`) as fallback

### Category Resolution
1. Map BTC category to TT category using mapping file
2. Look up category ID via API: `/api/categories?appId=1&categoryName=Mapped+Name`
3. Use mock category ID if needed for testing

## Lessons Learned

1. **API Response Inconsistency**: TangoTiempo API has inconsistent response structures across endpoints. Always check the specific pattern for each endpoint.

2. **Authentication Requirements**: Authentication is required for all write operations but not for read operations.

3. **Entity Resolution Fallbacks**: Implementing fallbacks for unmatched entities is critical for robust import processes:
   - Use "NotFound" venue for unmatched venues
   - Use "DEFAULT" organizer for unmatched organizers
   - Handle unmapped categories gracefully

4. **API Error Handling**: The API sometimes returns different error codes for similar issues:
   - 401 - Authentication issues
   - 403 - Permission issues
   - 404 - Resource not found
   - 422 - Validation errors

5. **Response Structure Verification**: Always verify the actual structure of API responses rather than assuming consistency.

## Implementation Guidelines

For future integrations with the TangoTiempo API:

1. **Always check response structure** for each specific endpoint
2. **Implement proper authentication** for write operations
3. **Use entity resolution fallbacks** for robust imports
4. **Include comprehensive error handling** with retry mechanisms
5. **Validate data** before sending to API to avoid validation errors

## Related Files
- [btc-import.js](../../btc-import.js) - Main import implementation
- [entity-resolution.js](../../entity-resolution.js) - Entity resolution functions
- [error-handler.js](../../error-handler.js) - Error handling implementation
- [categoryMapping.js](../public/importingBTC/categoryMapping.js) - Category mapping