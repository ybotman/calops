'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * VenueSearchBar component
 * Search input for filtering venues
 */
const VenueSearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  placeholder = 'Search venues...',
  fullWidth = true,
  variant = 'outlined',
  size = 'small'
}) => {
  const handleChange = (e) => {
    onSearchChange(e.target.value);
  };
  
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <TextField
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        InputProps={{
          startAdornment: (
            <SearchIcon color="action" sx={{ mr: 1 }} />
          ),
          endAdornment: searchTerm ? (
            <IconButton
              onClick={handleClear}
              size="small"
              aria-label="clear search"
            >
              <ClearIcon />
            </IconButton>
          ) : null
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2
          }
        }}
      />
    </Box>
  );
};

VenueSearchBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  size: PropTypes.oneOf(['small', 'medium'])
};

export default VenueSearchBar;