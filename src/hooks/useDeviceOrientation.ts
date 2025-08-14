'use client';

import { useState, useEffect, useCallback } from 'react';

interface OrientationData {
  alpha: number; // Z-axis rotation (compass heading) - 0 to 360 degrees
  beta: number;  // X-axis rotation (front-back tilt) - -180 to 180 degrees
  gamma: number; // Y-axis rotation (left-right tilt) - -90 to 90 degrees
}

interface DeviceOrientationState {
  orientation: OrientationData | null;
  permission: 'granted' | 'denied' | 'not-requested';
  isSupported: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useDeviceOrientation(): DeviceOrientationState {
  const [state, setState] = useState<Omit<DeviceOrientationState, 'requestPermission'>>({
    orientation: null,
    permission: 'not-requested',
    isSupported: false,
    error: null,
  });

  const checkSupport = useCallback(() => {
    const isSupported = 'DeviceOrientationEvent' in window;
    setState(prev => ({ ...prev, isSupported }));
    
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Device orientation is not supported' }));
    }
    
    return isSupported;
  }, []);

  const requestPermission = useCallback(async (): Promise<void> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Device orientation is not supported' }));
      return;
    }

    try {
      // For iOS 13+ devices, we need to request permission
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })?.requestPermission === 'function') {
        const permissionState = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        
        if (permissionState === 'granted') {
          setState(prev => ({ ...prev, permission: 'granted', error: null }));
        } else {
          setState(prev => ({ 
            ...prev, 
            permission: 'denied', 
            error: 'Device orientation permission denied' 
          }));
          return;
        }
      } else {
        // For Android and older iOS, permission is granted by default
        setState(prev => ({ ...prev, permission: 'granted', error: null }));
      }

      // Start listening to orientation events
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // Handle null values gracefully
        const alpha = event.alpha !== null ? event.alpha : 0;
        const beta = event.beta !== null ? event.beta : 0;
        const gamma = event.gamma !== null ? event.gamma : 0;
        
        setState(prev => ({
          ...prev,
          orientation: { alpha, beta, gamma },
          error: null
        }));
      };

      window.addEventListener('deviceorientation', handleOrientation);
    } catch (error) {
      console.error('Error requesting device orientation permission:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        permission: 'denied'
      }));
    }
  }, [state.isSupported]);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  return {
    ...state,
    requestPermission,
  };
}