'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, PositionalAudio, AudioListener } from 'three';
import { Text } from '@react-three/drei';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { calculateDistance, getNoiseLevel } from '@/utils/coordinates';

interface WindmillWithAudioProps {
  config: WindmillConfig;
  position: [number, number, number];
  userLocation: UserLocation;
}

export function WindmillWithAudio({ config, position, userLocation }: WindmillWithAudioProps) {
  const groupRef = useRef<Group>(null);
  const bladesRef = useRef<Group>(null);
  const audioRef = useRef<PositionalAudio>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!camera.userData.audioListener) {
      camera.userData.audioListener = new AudioListener();
      camera.add(camera.userData.audioListener);
    }
  }, [camera]);

  useFrame((state, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += config.rotationSpeed * delta;
    }

    // Update audio volume based on distance
    if (audioRef.current && groupRef.current) {
      const distance = calculateDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: config.position.latitude, longitude: config.position.longitude }
      );
      
      const noiseLevel = getNoiseLevel(distance, config);
      const volume = Math.max(0, Math.min(1, noiseLevel / 100)); // Convert dB to volume (0-1)
      
      audioRef.current.setVolume(volume);
    }
  });

  const towerRadius = 0.5;
  const nacelleHeight = 2;
  const nacelleWidth = 3;

  return (
    <group ref={groupRef} position={position}>
      {/* Tower */}
      <mesh position={[0, config.height / 2, 0]}>
        <cylinderGeometry args={[towerRadius, towerRadius * 1.5, config.height, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#333333"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Nacelle */}
      <mesh position={[0, config.height + nacelleHeight / 2, 0]}>
        <boxGeometry args={[nacelleWidth, nacelleHeight, nacelleWidth / 2]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#444444"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Blades */}
      <group ref={bladesRef} position={[0, config.height + nacelleHeight, nacelleWidth / 4]}>
        {[0, 120, 240].map((angle, index) => (
          <mesh key={index} rotation={[0, 0, (angle * Math.PI) / 180]}>
            <mesh position={[0, config.bladeLength / 2, 0]}>
              <boxGeometry args={[config.bladeWidth, config.bladeLength, 0.1]} />
              <meshStandardMaterial 
                color="#ffffff" 
                emissive="#222222"
                emissiveIntensity={0.15}
              />
            </mesh>
          </mesh>
        ))}
      </group>
      
      {/* Spatial Audio - Disabled temporarily */}
      {/* <DreiPositionalAudio
        ref={audioRef}
        url="/wind-turbine-sound.mp3" // You'll need to add this audio file
        distance={2000} // Max distance for audio
        loop
        autoplay
        position={[0, config.height + nacelleHeight, 0]}
      /> */}
      
      {/* Label */}
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