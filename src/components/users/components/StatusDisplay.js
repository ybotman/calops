'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tooltip, Chip } from '@mui/material';

/**
 * StatusDisplay component
 * Displays user status indicators for different permission types (User, Organizer, Admin)
 */
const StatusDisplay = ({ user, showLabels = true, size = 'medium' }) => {
  // Helper function to safely get nested values
  const getNestedValue = (obj, path, defaultValue = false) => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    
    return result === undefined || result === null ? defaultValue : result;
  };

  // Get status values with safe access
  const userApproved = getNestedValue(user, 'localUserInfo.isApproved', false);
  const userEnabled = getNestedValue(user, 'localUserInfo.isEnabled', false);
  const orgApproved = getNestedValue(user, 'regionalOrganizerInfo.isApproved', false);
  const orgEnabled = getNestedValue(user, 'regionalOrganizerInfo.isEnabled', false);
  const adminApproved = getNestedValue(user, 'localAdminInfo.isApproved', false);
  const adminEnabled = getNestedValue(user, 'localAdminInfo.isEnabled', false);
  
  // Define sizes based on the size prop
  const containerPadding = size === 'small' ? '1px 2px' : '2px 4px';
  const chipWidth = size === 'small' ? '24px' : '28px';
  const chipHeight = size === 'small' ? '16px' : '20px';
  const labelWidth = size === 'small' ? '12px' : '16px';
  const fontSize = size === 'small' ? '9px' : '11px';
  const labelFontSize = size === 'small' ? '8px' : '10px';
  
  // Define card style
  const cardStyle = {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // Define status chip style
  const chipStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    padding: '2px 0px',
    fontSize: fontSize,
    fontWeight: 'bold',
    backgroundColor: isActive ? '#e3f2fd' : '#f5f5f5',
    color: isActive ? '#1976d2' : '#757575',
    border: `1px solid ${isActive ? '#bbdefb' : '#e0e0e0'}`,
    width: chipWidth,
    height: chipHeight,
    minWidth: 'unset'
  });
  
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {/* User Status */}
      <Tooltip title="User Status (Approved/Enabled)">
        <Box sx={{ 
          ...cardStyle, 
          border: '1px solid #e0e0e0', 
          borderRadius: '4px', 
          padding: containerPadding, 
          backgroundColor: '#f8f9fa' 
        }}>
          {showLabels && (
            <Typography variant="caption" sx={{ fontSize: labelFontSize, width: labelWidth, color: '#616161' }}>
              U:
            </Typography>
          )}
          <Box sx={chipStyle(userApproved)}>
            {userApproved ? 'Y' : 'N'}
          </Box>
          <Box sx={chipStyle(userEnabled)}>
            {userEnabled ? 'Y' : 'N'}
          </Box>
        </Box>
      </Tooltip>
      
      {/* Organizer Status */}
      <Tooltip title="Organizer Status (Approved/Enabled)">
        <Box sx={{ 
          ...cardStyle, 
          border: '1px solid #e0e0e0', 
          borderRadius: '4px', 
          padding: containerPadding, 
          backgroundColor: '#f8f9fa' 
        }}>
          {showLabels && (
            <Typography variant="caption" sx={{ fontSize: labelFontSize, width: labelWidth, color: '#616161' }}>
              O:
            </Typography>
          )}
          <Box sx={chipStyle(orgApproved)}>
            {orgApproved ? 'Y' : 'N'}
          </Box>
          <Box sx={chipStyle(orgEnabled)}>
            {orgEnabled ? 'Y' : 'N'}
          </Box>
        </Box>
      </Tooltip>
      
      {/* Admin Status */}
      <Tooltip title="Admin Status (Approved/Enabled)">
        <Box sx={{ 
          ...cardStyle, 
          border: '1px solid #e0e0e0', 
          borderRadius: '4px', 
          padding: containerPadding, 
          backgroundColor: '#f8f9fa' 
        }}>
          {showLabels && (
            <Typography variant="caption" sx={{ fontSize: labelFontSize, width: labelWidth, color: '#616161' }}>
              A:
            </Typography>
          )}
          <Box sx={chipStyle(adminApproved)}>
            {adminApproved ? 'Y' : 'N'}
          </Box>
          <Box sx={chipStyle(adminEnabled)}>
            {adminEnabled ? 'Y' : 'N'}
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
};

StatusDisplay.propTypes = {
  /**
   * User object with status information
   */
  user: PropTypes.shape({
    localUserInfo: PropTypes.shape({
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool
    }),
    regionalOrganizerInfo: PropTypes.shape({
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool,
      organizerId: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    }),
    localAdminInfo: PropTypes.shape({
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool
    })
  }).isRequired,
  
  /**
   * Whether to show text labels
   */
  showLabels: PropTypes.bool,
  
  /**
   * Size of the display
   */
  size: PropTypes.oneOf(['small', 'medium'])
};

export default StatusDisplay;