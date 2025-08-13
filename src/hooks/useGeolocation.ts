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
      setState({
        location: null,
        error: error.message,
        loading: false,
      });
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return {
    ...state,
    retry: requestLocation,
  };
}