# PMR_BTC_EVENT_Import API Formats

This document details the API formats for both Boston Tango Calendar (BTC) WordPress and TangoTiempo (TT) systems to support the import process.

## WordPress/BTC API Formats

### Event Endpoints

#### GET /wp-json/tribe/events/v1/events

**Parameters:**
- `start_date` (required): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD
- `per_page` (optional): Number of results (default: 10, max: 50)
- `page` (optional): Page number for pagination

**Response Format:**
```json
{
  "events": [
    {
      "id": 12345,
      "global_id": "bostontangocalendar.com?id=12345",
      "global_id_lineage": ["bostontangocalendar.com?id=12345"],
      "author": "1",
      "status": "publish",
      "date": "2025-04-15 09:30:27",
      "date_utc": "2025-04-15 13:30:27",
      "modified": "2025-04-16 11:24:18",
      "modified_utc": "2025-04-16 15:24:18",
      "url": "https://bostontangocalendar.com/event/tango-workshop/",
      "rest_url": "https://bostontangocalendar.com/wp-json/tribe/events/v1/events/12345",
      "title": "Tango Workshop with Instructor",
      "description": "<p>Event description text with <strong>HTML formatting</strong>...</p>",
      "excerpt": "Event excerpt text...",
      "slug": "tango-workshop",
      "image": {
        "url": "https://bostontangocalendar.com/wp-content/uploads/2025/04/event-image.jpg",
        "id": 5678,
        "title": "Event Image",
        "sizes": {
          "thumbnail": {"width": 150, "height": 150, "url": "..."},
          "medium": {"width": 300, "height": 200, "url": "..."},
          "large": {"width": 1024, "height": 683, "url": "..."}
        }
      },
      "all_day": false,
      "start_date": "2025-05-01 19:00:00",
      "start_date_details": {
        "year": "2025",
        "month": "05",
        "day": "01",
        "hour": "19",
        "minutes": "00",
        "seconds": "00"
      },
      "end_date": "2025-05-01 22:00:00",
      "end_date_details": {
        "year": "2025",
        "month": "05",
        "day": "01",
        "hour": "22",
        "minutes": "00",
        "seconds": "00"
      },
      "utc_start_date": "2025-05-01 23:00:00",
      "utc_start_date_details": {
        "year": "2025",
        "month": "05",
        "day": "01",
        "hour": "23",
        "minutes": "00",
        "seconds": "00"
      },
      "utc_end_date": "2025-05-02 02:00:00",
      "utc_end_date_details": {
        "year": "2025",
        "month": "05",
        "day": "02",
        "hour": "02",
        "minutes": "00",
        "seconds": "00"
      },
      "timezone": "America/New_York",
      "timezone_abbr": "EDT",
      "cost": "$20",
      "cost_details": {
        "currency_symbol": "$",
        "currency_position": "prefix",
        "values": ["20"]
      },
      "website": "",
      "show_map": true,
      "show_map_link": true,
      "hide_from_listings": false,
      "sticky": false,
      "featured": false,
      "categories": [
        {
          "id": 234,
          "name": "Class",
          "slug": "class",
          "description": "",
          "term_group": 0,
          "term_taxonomy_id": 234,
          "taxonomy": "tribe_events_cat",
          "parent": 0,
          "count": 15,
          "url": "https://bostontangocalendar.com/events/category/class/"
        }
      ],
      "tags": [],
      "venue": {
        "id": 678,
        "author": "1",
        "date": "2024-01-15 14:22:37",
        "date_utc": "2024-01-15 19:22:37",
        "modified": "2024-01-15 14:22:37",
        "modified_utc": "2024-01-15 19:22:37",
        "status": "publish",
        "url": "https://bostontangocalendar.com/venue/dance-studio-name/",
        "venue": "Dance Studio Name",
        "slug": "dance-studio-name",
        "address": "123 Main St",
        "city": "Boston",
        "country": "United States",
        "province": "MA",
        "state": "MA",
        "zip": "02110",
        "phone": "",
        "website": "",
        "stateprovince": "MA",
        "geo_lat": 42.3601,
        "geo_lng": -71.0589,
        "show_map": true,
        "show_map_link": true
      },
      "organizer": {
        "id": 901,
        "author": "1",
        "date": "2024-01-10 09:15:44",
        "date_utc": "2024-01-10 14:15:44",
        "modified": "2024-01-10 09:15:44",
        "modified_utc": "2024-01-10 14:15:44",
        "status": "publish",
        "url": "https://bostontangocalendar.com/organizer/organizer-name/",
        "organizer": "Organizer Name",
        "slug": "organizer-name",
        "phone": "",
        "website": "",
        "email": "email@example.com"
      }
    }
  ],
  "total": 125,
  "total_pages": 3,
  "next_rest_url": "https://bostontangocalendar.com/wp-json/tribe/events/v1/events?page=2&start_date=2025-05-01&per_page=50",
  "prev_rest_url": ""
}
```

#### GET /wp-json/tribe/events/v1/events/{id}

**Response Format:**
Same as individual event object in the list response.

### Venue Endpoint

#### GET /wp-json/tribe/events/v1/venues

**Response Format:**
```json
{
  "venues": [
    {
      "id": 678,
      "author": "1",
      "date": "2024-01-15 14:22:37",
      "date_utc": "2024-01-15 19:22:37",
      "modified": "2024-01-15 14:22:37",
      "modified_utc": "2024-01-15 19:22:37",
      "status": "publish",
      "url": "https://bostontangocalendar.com/venue/dance-studio-name/",
      "venue": "Dance Studio Name",
      "slug": "dance-studio-name",
      "address": "123 Main St",
      "city": "Boston",
      "country": "United States",
      "province": "MA",
      "state": "MA",
      "zip": "02110",
      "phone": "",
      "website": "",
      "stateprovince": "MA",
      "geo_lat": 42.3601,
      "geo_lng": -71.0589,
      "show_map": true,
      "show_map_link": true
    }
  ],
  "total": 45,
  "total_pages": 5,
  "next_rest_url": "https://bostontangocalendar.com/wp-json/tribe/events/v1/venues?page=2&per_page=10",
  "prev_rest_url": ""
}
```

### Organizer Endpoint

#### GET /wp-json/tribe/events/v1/organizers

**Response Format:**
```json
{
  "organizers": [
    {
      "id": 901,
      "author": "1",
      "date": "2024-01-10 09:15:44",
      "date_utc": "2024-01-10 14:15:44",
      "modified": "2024-01-10 09:15:44",
      "modified_utc": "2024-01-10 14:15:44",
      "status": "publish",
      "url": "https://bostontangocalendar.com/organizer/organizer-name/",
      "organizer": "Organizer Name",
      "slug": "organizer-name",
      "phone": "",
      "website": "",
      "email": "email@example.com"
    }
  ],
  "total": 30,
  "total_pages": 3,
  "next_rest_url": "https://bostontangocalendar.com/wp-json/tribe/events/v1/organizers?page=2&per_page=10",
  "prev_rest_url": ""
}
```

### Category Endpoint

#### GET /wp-json/tribe/events/v1/categories

**Response Format:**
```json
{
  "categories": [
    {
      "id": 234,
      "name": "Class",
      "slug": "class",
      "description": "",
      "term_group": 0,
      "term_taxonomy_id": 234,
      "taxonomy": "tribe_events_cat",
      "parent": 0,
      "count": 15,
      "url": "https://bostontangocalendar.com/events/category/class/"
    }
  ],
  "total": 12,
  "total_pages": 2,
  "next_rest_url": "https://bostontangocalendar.com/wp-json/tribe/events/v1/categories?page=2&per_page=10",
  "prev_rest_url": ""
}
```

## TangoTiempo API Formats

### Event Endpoints

#### GET /api/events

**Parameters:**
- `appId` (required): Application ID (usually "1")
- `startDate` (optional): ISO date format
- `endDate` (optional): ISO date format
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 400)
- Various filter parameters: organizerId, venueId, masteredCityId, etc.

**Response Format:**
```json
{
  "events": [
    {
      "_id": "60f8a53db3e10c001f7c9876",
      "title": "Tango Workshop with Instructor",
      "description": "Event description text...",
      "startDate": "2025-05-01T23:00:00.000Z",
      "endDate": "2025-05-02T02:00:00.000Z",
      "categoryFirst": "Class",
      "categoryFirstId": "60d8a53db3e10c001f7c1234",
      "categorySecond": null,
      "categorySecondId": null,
      "categoryThird": null,
      "categoryThirdId": null,
      "ownerOrganizerID": "60d8a53db3e10c001f7c2345",
      "grantedOrganizerID": null,
      "alternateOrganizerID": null,
      "grantedOrganizerName": null,
      "alternateOrganizerName": null,
      "locationName": "Dance Studio Name",
      "ownerOrganizerName": "Organizer Name",
      "masteredRegionName": "Northeast",
      "masteredDivisionName": "New England",
      "masteredCityName": "Boston",
      "masteredRegionId": "60d8a53db3e10c001f7c3456",
      "masteredDivisionId": "60d8a53db3e10c001f7c4567",
      "masteredCityId": "60d8a53db3e10c001f7c5678",
      "masteredCityGeolocation": {
        "type": "Point",
        "coordinates": [-71.0589, 42.3601]
      },
      "eventImage": null,
      "bannerImage": null,
      "featuredImage": null,
      "seriesImages": [],
      "venueID": "60d8a53db3e10c001f7c6789",
      "venueGeolocation": {
        "type": "Point",
        "coordinates": [-71.0589, 42.3601]
      },
      "recurrenceRule": null,
      "isDiscovered": true,
      "isOwnerManaged": false,
      "isActive": true,
      "isFeatured": false,
      "isCanceled": false,
      "isRepeating": false,
      "discoveredLastDate": "2025-04-24T14:30:00.000Z",
      "discoveredFirstDate": "2025-04-24T14:30:00.000Z",
      "discoveredComments": "Imported from BTC",
      "cost": "$20",
      "expiresAt": "2025-05-03T02:00:00.000Z",
      "appId": "1"
    }
  ],
  "pagination": {
    "total": 125,
    "page": 1,
    "limit": 400,
    "pages": 1
  },
  "filterType": "dateOnly",
  "query": {
    "region": null,
    "regionId": null,
    "division": null,
    "divisionId": null,
    "city": null,
    "cityId": null,
    "venue": null,
    "organizer": null,
    "category": null,
    "search": null,
    "geolocation": null,
    "useGeoSearch": false,
    "useObjectIds": false,
    "sortByDistance": false,
    "dateRange": {
      "start": "2025-05-01T00:00:00.000Z",
      "end": "2025-05-31T23:59:59.999Z"
    }
  }
}
```

#### POST /api/events/post

**Request Format:**
```json
{
  "appId": "1",
  "title": "Tango Workshop with Instructor",
  "description": "Event description text...",
  "startDate": "2025-05-01T23:00:00.000Z",
  "endDate": "2025-05-02T02:00:00.000Z",
  "ownerOrganizerID": "60d8a53db3e10c001f7c2345",
  "ownerOrganizerName": "Organizer Name",
  "venueID": "60d8a53db3e10c001f7c6789",
  "categoryFirstId": "60d8a53db3e10c001f7c1234",
  "categoryFirst": "Class",
  "cost": "$20",
  "isDiscovered": true,
  "isOwnerManaged": false,
  "discoveredLastDate": "2025-04-24T14:30:00.000Z",
  "discoveredFirstDate": "2025-04-24T14:30:00.000Z",
  "discoveredComments": "Imported from BTC event ID: 12345",
  "expiresAt": "2025-05-03T02:00:00.000Z"
}
```

**Response Format:**
```json
{
  "_id": "60f8a53db3e10c001f7c9876",
  "title": "Tango Workshop with Instructor",
  "description": "Event description text...",
  "startDate": "2025-05-01T23:00:00.000Z",
  "endDate": "2025-05-02T02:00:00.000Z",
  "ownerOrganizerID": "60d8a53db3e10c001f7c2345",
  "ownerOrganizerName": "Organizer Name",
  "venueID": "60d8a53db3e10c001f7c6789",
  "categoryFirstId": "60d8a53db3e10c001f7c1234",
  "categoryFirst": "Class",
  "isDiscovered": true,
  "isOwnerManaged": false,
  "isActive": true,
  "isFeatured": false,
  "isCanceled": false,
  "discoveredLastDate": "2025-04-24T14:30:00.000Z",
  "discoveredFirstDate": "2025-04-24T14:30:00.000Z",
  "discoveredComments": "Imported from BTC event ID: 12345",
  "cost": "$20",
  "expiresAt": "2025-05-03T02:00:00.000Z",
  "appId": "1"
}
```

### Venue Endpoints

#### GET /api/venues

**Parameters:**
- `appId` (required): Application ID (usually "1")
- `name` (optional): Venue name for searching
- `page` (optional): Page number
- `limit` (optional): Results per page
- `isActive` (optional): Filter by active status

**Response Format:**
```json
{
  "venues": [
    {
      "_id": "60d8a53db3e10c001f7c6789",
      "name": "Dance Studio Name",
      "shortName": "",
      "address1": "123 Main St",
      "address2": "",
      "address3": "",
      "city": "Boston",
      "state": "MA",
      "zip": "02110",
      "phone": "",
      "comments": "",
      "latitude": 42.3601,
      "longitude": -71.0589,
      "geolocation": {
        "type": "Point",
        "coordinates": [-71.0589, 42.3601]
      },
      "masteredCityId": "60d8a53db3e10c001f7c5678",
      "masteredDivisionId": "60d8a53db3e10c001f7c4567",
      "masteredRegionId": "60d8a53db3e10c001f7c3456",
      "masteredCountryId": "60d8a53db3e10c001f7c7890",
      "isActive": true,
      "createdAt": "2024-01-15T19:22:37.000Z",
      "updatedAt": "2024-01-15T19:22:37.000Z",
      "appId": "1"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 100,
    "pages": 1
  }
}
```

#### GET /api/venues/{id}

**Response Format:**
```json
{
  "_id": "60d8a53db3e10c001f7c6789",
  "name": "Dance Studio Name",
  "shortName": "",
  "address1": "123 Main St",
  "address2": "",
  "address3": "",
  "city": "Boston",
  "state": "MA",
  "zip": "02110",
  "phone": "",
  "comments": "",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "geolocation": {
    "type": "Point",
    "coordinates": [-71.0589, 42.3601]
  },
  "masteredCityId": {
    "_id": "60d8a53db3e10c001f7c5678",
    "cityName": "Boston",
    "masteredDivisionId": {
      "_id": "60d8a53db3e10c001f7c4567",
      "divisionName": "New England",
      "masteredRegionId": {
        "_id": "60d8a53db3e10c001f7c3456",
        "regionName": "Northeast",
        "masteredCountryId": {
          "_id": "60d8a53db3e10c001f7c7890",
          "countryName": "United States"
        }
      }
    }
  },
  "masteredDivisionId": "60d8a53db3e10c001f7c4567",
  "masteredRegionId": "60d8a53db3e10c001f7c3456",
  "masteredCountryId": "60d8a53db3e10c001f7c7890",
  "isActive": true,
  "createdAt": "2024-01-15T19:22:37.000Z",
  "updatedAt": "2024-01-15T19:22:37.000Z",
  "appId": "1"
}
```

### Organizer Endpoints

#### GET /api/organizers

**Parameters:**
- `appId` (required): Application ID (usually "1")
- `name` (optional): Organizer name for searching
- `btcNiceName` (optional): BTC organizer name for direct mapping
- `page` (optional): Page number
- `limit` (optional): Results per page
- `isActive` (optional): Filter by active status

**Response Format:**
```json
{
  "organizers": [
    {
      "_id": "60d8a53db3e10c001f7c2345",
      "appId": "1",
      "linkedUserLogin": null,
      "firebaseUserId": null,
      "fullName": "Organizer Name",
      "shortName": "Organizer",
      "description": "Organizer description...",
      "publicContactInfo": {
        "phone": "",
        "Email": "email@example.com",
        "url": "",
        "address": {
          "street1": "",
          "street2": "",
          "city": "",
          "state": "",
          "postalCode": ""
        }
      },
      "delegatedOrganizerIds": [],
      "organizerPublicImageURL": null,
      "wantRender": false,
      "isActive": true,
      "isEnabled": true,
      "isRendered": false,
      "organizerBannerImage": "/defaults/banner.png",
      "organizerProfileImage": "/defaults/profile.png",
      "organizerLandscapeImage": "/defaults/landscape.png",
      "organizerLogoImage": "/defaults/logo.png",
      "images": [],
      "organizerRegion": "60d8a53db3e10c001f7c3456",
      "organizerDivision": "60d8a53db3e10c001f7c4567",
      "organizerCity": "60d8a53db3e10c001f7c5678",
      "organizerTypes": {
        "isEventOrganizer": true,
        "isVenue": false,
        "isTeacher": false,
        "isMaestro": false,
        "isDJ": false,
        "isOrchestra": false
      },
      "updatedAt": "2024-01-10T14:15:44.000Z",
      "lastEventActivityAsOrganizer": "2024-01-10T14:15:44.000Z",
      "isActiveAsOrganizer": true,
      "btcNiceName": "Organizer Name"
    }
  ],
  "pagination": {
    "total": 30,
    "page": 1,
    "limit": 100,
    "pages": 1
  }
}
```

### Category Endpoints

#### GET /api/event-categories

**Parameters:**
- `appId` (required): Application ID (usually "1")
- `categoryName` (optional): Category name for searching
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response Format:**
```json
{
  "categories": [
    {
      "_id": "60d8a53db3e10c001f7c1234",
      "appId": "1",
      "categoryName": "Class",
      "categoryCode": "CLASS",
      "categoryNameAbbreviation": "CLAS",
      "createdAt": "2024-01-05T10:00:00.000Z",
      "updatedAt": "2024-01-05T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 100,
    "pages": 1
  }
}
```

## Field Mapping Table

| BTC Field | TT Field | Notes |
|-----------|----------|-------|
| `title` | `title` | Direct mapping |
| `description` | `description` | Direct mapping |
| `utc_start_date` | `startDate` | Convert to ISO format |
| `utc_end_date` | `endDate` | Convert to ISO format |
| `all_day` | `allDay` | Direct mapping |
| `cost` | `cost` | Direct mapping |
| `venue.id` | Used for lookup | Not stored in TT |
| `venue.venue` | Used for lookup | Not stored in TT |
| `venue` (object) | `venueID` | Store ObjectId reference |
| `organizer.id` | Used for lookup | Not stored in TT |
| `organizer.organizer` | Used for lookup | Not stored in TT |
| `organizer` (object) | `ownerOrganizerID` | Store ObjectId reference |
| `organizer.organizer` | `ownerOrganizerName` | Direct mapping |
| `categories[0].name` | Used for lookup | Not stored in TT |
| Mapped category | `categoryFirst` | Name after mapping |
| Mapped category | `categoryFirstId` | ObjectId reference |
| `categories[1].name` | Used for lookup | Not stored in TT |
| Mapped category | `categorySecond` | Name after mapping |
| Mapped category | `categorySecondId` | ObjectId reference |
| N/A | `appId` | Set to "1" for TangoTiempo |
| N/A | `isDiscovered` | Set to `true` |
| N/A | `isOwnerManaged` | Set to `false` |
| N/A | `isActive` | Set to `true` |
| N/A | `isCanceled` | Set to `false` |
| N/A | `discoveredFirstDate` | Set to import timestamp |
| N/A | `discoveredLastDate` | Set to import timestamp |
| N/A | `discoveredComments` | Set to "Imported from BTC event ID: {id}" |
| N/A | `expiresAt` | Calculate from `endDate` + 1 day |

## Authentication Requirements

### BTC WordPress API
- No authentication required for GET requests
- Public read-only access

### TangoTiempo API
- Authentication required for POST/PUT/DELETE operations
- JWT token format: `Bearer {token}`
- Required for event creation

## Rate Limiting

### BTC WordPress API
- Rate limits provided in headers:
  - `x-ratelimit-limit`: Maximum number of requests
  - `x-ratelimit-remaining`: Remaining requests
  - `x-ratelimit-reset`: Reset time in seconds

### TangoTiempo API
- Rate limiting implemented but not explicitly documented
- Standard HTTP 429 response when limit exceeded