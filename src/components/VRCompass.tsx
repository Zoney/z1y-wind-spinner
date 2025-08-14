'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { getCardinalDirection } from '@/utils/coordinates';

export function VRCompass() {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const [currentDirection, setCurrentDirection] = useState('N');
  const [heading, setHeading] = useState(0);

  useFrame(() => {
    if (!groupRef.current) return;

    // Get camera world direction
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    
    // Calculate heading angle (Y-axis rotation)
    // With new coordinate system: North = +X, East = +Z
    const headingAngle = Math.atan2(direction.z, direction.x);
    setHeading(headingAngle);
    
    // Update cardinal direction
    const cardinalDir = getCardinalDirection(headingAngle);
    setCurrentDirection(cardinalDir);

    // Position compass relative to camera
    const cameraPosition = new Vector3();
    camera.getWorldPosition(cameraPosition);
    
    // Keep compass at a fixed distance in front of the camera
    groupRef.current.position.copy(cameraPosition);
    groupRef.current.position.y += 0.3; // Slightly above eye level
    groupRef.current.position.add(direction.multiplyScalar(2)); // 2 meters in front
    
    // Make compass face the camera
    groupRef.current.lookAt(cameraPosition);
  });

  return (
    <group ref={groupRef}>
      {/* Compass background */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color="#000000" opacity={0.7} transparent />
      </mesh>
      
      {/* Compass ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.12, 0.15, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Cardinal direction markers */}
      <Text
        position={[0, 0.1, 0.03]}
        fontSize={0.04}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>
      <Text
        position={[0.1, 0, 0.03]}
        fontSize={0.03}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        E
      </Text>
      <Text
        position={[0, -0.1, 0.03]}
        fontSize={0.03}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        S
      </Text>
      <Text
        position={[-0.1, 0, 0.03]}
        fontSize={0.03}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        W
      </Text>
      
      
      {/* Current direction display */}
      <Text
        position={[0, -0.25, 0.03]}
        fontSize={0.05}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
      >
        {currentDirection}
      </Text>
      
      {/* Heading degree display */}
      <Text
        position={[0, -0.35, 0.03]}
        fontSize={0.03}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(((heading * 180 / Math.PI) + 360) % 360)}°
      </Text>
    </group>
  );
}