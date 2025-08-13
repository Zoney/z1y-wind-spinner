'use client';

import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { WindmillConfig, MaskedArea } from '@/types/windmill';

interface MaskedWindmillProps {
  config: WindmillConfig;
  position: [number, number, number];
  onMaskUpdate?: (windmillId: string, maskedAreas: MaskedArea[]) => void;
}

export function MaskedWindmill({ config, position, onMaskUpdate }: MaskedWindmillProps) {
  const groupRef = useRef<Group>(null);
  const bladesRef = useRef<Group>(null);
  const [maskedAreas, setMaskedAreas] = useState<MaskedArea[]>(config.maskedAreas || []);
  const [isErasing, setIsErasing] = useState(false);
  const {} = useThree();

  useFrame((state, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += config.rotationSpeed * delta;
    }
  });

  const handlePointerDown = (event: import('@react-three/fiber').ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsErasing(true);
  };

  const handlePointerUp = () => {
    setIsErasing(false);
  };

  const handlePointerMove = (event: import('@react-three/fiber').ThreeEvent<PointerEvent>) => {
    if (!isErasing) return;
    
    const point = event.point;
    if (point) {
      const newMaskedArea: MaskedArea = {
        id: `mask-${Date.now()}`,
        vertices: [
          { x: point.x - 0.5, y: point.y - 0.5, z: point.z },
          { x: point.x + 0.5, y: point.y - 0.5, z: point.z },
          { x: point.x + 0.5, y: point.y + 0.5, z: point.z },
          { x: point.x - 0.5, y: point.y + 0.5, z: point.z }
        ]
      };
      
      const updatedMaskedAreas = [...maskedAreas, newMaskedArea];
      setMaskedAreas(updatedMaskedAreas);
      onMaskUpdate?.(config.id, updatedMaskedAreas);
    }
  };

  const towerRadius = 0.5;
  const nacelleHeight = 2;
  const nacelleWidth = 3;

  return (
    <group ref={groupRef} position={position}>
      <mesh 
        position={[0, config.height / 2, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <cylinderGeometry args={[towerRadius, towerRadius * 1.5, config.height, 16]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      
      <mesh 
        position={[0, config.height + nacelleHeight / 2, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <boxGeometry args={[nacelleWidth, nacelleHeight, nacelleWidth / 2]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      <group ref={bladesRef} position={[0, config.height + nacelleHeight, nacelleWidth / 4]}>
        {[0, 120, 240].map((angle, index) => (
          <mesh 
            key={index} 
            rotation={[0, 0, (angle * Math.PI) / 180]}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            <mesh position={[0, config.bladeLength / 2, 0]}>
              <boxGeometry args={[config.bladeWidth, config.bladeLength, 0.1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </mesh>
        ))}
      </group>
      
      {maskedAreas.map((area) => (
        <mesh key={area.id} position={[area.vertices[0].x, area.vertices[0].y, area.vertices[0].z]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}