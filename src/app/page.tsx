'use client';

import { useState } from 'react';
import { SimpleScene } from '@/components/SimpleScene';
import { ImmersiveVRScene } from '@/components/ImmersiveVRScene';
import { WindmillControls } from '@/components/WindmillControls';
import { windmillConfigurations, grimstadUserLocation } from '@/data/windmill-config';
import { WindmillConfig } from '@/types/windmill';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function Home() {
  const [windmills, setWindmills] = useState<WindmillConfig[]>(windmillConfigurations);
  const [showVR, setShowVR] = useState(false);
  const { location, error, loading, retry } = useGeolocation();
  
  // Use GPS location if available, otherwise fallback to Grimstad location
  const userLocation = location || grimstadUserLocation;

  if (showVR) {
    return (
      <div className="w-full h-screen">
        <ImmersiveVRScene 
          windmills={windmills} 
          userLocation={userLocation}
        />
        <button 
          onClick={() => setShowVR(false)}
          className="absolute top-4 right-4 z-20 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Exit VR Mode
        </button>
      </div>
    );
  }


  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold mb-2">Grimstad Wind Farm Visualization</h1>
        <p className="text-sm">Mouse/keyboard: Click and drag to look around</p>
        <p className="text-sm">Scroll to zoom, drag to rotate view</p>
        
        {loading && <p className="text-xs text-yellow-300 mt-1">Getting your location...</p>}
        {error && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-red-300">Location error: Using default location</p>
            <button
              onClick={retry}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Retry
            </button>
          </div>
        )}
        {location && <p className="text-xs text-green-300 mt-1">Using your GPS location</p>}
        
        <div className="mt-2 space-y-2">
          <button 
            onClick={() => setShowVR(!showVR)}
            className="block w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            🥽 {showVR ? 'Exit VR Mode' : 'Enable VR Headset Mode'}
          </button>
        </div>
      </div>
      
      <WindmillControls 
        windmills={windmills}
        onWindmillUpdate={setWindmills}
      />
      
      <SimpleScene 
        windmills={windmills} 
        userLocation={userLocation}
      />
    </div>
  );
}
