'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Tabs, Tab } from '@mui/material';
import UserSearchBar from './UserSearchBar';

/**
 * UserTabNavigationBar component
 * Manages tab selection and contains search functionality
 */
const UserTabNavigationBar = ({
  value,
  onChange,
  searchTerm,
  onSearchChange,
  tabs = [
    { label: 'All Users', id: 'all-users' },
    { label: 'Organizers', id: 'organizers' },
    { label: 'Admins', id: 'admins' },
    { label: 'Firebase', id: 'firebase' }
  ]
}) => {
  const handleTabChange = (_, newValue) => {
    onChange(newValue);
  };
  
  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider', 
      mb: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <Tabs 
          value={value} 
          onChange={handleTabChange}
          data-testid="user-tabs"
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.id}
              label={tab.label} 
              id={`user-tab-${index}`}
              aria-controls={`user-tabpanel-${index}`}
              data-testid={`user-tab-${tab.id}`}
            />
          ))}
        </Tabs>
        
        <UserSearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search users..."
          data-testid="user-search"
        />
      </Box>
    </Box>
  );
};

UserTabNavigationBar.propTypes = {
  /**
   * Current tab value
   */
  value: PropTypes.number.isRequired,
  
  /**
   * Tab change callback
   */
  onChange: PropTypes.func.isRequired,
  
  /**
   * Current search term
   */
  searchTerm: PropTypes.string.isRequired,
  
  /**
   * Search change callback
   */
  onSearchChange: PropTypes.func.isRequired,
  
  /**
   * Tab definitions
   */
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    })
  )
};

export default UserTabNavigationBar;