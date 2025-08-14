'use client';

import { useState, useEffect } from 'react';
import { UserLocation } from '@/types/windmill';

interface GeolocationState {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<Omit<GeolocationState, 'retry'>>({
    location: null,
    error: null,
    loading: true,
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      });
      return;
    }

    // Check if we're in an XR session which might restrict geolocation
    const isInXR = 'xr' in navigator && (window as any).navigator?.xr?.session;
    if (isInXR) {
      console.log('XR session detected - requesting geolocation permissions explicitly');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const handleSuccess = (position: GeolocationPosition) => {
      console.log('GPS Update:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toLocaleTimeString()
      });
      
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
        },
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      const errorDetails = {
        code: error.code,
        message: error.message,
        isInXR: isInXR,
        timestamp: new Date().toISOString()
      };
      
      console.error('GPS Error:', errorDetails);
      
      let userFriendlyMessage = error.message;
      if (isInXR) {
        userFriendlyMessage = `VR GPS Error: ${error.message}. Try allowing location access or using the app before entering VR.`;
      }
      
      setState({
        location: null,
        error: userFriendlyMessage,
        loading: false,
      });
    };

    // Enhanced options for VR/XR sessions
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: isInXR ? 30000 : 15000, // Longer timeout for XR
      maximumAge: isInXR ? 60000 : 30000, // Allow older positions in XR if needed
    };

    // Use watchPosition for continuous updates instead of getCurrentPosition
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );

    // Return cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  useEffect(() => {
    const cleanup = requestLocation();
    return cleanup;
  }, []);

  return {
    ...state,
    retry: requestLocation,
  };
}