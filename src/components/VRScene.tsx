'use client';

import { Canvas } from '@react-three/fiber';
import { VRButton, XR, createXRStore } from '@react-three/xr';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Windmill } from './Windmill';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToLocal } from '@/utils/coordinates';

interface VRSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

export function VRScene({ windmills, userLocation }: VRSceneProps) {
  const store = createXRStore();
  
  return (
    <div className="w-full h-screen">
      <VRButton store={store} />
      <Canvas>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0}
            azimuth={0.25}
          />
          
          <Environment preset="sunset" />
          
          
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          
          <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10000, 10000]} />
            <meshStandardMaterial color="#90EE90" transparent opacity={0.3} />
          </mesh>
          
          {windmills.map((windmill) => {
            const localPosition = convertGPSToLocal(windmill.position, userLocation);
            return (
              <Windmill
                key={windmill.id}
                config={windmill}
                position={localPosition}
              />
            );
          })}
        </XR>
      </Canvas>
    </div>
  );
}