'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Text } from '@react-three/drei';
import { WindmillConfig } from '@/types/windmill';

interface WindmillProps {
  config: WindmillConfig;
  position: [number, number, number];
}

export function Windmill({ config, position }: WindmillProps) {
  const groupRef = useRef<Group>(null);
  const bladesRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += config.rotationSpeed * delta;
    }
  });

  const towerRadius = 0.5;
  const nacelleHeight = 2;
  const nacelleWidth = 3;

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, config.height / 2, 0]}>
        <cylinderGeometry args={[towerRadius, towerRadius * 1.5, config.height, 16]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      
      <mesh position={[0, config.height + nacelleHeight / 2, 0]}>
        <boxGeometry args={[nacelleWidth, nacelleHeight, nacelleWidth / 2]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      <group ref={bladesRef} position={[0, config.height + nacelleHeight, nacelleWidth / 4]}>
        {[0, 120, 240].map((angle, index) => (
          <mesh key={index} rotation={[0, 0, (angle * Math.PI) / 180]}>
            <mesh position={[0, config.bladeLength / 2, 0]}>
              <boxGeometry args={[config.bladeWidth, config.bladeLength, 0.1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </mesh>
        ))}
      </group>
      
      <Text
        position={[0, -5, 0]}
        fontSize={8}
        color="black"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {config.id}
      </Text>
    </group>
  );
}