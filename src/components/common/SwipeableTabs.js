'use client';

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, useTheme, useMediaQuery } from '@mui/material';

/**
 * SwipeableTabs component
 * Provides swipeable tab content on mobile devices using native touch events
 */
const SwipeableTabs = ({ 
  value, 
  onChange, 
  children,
  threshold = 50, // Minimum distance for swipe
  ...boxProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const childrenArray = React.Children.toArray(children);
  const tabCount = childrenArray.length;
  
  // Handle touch start
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };
  
  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate offset for visual feedback
    const diff = currentTouch - touchStart;
    setOffset(diff * 0.3); // Dampen the movement
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;
    
    if (isLeftSwipe && value < tabCount - 1) {
      onChange(value + 1);
    } else if (isRightSwipe && value > 0) {
      onChange(value - 1);
    }
    
    // Reset
    setIsSwiping(false);
    setOffset(0);
  };
  
  // Reset offset when value changes
  useEffect(() => {
    setOffset(0);
  }, [value]);
  
  if (isMobile) {
    return (
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'pan-y', // Allow vertical scroll, handle horizontal ourselves
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        {...boxProps}
      >
        <Box
          sx={{
            display: 'flex',
            transform: `translateX(calc(-${value * 100}% + ${offset}px))`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
            willChange: 'transform',
          }}
        >
          {childrenArray.map((child, index) => (
            <Box
              key={index}
              sx={{
                width: '100%',
                flexShrink: 0,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {child}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
  
  // On desktop, just render the active tab
  return (
    <Box {...boxProps}>
      {childrenArray[value]}
    </Box>
  );
};

SwipeableTabs.propTypes = {
  /**
   * The value of the currently selected tab
   */
  value: PropTypes.number.isRequired,
  
  /**
   * Callback fired when the tab value changes
   */
  onChange: PropTypes.func.isRequired,
  
  /**
   * Tab panel content
   */
  children: PropTypes.node,
  
  /**
   * If true, mouse events will trigger swipe
   */
  enableMouseEvents: PropTypes.bool,
  
  /**
   * If true, adds resistance when swiping at edges
   */
  resistance: PropTypes.bool,
  
  /**
   * If true, animates height changes
   */
  animateHeight: PropTypes.bool,
  
  /**
   * If true, animates transitions between tabs
   */
  animateTransitions: PropTypes.bool
};

export default SwipeableTabs;