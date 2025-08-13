'use client';

import { useState } from 'react';
import { SimpleScene } from '@/components/SimpleScene';
import { WindmillControls } from '@/components/WindmillControls';
import { windmillConfigurations, grimstadUserLocation } from '@/data/windmill-config';
import { WindmillConfig } from '@/types/windmill';

export default function Home() {
  const [windmills, setWindmills] = useState<WindmillConfig[]>(windmillConfigurations);
  const [showVR, setShowVR] = useState(false);

  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold mb-2">Grimstad Wind Farm Visualization</h1>
        <p className="text-sm">Mouse/keyboard: Click and drag to look around</p>
        <p className="text-sm">Scroll to zoom, drag to rotate view</p>
        <button 
          onClick={() => setShowVR(!showVR)}
          className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          {showVR ? 'Exit VR Mode' : 'Enable VR Mode'}
        </button>
      </div>
      
      <WindmillControls 
        windmills={windmills}
        onWindmillUpdate={setWindmills}
      />
      
      <SimpleScene 
        windmills={windmills} 
        userLocation={grimstadUserLocation}
      />
    </div>
  );
}
