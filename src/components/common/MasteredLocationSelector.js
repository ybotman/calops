/**
 * MasteredLocationSelector Component
 * Multi-level dropdown selector for mastered locations (countries, regions, divisions, cities)
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import masteredLocationsApi from '@/lib/api-client/mastered-locations';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

/**
 * MasteredLocationSelector component for selecting multiple locations from a hierarchy
 */
const MasteredLocationSelector = ({
  level = 'cities', // 'countries', 'regions', 'divisions', 'cities'
  selectedIds = [],
  onChange,
  label,
  appId = '1',
  disabled = false,
  error = false,
  helperText = '',
  fullWidth = true,
  size = 'medium'
}) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Fetch locations based on level
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setApiError('');
      
      try {
        let response;
        const options = { appId, isActive: true, limit: 500 };
        
        switch (level) {
          case 'countries':
            response = await masteredLocationsApi.getCountries(options);
            setLocations(response.countries || []);
            break;
          case 'regions':
            response = await masteredLocationsApi.getRegions(options);
            setLocations(response.regions || []);
            break;
          case 'divisions':
            response = await masteredLocationsApi.getDivisions(options);
            setLocations(response.divisions || []);
            break;
          case 'cities':
            response = await masteredLocationsApi.getCities(options);
            setLocations(response.cities || []);
            break;
          default:
            setLocations([]);
        }
      } catch (err) {
        console.error(`Error fetching ${level}:`, err);
        setApiError(`Failed to load ${level}`);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [level, appId]);

  // Handle selection change
  const handleChange = (event) => {
    const value = event.target.value;
    // Ensure value is always an array
    const newValue = typeof value === 'string' ? value.split(',') : value;
    onChange(newValue);
  };

  // Get display name for location based on level
  const getLocationDisplayName = (location) => {
    switch (level) {
      case 'countries':
        return location.countryName || location.name || 'Unnamed Country';
      case 'regions':
        return location.regionName || location.name || 'Unnamed Region';
      case 'divisions':
        return location.divisionName || location.name || 'Unnamed Division';
      case 'cities':
        return location.cityName || location.name || 'Unnamed City';
      default:
        return location.name || 'Unnamed Location';
    }
  };

  // Get location ID
  const getLocationId = (location) => {
    return location._id || location.id;
  };

  // Find selected locations for chip display
  const selectedLocations = locations.filter(location => 
    selectedIds.includes(getLocationId(location))
  );

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading {level}...</Typography>
      </Box>
    );
  }

  if (apiError) {
    return (
      <Alert severity="error" variant="outlined">
        {apiError}
      </Alert>
    );
  }

  return (
    <FormControl 
      fullWidth={fullWidth} 
      error={error}
      size={size}
      disabled={disabled}
    >
      <InputLabel id={`${level}-selector-label`}>
        {label || `Select ${level.charAt(0).toUpperCase() + level.slice(1)}`}
      </InputLabel>
      <Select
        labelId={`${level}-selector-label`}
        multiple
        value={selectedIds}
        onChange={handleChange}
        input={<OutlinedInput label={label || `Select ${level.charAt(0).toUpperCase() + level.slice(1)}`} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedLocations.map((location) => (
              <Chip 
                key={getLocationId(location)} 
                label={getLocationDisplayName(location)}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {locations.map((location) => (
          <MenuItem 
            key={getLocationId(location)} 
            value={getLocationId(location)}
          >
            {getLocationDisplayName(location)}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

MasteredLocationSelector.propTypes = {
  /**
   * Level of locations to display
   */
  level: PropTypes.oneOf(['countries', 'regions', 'divisions', 'cities']).isRequired,
  
  /**
   * Array of selected location IDs
   */
  selectedIds: PropTypes.array,
  
  /**
   * Callback fired when selection changes
   */
  onChange: PropTypes.func.isRequired,
  
  /**
   * Label for the select input
   */
  label: PropTypes.string,
  
  /**
   * Application ID for filtering locations
   */
  appId: PropTypes.string,
  
  /**
   * If true, the input will be disabled
   */
  disabled: PropTypes.bool,
  
  /**
   * If true, the input will indicate an error
   */
  error: PropTypes.bool,
  
  /**
   * Helper text to display below the input
   */
  helperText: PropTypes.string,
  
  /**
   * If true, the input will take up the full width of its container
   */
  fullWidth: PropTypes.bool,
  
  /**
   * Size of the input
   */
  size: PropTypes.oneOf(['small', 'medium'])
};

export default MasteredLocationSelector;