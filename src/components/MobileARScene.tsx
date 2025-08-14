'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { PerspectiveCamera } from 'three';
import { Sky, Environment, Stars } from '@react-three/drei';
import { WindmillWithAudio } from './WindmillWithAudio';
import { VRCompass } from './VRCompass';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToFixedWorld, getUserOffsetFromReference } from '@/utils/coordinates';
import { grimstadUserLocation } from '@/data/windmill-config';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface MobileARSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

interface ARCameraProps {
  orientation: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    absolute: boolean;
  };
}

function ARCamera({ orientation }: ARCameraProps) {
  const { camera } = useThree();
  const cameraRef = useRef<PerspectiveCamera>(null);

  useFrame(() => {
    if (!cameraRef.current || !orientation.alpha || !orientation.beta || !orientation.gamma) return;

    // Convert device orientation to camera rotation
    // Note: These calculations may need adjustment based on device orientation
    const alpha = (orientation.alpha * Math.PI) / 180; // Z-axis (compass)
    const beta = (orientation.beta * Math.PI) / 180;   // X-axis (tilt forward/back)
    const gamma = (orientation.gamma * Math.PI) / 180; // Y-axis (tilt left/right)

    // Apply rotations to camera (order matters for proper orientation)
    cameraRef.current.rotation.set(
      beta - Math.PI / 2,  // Adjust for device held upright
      alpha,               // Compass heading
      -gamma              // Roll compensation
    );
  });

  useEffect(() => {
    cameraRef.current = camera as PerspectiveCamera;
  }, [camera]);

  return null;
}

function ARContent({ windmills, userLocation, orientation }: MobileARSceneProps & { orientation: ARCameraProps['orientation'] }) {
  const userOffset = getUserOffsetFromReference(userLocation);
  
  return (
    <>
      {/* AR Camera controls */}
      <ARCamera orientation={orientation} />
      
      {/* VR Compass for orientation */}
      <VRCompass />
      
      {/* User position indicator relative to reference */}
      <group position={userOffset}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />
        
        {/* Environment - very subtle for AR */}
        <group>
          <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0}
            azimuth={0.25}
          />
        </group>
        
        <Environment preset="sunset" />
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={2}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Ground plane - very transparent for AR */}
        <mesh position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial color="#2d5016" transparent opacity={0.1} />
        </mesh>
      </group>
      
      {/* Wind turbines in fixed world positions */}
      {windmills.map((windmill) => {
        const worldPosition = convertGPSToFixedWorld(windmill.position);
        return (
          <WindmillWithAudio
            key={windmill.id}
            config={windmill}
            position={worldPosition}
            userLocation={grimstadUserLocation}
          />
        );
      })}
    </>
  );
}

export function MobileARScene({ windmills, userLocation }: MobileARSceneProps) {
  const { orientation, isSupported, hasPermission, error, requestPermission } = useDeviceOrientation();
  const userOffset = getUserOffsetFromReference(userLocation);
  const initialCameraPosition: [number, number, number] = [
    userOffset[0], 
    userOffset[1] + 1.6, 
    userOffset[2]
  ];

  // Show permission UI if needed
  if (!hasPermission && isSupported) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-4">Enable AR Mode</h2>
          <p className="text-white/80 mb-4 text-sm">
            Allow device orientation access to use your phone like AR glasses
          </p>
          {error && (
            <p className="text-red-300 mb-4 text-sm">
              {error}
            </p>
          )}
          <button
            onClick={requestPermission}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Enable Device Orientation
          </button>
        </div>
      </div>
    );
  }

  // Show error if not supported
  if (!isSupported) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-4">AR Not Supported</h2>
          <p className="text-white/80 text-sm">
            Device orientation is not supported on this device or browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Canvas
        shadows
        camera={{ 
          position: initialCameraPosition, 
          fov: 75 
        }}
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: true // Enable transparency for AR
        }}
      >
        <ARContent windmills={windmills} userLocation={userLocation} orientation={orientation} />
      </Canvas>
      
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg max-w-sm">
        <h2 className="text-lg font-bold mb-2">🔍 AR Mode Active</h2>
        <p className="text-sm mb-1">Move your device to look around</p>
        <p className="text-sm mb-1">Location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
        <p className="text-xs text-green-300 mb-1">✓ Windmills positioned in real world</p>
        <p className="text-xs text-blue-300 mb-1">🧭 Compass shows device orientation</p>
        <div className="text-xs text-gray-300 mt-2">
          {orientation.alpha !== null && (
            <div>Heading: {Math.round(orientation.alpha || 0)}°</div>
          )}
        </div>
      </div>
    </div>
  );
}