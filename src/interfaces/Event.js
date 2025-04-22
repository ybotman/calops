/**
 * Event Interface
 * Defines the structure of event objects in the system
 */

/**
 * @typedef {Object} EventLocation
 * @property {string} venueName - Name of the venue
 * @property {string} [venueId] - ID of the venue (optional)
 * @property {string} address - Street address
 * @property {string} city - City name
 * @property {string} [region] - Region/state/province
 * @property {string} [country] - Country name
 * @property {string} [postalCode] - Postal/zip code
 * @property {Object} [coordinates] - Geographic coordinates
 * @property {number} [coordinates.latitude] - Latitude
 * @property {number} [coordinates.longitude] - Longitude
 */

/**
 * @typedef {Object} EventOrganizer
 * @property {string} organizerId - ID of the organizer
 * @property {string} name - Name of the organizer
 * @property {string} [email] - Contact email
 * @property {string} [phone] - Contact phone
 * @property {string} [website] - Organizer website
 */

/**
 * @typedef {Object} Event
 * @property {string} _id - Unique identifier for the event
 * @property {string} title - Event title/name
 * @property {string} [description] - Detailed description of the event
 * @property {string} [shortDescription] - Brief summary of the event
 * @property {Date|string} startDate - Start date and time of the event
 * @property {Date|string} endDate - End date and time of the event
 * @property {EventLocation} location - Location information
 * @property {string} masteredRegionName - Name of the mastered region
 * @property {string} masteredCityName - Name of the mastered city
 * @property {EventOrganizer} organizer - Organizer information
 * @property {string[]} [tags] - Array of tags or categories
 * @property {string} [imageUrl] - URL to the event's featured image
 * @property {string} [status] - Event status (e.g., active, cancelled, postponed)
 * @property {boolean} active - Whether the event is active
 * @property {boolean} [featured] - Whether the event is featured
 * @property {string} appId - Application ID this event belongs to
 * @property {Date} createdAt - When the event was created
 * @property {Date} updatedAt - When the event was last updated
 */

export default {};