'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook for handling mobile gestures
 * @param {Object} options - Configuration options
 * @returns {Object} Gesture handlers and state
 */
export const useMobileGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventScroll = false,
  enabled = true
} = {}) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  const elementRef = useRef(null);
  
  const handleTouchStart = (e) => {
    if (!enabled) return;
    
    const touch = e.targetTouches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(true);
  };
  
  const handleTouchMove = (e) => {
    if (!enabled || !isSwiping) return;
    
    const touch = e.targetTouches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    
    if (preventScroll) {
      e.preventDefault();
    }
    
    // Determine swipe direction
    const diffX = touchStart.x - touch.clientX;
    const diffY = touchStart.y - touch.clientY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeDirection(diffX > 0 ? 'left' : 'right');
    } else {
      setSwipeDirection(diffY > 0 ? 'up' : 'down');
    }
  };
  
  const handleTouchEnd = () => {
    if (!enabled || !isSwiping) return;
    
    const diffX = touchStart.x - touchEnd.x;
    const diffY = touchStart.y - touchEnd.y;
    
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    
    // Horizontal swipe
    if (absX > absY && absX > threshold) {
      if (diffX > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    // Vertical swipe
    if (absY > absX && absY > threshold) {
      if (diffY > 0 && onSwipeUp) {
        onSwipeUp();
      } else if (diffY < 0 && onSwipeDown) {
        onSwipeDown();
      }
    }
    
    // Reset
    setIsSwiping(false);
    setSwipeDirection(null);
  };
  
  // Add passive: false for iOS compatibility when preventing scroll
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;
    
    const options = preventScroll ? { passive: false } : { passive: true };
    
    element.addEventListener('touchmove', handleTouchMove, options);
    
    return () => {
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enabled, preventScroll, isSwiping, touchStart]);
  
  return {
    ref: elementRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
    state: {
      isSwiping,
      swipeDirection,
      swipeDistance: {
        x: touchStart.x - touchEnd.x,
        y: touchStart.y - touchEnd.y
      }
    }
  };
};

/**
 * Hook for pinch-to-zoom gestures
 */
export const usePinchZoom = ({
  minScale = 0.5,
  maxScale = 3,
  onPinch,
  enabled = true
} = {}) => {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const lastDistance = useRef(0);
  
  const getDistance = (touches) => {
    const [touch1, touch2] = touches;
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const handleTouchStart = (e) => {
    if (!enabled) return;
    
    if (e.touches.length === 2) {
      setIsPinching(true);
      lastDistance.current = getDistance(e.touches);
    }
  };
  
  const handleTouchMove = (e) => {
    if (!enabled || !isPinching || e.touches.length !== 2) return;
    
    const distance = getDistance(e.touches);
    const delta = distance - lastDistance.current;
    
    if (delta !== 0) {
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, scale + delta * 0.01)
      );
      
      setScale(newScale);
      if (onPinch) {
        onPinch(newScale);
      }
      
      lastDistance.current = distance;
    }
    
    e.preventDefault();
  };
  
  const handleTouchEnd = () => {
    setIsPinching(false);
  };
  
  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    state: {
      scale,
      isPinching
    },
    actions: {
      resetScale: () => setScale(1)
    }
  };
};