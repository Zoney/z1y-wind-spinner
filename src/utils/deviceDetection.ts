'use client';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for mobile user agent patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  
  // Check for touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size (mobile-like dimensions)
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobileUA || (hasTouchSupport && isSmallScreen);
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
}

export function supportsDeviceOrientation(): boolean {
  return typeof DeviceOrientationEvent !== 'undefined';
}