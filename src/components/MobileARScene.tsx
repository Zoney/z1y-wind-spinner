'use client';

import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { SharedSceneContent } from './SharedSceneContent';
import { ARCameraController } from './ARCameraController';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface MobileARSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

export function MobileARScene({ windmills, userLocation }: MobileARSceneProps) {
  const { permission, requestPermission, error, isSupported } = useDeviceOrientation();
  const [arEnabled, setArEnabled] = useState(false);
  
  const initialCameraPosition: [number, number, number] = [0, 1.6, 0];
  
  const handleEnableAR = async () => {
    if (permission === 'not-requested') {
      await requestPermission();
    }
    setArEnabled(true);
  };

  return (
    <div className="w-full h-screen relative">
      <Canvas
        shadows
        camera={{ 
          position: initialCameraPosition, 
          fov: 75,
          near: 0.1,
          far: 50000 // Extended far plane for distant windmills
        }}
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: false // Opaque background for AR
        }}
      >
        {/* AR Camera Controller - replaces VR headset tracking */}
        <ARCameraController enableControls={arEnabled} />
        
        {/* Shared scene content - same as VR */}
        <SharedSceneContent 
          windmills={windmills} 
          userLocation={userLocation}
          showCompass={true}
          showMeasurementPoles={true}
        />
      </Canvas>
      
      {/* AR Mode UI Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg max-w-sm">
        <h2 className="text-lg font-bold mb-2">📱 AR Mode</h2>
        <p className="text-sm mb-1">Hold your phone up and move around to look at windmills</p>
        <p className="text-sm mb-1">Your location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
        <p className="text-xs text-green-300 mb-1">✓ Windmills stay in fixed world positions</p>
        <p className="text-xs text-blue-300 mb-1">🧭 Compass shows your real-world orientation</p>
        <p className="text-xs text-purple-300 mb-1">🔄 Works in portrait or landscape</p>
        <p className="text-xs text-gray-300">Spatial audio enabled - wind turbine sounds based on distance</p>
        
        {/* AR Control Status */}
        <div className="mt-3 p-2 border border-white/20 rounded">
          {!isSupported && (
            <p className="text-xs text-red-300">❌ Device orientation not supported</p>
          )}
          
          {isSupported && permission === 'not-requested' && (
            <button
              onClick={handleEnableAR}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              🎯 Enable AR Tracking
            </button>
          )}
          
          {isSupported && permission === 'denied' && (
            <div>
              <p className="text-xs text-red-300 mb-2">❌ Orientation permission denied</p>
              <button
                onClick={requestPermission}
                className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
              >
                🔄 Request Permission Again
              </button>
            </div>
          )}
          
          {isSupported && permission === 'granted' && !arEnabled && (
            <button
              onClick={() => setArEnabled(true)}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              ▶️ Start AR Mode
            </button>
          )}
          
          {isSupported && permission === 'granted' && arEnabled && (
            <div className="text-center">
              <p className="text-xs text-green-300 mb-2">✅ AR Mode Active</p>
              <button
                onClick={() => setArEnabled(false)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                ⏸️ Pause AR
              </button>
            </div>
          )}
          
          {error && (
            <p className="text-xs text-red-300 mt-1">Error: {error}</p>
          )}
        </div>
      </div>
      
      {/* AR Instructions */}
      {arEnabled && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/75 text-white p-3 rounded-lg text-center">
          <p className="text-sm font-semibold">🎯 AR Active</p>
          <p className="text-xs">Move your phone to look around • Windmills appear at real GPS positions</p>
        </div>
      )}
    </div>
  );
}