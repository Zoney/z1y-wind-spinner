'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Windmill } from './Windmill';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToLocal } from '@/utils/coordinates';

interface SimpleSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

export function SimpleScene({ windmills, userLocation }: SimpleSceneProps) {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 10, 50], fov: 75, far: 500000 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
        
        <Environment preset="sunset" background={false} />
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        
        
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
      </Canvas>
    </div>
  );
}