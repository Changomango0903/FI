import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../config';
import logger from '../utils/logger';

/**
 * Custom hook for window resize handling
 * @param {number} mobileBreakpoint - Width threshold for mobile devices
 * @returns {Object} - Window size state and related utilities
 */
export default function useWindowResize(mobileBreakpoint = APP_CONFIG.MOBILE_BREAKPOINT) {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false);
  
  // Handle window resize
  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
    setIsMobile(window.innerWidth < mobileBreakpoint);
    logger.debug('useWindowResize', 'Window resized', { 
      width: window.innerWidth, 
      height: window.innerHeight,
      isMobile: window.innerWidth < mobileBreakpoint
    });
  }, [mobileBreakpoint]);
  
  // Add and remove resize event listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('resize', handleResize);
    logger.debug('useWindowResize', 'Added resize listener');
    
    // Initial measurement
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      logger.debug('useWindowResize', 'Removed resize listener');
    };
  }, [handleResize]);
  
  return {
    windowWidth,
    windowHeight,
    isMobile,
    mobileBreakpoint
  };
} 