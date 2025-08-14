'use client';

import { Canvas } from '@react-three/fiber';
import { VRButton, XR, createXRStore } from '@react-three/xr';
import { Sky, Environment, Stars } from '@react-three/drei';
import { WindmillWithAudio } from './WindmillWithAudio';
import { VRCompass } from './VRCompass';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToFixedWorld, getUserOffsetFromReference } from '@/utils/coordinates';
import { grimstadUserLocation } from '@/data/windmill-config';

interface ImmersiveVRSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

function VRContent({ windmills, userLocation }: ImmersiveVRSceneProps) {
  // Calculate user's offset from the reference location
  const userOffset = getUserOffsetFromReference(userLocation);
  
  return (
    <>
      {/* VR Compass for orientation */}
      <VRCompass />
      
      {/* User position indicator relative to reference */}
      <group position={userOffset}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        
        {/* Environment - wrapped in group for opacity */}
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
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Ground plane - positioned relative to world origin */}
        <mesh position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial color="#2d5016" transparent opacity={0.2} />
        </mesh>
        
        {/* Ocean/water effect */}
        <mesh position={[0, -51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20000, 20000]} />
          <meshStandardMaterial color="#006994" transparent opacity={0.6} />
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

export function ImmersiveVRScene({ windmills, userLocation }: ImmersiveVRSceneProps) {
  const store = createXRStore();
  const userOffset = getUserOffsetFromReference(userLocation);
  const initialCameraPosition: [number, number, number] = [
    userOffset[0], 
    userOffset[1] + 1.6, 
    userOffset[2]
  ];
  
  return (
    <div className="w-full h-screen">
      <VRButton store={store} />
      
      <Canvas
        shadows
        camera={{ 
          position: initialCameraPosition, 
          fov: 75 
        }}
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: false 
        }}
      >
        <XR store={store}>
          <VRContent windmills={windmills} userLocation={userLocation} />
        </XR>
      </Canvas>
      
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg max-w-sm">
        <h2 className="text-lg font-bold mb-2">VR Mode Active</h2>
        <p className="text-sm mb-1">Put on your Oculus Quest 3 and click &quot;Enter VR&quot;</p>
        <p className="text-sm mb-1">Your location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
        <p className="text-xs text-green-300 mb-1">✓ Windmills stay in fixed world positions</p>
        <p className="text-xs text-blue-300 mb-1">🧭 Compass shows your real-world orientation</p>
        <p className="text-xs text-gray-300">Spatial audio enabled - wind turbine sounds based on distance</p>
      </div>
    </div>
  );
}