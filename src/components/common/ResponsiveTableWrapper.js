'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * ResponsiveTableWrapper component
 * Automatically switches between desktop and mobile views based on screen size
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.desktopView - Component to render on desktop
 * @param {React.ReactNode} props.mobileView - Component to render on mobile
 * @param {string} props.breakpoint - Breakpoint to switch views (default: 'md')
 * @returns {JSX.Element} Responsive wrapper component
 */
const ResponsiveTableWrapper = ({ 
  desktopView, 
  mobileView, 
  breakpoint = 'md' 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));
  
  return isMobile ? mobileView : desktopView;
};

ResponsiveTableWrapper.propTypes = {
  /**
   * Component to render on desktop/tablet screens
   */
  desktopView: PropTypes.node.isRequired,
  
  /**
   * Component to render on mobile screens
   */
  mobileView: PropTypes.node.isRequired,
  
  /**
   * Material-UI breakpoint to switch between views
   * Options: 'xs', 'sm', 'md', 'lg', 'xl'
   */
  breakpoint: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl'])
};

export default ResponsiveTableWrapper;