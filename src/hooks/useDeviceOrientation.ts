'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationData {
  alpha: number | null; // Z-axis rotation (compass heading)
  beta: number | null;  // X-axis rotation (front-to-back tilt)
  gamma: number | null; // Y-axis rotation (left-to-right tilt)
  absolute: boolean;
}

interface DeviceOrientationState {
  orientation: DeviceOrientationData;
  isSupported: boolean;
  hasPermission: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useDeviceOrientation(): DeviceOrientationState {
  const [orientation, setOrientation] = useState<DeviceOrientationData>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrientationChange = useCallback((event: DeviceOrientationEvent) => {
    setOrientation({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute || false,
    });
  }, []);

  const requestPermission = useCallback(async () => {
    setError(null);
    
    try {
      // Check if DeviceOrientationEvent is supported
      if (typeof DeviceOrientationEvent === 'undefined') {
        throw new Error('DeviceOrientationEvent is not supported');
      }

      // For iOS 13+ devices, request permission
      const DeviceOrientationEventWithPermission = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
      };
      
      if (typeof DeviceOrientationEventWithPermission.requestPermission === 'function') {
        const permissionState = await DeviceOrientationEventWithPermission.requestPermission();
        if (permissionState === 'granted') {
          setHasPermission(true);
          window.addEventListener('deviceorientation', handleOrientationChange, true);
        } else {
          throw new Error('Permission denied for device orientation');
        }
      } else {
        // For Android and older iOS devices
        setHasPermission(true);
        window.addEventListener('deviceorientation', handleOrientationChange, true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Device orientation permission error:', err);
    }
  }, [handleOrientationChange]);

  useEffect(() => {
    // Check if device orientation is supported
    const supported = 'DeviceOrientationEvent' in window;
    setIsSupported(supported);

    if (!supported) {
      setError('Device orientation is not supported on this device');
      return;
    }

    // Check if we're on a secure context (HTTPS)
    if (!window.isSecureContext) {
      setError('Device orientation requires HTTPS');
      return;
    }

    // For devices that don't require permission (most Android devices)
    const DeviceOrientationEventWithPermission = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
    };
    
    if (typeof DeviceOrientationEventWithPermission.requestPermission !== 'function') {
      setHasPermission(true);
      window.addEventListener('deviceorientation', handleOrientationChange, true);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('deviceorientation', handleOrientationChange, true);
    };
  }, [handleOrientationChange]);

  return {
    orientation,
    isSupported,
    hasPermission,
    error,
    requestPermission,
  };
}