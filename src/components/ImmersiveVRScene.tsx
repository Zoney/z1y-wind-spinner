'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { VRButton, XR, createXRStore, useXR } from '@react-three/xr';
import { useEffect, useState } from 'react';
import { WindmillWithAudio } from './WindmillWithAudio';
import { VRCompass } from './VRCompass';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToLocal } from '@/utils/coordinates';

interface ImmersiveVRSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

function PassthroughManager() {
  const { gl } = useThree();
  const xr = useXR();
  const [, setPassthroughSupported] = useState(false);
  const isPresenting = xr.session !== undefined;

  useEffect(() => {
    if (!isPresenting) return;

    // Check for passthrough support (Quest 3, Quest Pro, etc.)
    const checkPassthrough = async () => {
      try {
        const session = gl.xr?.getSession();
        if (session && session.enabledFeatures?.includes('layers')) {
          // Request passthrough layer
          // @ts-expect-error - Experimental WebXR API
          const passthroughLayer = await session.requestLayer?.({
            type: 'passthrough',
            preferredDisplayMode: 'opaque'
          });
          
          if (passthroughLayer) {
            setPassthroughSupported(true);
            console.log('Passthrough enabled for mixed reality');
          }
        }
      } catch (error) {
        console.log('Passthrough not supported or failed to enable:', error);
      }
    };

    checkPassthrough();
  }, [isPresenting, gl]);

  return null;
}

function VRContent({ windmills, userLocation }: ImmersiveVRSceneProps) {
  
  return (
    <>
      {/* Passthrough manager for AR headsets */}
      <PassthroughManager />
      
      {/* VR Compass for orientation */}
      <VRCompass />
      
      {/* Main scene group - user is at origin */}
      <group position={[0, 0, 0]}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        
        
      </group>
      
      {/* Measurement poles behind starting position */}
      <group position={[0, 0, -10]}>
        {/* 1m pole */}
        <group position={[-20, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1]} />
            <meshBasicMaterial color="orange" />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="orange" />
          </mesh>
        </group>
        
        {/* 5m pole */}
        <group position={[-10, 0, 0]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 5]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        </group>
        
        {/* 10m pole */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 10]} />
            <meshBasicMaterial color="green" />
          </mesh>
          <mesh position={[0, 10.2, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="green" />
          </mesh>
        </group>
        
        {/* 100m pole */}
        <group position={[10, 0, 0]}>
          <mesh position={[0, 50, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 100]} />
            <meshBasicMaterial color="blue" />
          </mesh>
          <mesh position={[0, 100.5, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>
        
        {/* 200m pole */}
        <group position={[20, 0, 0]}>
          <mesh position={[0, 100, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 200]} />
            <meshBasicMaterial color="red" />
          </mesh>
          <mesh position={[0, 200.5, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="red" />
          </mesh>
        </group>
      </group>

      {/* Wind turbines positioned relative to user at origin */}
      {windmills.map((windmill) => {
        const relativePosition = convertGPSToLocal(windmill.position, userLocation);
        console.log(`Windmill ${windmill.id} position:`, relativePosition, 
          `Distance: ${Math.sqrt(relativePosition[0]**2 + relativePosition[2]**2).toFixed(1)}m`);
        
        return (
          <group key={windmill.id}>
            {/* Debug marker - bright sphere at windmill base */}
            <mesh position={[relativePosition[0], relativePosition[1] + 5, relativePosition[2]]}>
              <sphereGeometry args={[10, 8, 8]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
            
            {/* Actual windmill */}
            <WindmillWithAudio
              config={windmill}
              position={relativePosition}
              userLocation={userLocation}
            />
          </group>
        );
      })}
    </>
  );
}

export function ImmersiveVRScene({ windmills, userLocation }: ImmersiveVRSceneProps) {
  const store = createXRStore();
  const initialCameraPosition: [number, number, number] = [0, 1.6, 0];
  
  return (
    <div className="w-full h-screen">
      <VRButton store={store} />
      
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
          alpha: true // Enable transparency for passthrough
        }}
      >
        <XR store={store}>
          <VRContent windmills={windmills} userLocation={userLocation} />
        </XR>
      </Canvas>
      
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg max-w-sm">
        <h2 className="text-lg font-bold mb-2">🥽 VR/AR Mode</h2>
        <p className="text-sm mb-1">Put on your Oculus Quest 3 and click &quot;Enter VR&quot;</p>
        <p className="text-sm mb-1">Your location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
        <p className="text-xs text-green-300 mb-1">✓ Windmills stay in fixed world positions</p>
        <p className="text-xs text-blue-300 mb-1">🧭 Compass shows your real-world orientation</p>
        <p className="text-xs text-purple-300 mb-1">👁️ Mixed Reality: See real world + windmills</p>
        <p className="text-xs text-gray-300">Spatial audio enabled - wind turbine sounds based on distance</p>
      </div>
    </div>
  );
}