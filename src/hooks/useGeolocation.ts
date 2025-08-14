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
      console.error('GPS Error:', error.message);
      setState({
        location: null,
        error: error.message,
        loading: false,
      });
    };

    // Use watchPosition for continuous updates instead of getCurrentPosition
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000, // Reduced to get more frequent updates
      }
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