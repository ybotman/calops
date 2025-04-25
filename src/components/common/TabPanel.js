'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

/**
 * TabPanel component for MUI tabs
 * Displays content when the tab value matches the index
 */
function TabPanel(props) {
  const { children, value, index, className, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      className={className}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  /**
   * Content to display when tab is active
   */
  children: PropTypes.node.isRequired,
  
  /**
   * Current active tab value
   */
  value: PropTypes.number.isRequired,
  
  /**
   * This tab's index value
   */
  index: PropTypes.number.isRequired,
  
  /**
   * Optional CSS class
   */
  className: PropTypes.string
};

export default TabPanel;