import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    orientation: 'portrait',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Check for touch capability
      const isTouchDevice = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;

      // Determine device type
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Get safe area insets (for notched phones)
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaInsets = {
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10) || 0,
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10) || 0,
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10) || 0
      };

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation: height > width ? 'portrait' : 'landscape',
        safeAreaInsets
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};
