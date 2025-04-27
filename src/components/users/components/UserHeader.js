'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/Add';

/**
 * UserHeader component
 * Displays page title and Add User button
 */
const UserHeader = ({ onAddUser, title = 'User Management' }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mb: 3
    }}>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        startIcon={<PersonAddIcon />}
        onClick={onAddUser}
        data-testid="add-user-button"
      >
        Add User
      </Button>
    </Box>
  );
};

UserHeader.propTypes = {
  /**
   * Callback for add user button click
   */
  onAddUser: PropTypes.func.isRequired,
  
  /**
   * Page title
   */
  title: PropTypes.string
};

export default UserHeader;