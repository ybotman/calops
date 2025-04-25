'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * UserSearchBar component
 * Search input with debounced search functionality
 */
const UserSearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search users...", 
  debounceMs = 300,
  fullWidth = false,
  size = "small"
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Update local value when prop changes (e.g. from parent reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set a new timeout for the debounce
    const timeout = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
    
    setDebounceTimeout(timeout);
  }, [onChange, debounceMs, debounceTimeout]);

  // Handle clearing the search input
  const handleClear = useCallback(() => {
    setLocalValue('');
    // Immediately propagate empty string without debounce
    onChange('');
    
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
  }, [onChange, debounceTimeout]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return (
    <TextField
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      variant="outlined"
      size={size}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: localValue ? (
          <InputAdornment position="end">
            <IconButton
              aria-label="clear search"
              onClick={handleClear}
              edge="end"
              size="small"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

UserSearchBar.propTypes = {
  /**
   * Current search term
   */
  value: PropTypes.string.isRequired,
  
  /**
   * Callback for search term changes
   */
  onChange: PropTypes.func.isRequired,
  
  /**
   * Placeholder text
   */
  placeholder: PropTypes.string,
  
  /**
   * Debounce delay in ms
   */
  debounceMs: PropTypes.number,
  
  /**
   * Whether the search bar should take full width
   */
  fullWidth: PropTypes.bool,
  
  /**
   * Size of the TextField
   */
  size: PropTypes.oneOf(['small', 'medium'])
};

export default UserSearchBar;