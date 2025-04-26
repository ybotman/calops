/**
 * GeolocationResolver Service
 * Centralized service for handling venue geolocation resolution,
 * with fallbacks to Boston defaults when needed.
 */

import axios from 'axios';

class GeolocationResolver {
  // Boston defaults as fallback
  static BOSTON_DEFAULTS = {
    masteredCityId: "64f26a9f75bfc0db12ed7a1e",
    masteredCityName: "Boston",
    masteredDivisionId: "64f26a9f75bfc0db12ed7a15",
    masteredDivisionName: "Massachusetts",
    masteredRegionId: "64f26a9f75bfc0db12ed7a12",
    masteredRegionName: "New England",
    coordinates: [-71.0589, 42.3601] // Boston coordinates [longitude, latitude]
  };

  /**
   * Get coordinates from masteredCity (for manual venue creation)
   * @param {string} masteredCityId - The ID of the mastered city
   * @param {boolean} fallbackToBostonDefaults - Whether to use Boston defaults on failure
   * @returns {Promise<Object>} - Object containing latitude, longitude and source
   */
  static async getCityCoordinates(masteredCityId, fallbackToBostonDefaults = true) {
    try {
      if (!masteredCityId) {
        throw new Error('City ID is required');
      }

      // Try to get city details from API
      const response = await axios.get(`/api/geo-hierarchy/cities/${masteredCityId}`);
      
      if (response.data && response.data.geolocation && 
          response.data.geolocation.coordinates && 
          response.data.geolocation.coordinates.length === 2) {
        return {
          latitude: response.data.geolocation.coordinates[1],
          longitude: response.data.geolocation.coordinates[0],
          source: 'city'
        };
      }
      
      throw new Error('City coordinates not available');
    } catch (error) {
      console.error(`Error getting coordinates for city ${masteredCityId}:`, error.message);
      
      if (fallbackToBostonDefaults) {
        console.warn(`Using Boston default coordinates for city ID ${masteredCityId}`);
        return {
          latitude: this.BOSTON_DEFAULTS.coordinates[1],
          longitude: this.BOSTON_DEFAULTS.coordinates[0],
          source: 'boston_fallback'
        };
      }
      throw error;
    }
  }

  /**
   * Find nearest city for coordinates
   * @param {number} longitude - Longitude coordinate
   * @param {number} latitude - Latitude coordinate
   * @param {boolean} fallbackToBostonDefaults - Whether to use Boston defaults on failure
   * @returns {Promise<Object>} - Object containing nearest city information
   */
  static async findNearestCity(longitude, latitude, fallbackToBostonDefaults = true) {
    try {
      if (longitude === undefined || latitude === undefined) {
        throw new Error('Both longitude and latitude are required');
      }

      const response = await axios.get('/api/venues/nearest-city', {
        params: { 
          longitude, 
          latitude, 
          limit: 1 
        }
      });
      
      if (response.data && response.data.length > 0) {
        return {
          masteredCityId: response.data[0]._id,
          masteredCityName: response.data[0].cityName,
          masteredDivisionId: response.data[0].masteredDivisionId?._id || '',
          masteredRegionId: response.data[0].masteredDivisionId?.masteredRegionId?._id || '',
          distance: response.data[0].distanceInKm,
          source: 'nearest_city'
        };
      }
      throw new Error('No nearby city found');
    } catch (error) {
      console.error(`Error finding nearest city:`, error.message);
      
      if (fallbackToBostonDefaults) {
        console.warn(`Using Boston defaults: ${error.message}`);
        return {
          masteredCityId: this.BOSTON_DEFAULTS.masteredCityId,
          masteredCityName: this.BOSTON_DEFAULTS.masteredCityName,
          masteredDivisionId: this.BOSTON_DEFAULTS.masteredDivisionId,
          masteredRegionId: this.BOSTON_DEFAULTS.masteredRegionId,
          distance: null,
          source: 'boston_fallback'
        };
      }
      throw error;
    }
  }

  /**
   * Ensure a venue form has valid coordinates
   * @param {Object} venueForm - The venue form data
   * @returns {Object} - The updated venue form with coordinates
   */
  static async ensureVenueHasCoordinates(venueForm) {
    // If coordinates already exist, return as is
    if (venueForm.latitude && venueForm.longitude) {
      return venueForm;
    }

    // If no masteredCityId, can't get coordinates
    if (!venueForm.masteredCityId) {
      return venueForm;
    }

    try {
      // Try to get coordinates from city
      const cityCoords = await this.getCityCoordinates(venueForm.masteredCityId);
      
      return {
        ...venueForm,
        latitude: cityCoords.latitude,
        longitude: cityCoords.longitude,
        coordinatesSource: cityCoords.source
      };
    } catch (error) {
      console.error('Error ensuring venue has coordinates:', error);
      
      // Return unchanged if we can't get coordinates
      return venueForm;
    }
  }

  /**
   * Prepare venue data for API submission
   * Ensures all required geolocation fields are set
   * @param {Object} venueData - The venue data to prepare
   * @returns {Object} - The prepared venue data
   */
  static prepareVenueForSubmission(venueData) {
    const prepared = { ...venueData };

    // If no coordinates but has masteredCityId, use Boston defaults
    if ((!prepared.latitude || !prepared.longitude) && prepared.masteredCityId) {
      prepared.latitude = this.BOSTON_DEFAULTS.coordinates[1];
      prepared.longitude = this.BOSTON_DEFAULTS.coordinates[0];
      prepared.coordinatesSource = 'boston_fallback';
    }

    // Ensure GeoJSON format for backend
    if (prepared.latitude && prepared.longitude) {
      prepared.geolocation = {
        type: "Point",
        coordinates: [parseFloat(prepared.longitude), parseFloat(prepared.latitude)]
      };
    }

    return prepared;
  }
}

export default GeolocationResolver;