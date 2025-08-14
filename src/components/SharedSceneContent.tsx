'use client';

import { WindmillWithAudio } from './WindmillWithAudio';
import { VRCompass } from './VRCompass';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToFixedWorld, getUserOffsetFromReference } from '@/utils/coordinates';

interface SharedSceneContentProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
  showCompass?: boolean;
  showMeasurementPoles?: boolean;
}

export function SharedSceneContent({ 
  windmills, 
  userLocation, 
  showCompass = true,
  showMeasurementPoles = true
}: SharedSceneContentProps) {
  // Calculate user's offset from reference point in fixed world coordinates
  const userOffset = getUserOffsetFromReference(userLocation);
  
  return (
    <>
      {/* Main scene group - user is at origin, everything else positioned in fixed world coordinates */}
      <group position={[0, 0, 0]}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        
        {/* Ground reference markers for debugging */}
        {/* North marker - red */}
        <mesh position={[0, 0.1, -100]}>
          <boxGeometry args={[5, 0.2, 10]} />
          <meshBasicMaterial color="red" />
        </mesh>
        
        {/* South marker - green */}
        <mesh position={[0, 0.1, 100]}>
          <boxGeometry args={[5, 0.2, 10]} />
          <meshBasicMaterial color="green" />
        </mesh>
        
        {/* East marker - blue */}
        <mesh position={[100, 0.1, 0]}>
          <boxGeometry args={[10, 0.2, 5]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        
        {/* West marker - yellow */}
        <mesh position={[-100, 0.1, 0]}>
          <boxGeometry args={[10, 0.2, 5]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
        
        {/* Origin marker - white */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>
      
      {/* Compass - works in both VR and AR */}
      {showCompass && <VRCompass />}
      
      {/* Measurement poles behind user in fixed world coordinates */}
      {showMeasurementPoles && (
        <group>
          {/* 1m pole - behind and to the left */}
          <group position={[-5 - userOffset[0], -userOffset[1], -15 - userOffset[2]]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 1]} />
              <meshBasicMaterial color="orange" />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color="orange" />
            </mesh>
          </group>
          
          {/* 5m pole - behind and slightly to the left */}
          <group position={[-2.5 - userOffset[0], -userOffset[1], -12 - userOffset[2]]}>
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 5]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
            <mesh position={[0, 5.2, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
          </group>
          
          {/* 10m pole - directly behind */}
          <group position={[0 - userOffset[0], -userOffset[1], -10 - userOffset[2]]}>
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 10]} />
              <meshBasicMaterial color="green" />
            </mesh>
            <mesh position={[0, 10.2, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color="green" />
            </mesh>
          </group>
          
          {/* 100m pole - behind and to the right */}
          <group position={[2.5 - userOffset[0], -userOffset[1], -12 - userOffset[2]]}>
            <mesh position={[0, 50, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 100]} />
              <meshBasicMaterial color="blue" />
            </mesh>
            <mesh position={[0, 100.5, 0]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </group>
          
          {/* 200m pole - behind and far to the right */}
          <group position={[5 - userOffset[0], -userOffset[1], -15 - userOffset[2]]}>
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
      )}

      {/* Wind turbines positioned in fixed world coordinates relative to user */}
      {windmills.map((windmill, index) => {
        // Get windmill position in fixed world coordinates
        const fixedWorldPosition = convertGPSToFixedWorld(windmill.position);
        // Offset by user's position to place user at origin
        let relativePosition: [number, number, number] = [
          fixedWorldPosition[0] - userOffset[0],
          fixedWorldPosition[1] - userOffset[1], // Use actual height difference
          fixedWorldPosition[2] - userOffset[2]
        ];
        
        // For AR mode, ensure windmills are positioned at reasonable viewing distances
        // If windmills are too close (< 50m), spread them out in a semicircle in front of user
        const originalDistance = Math.sqrt(relativePosition[0]**2 + relativePosition[2]**2);
        if (originalDistance < 50) {
          // Position windmills in a semicircle from 200m to 800m in front of user
          const angle = (index / windmills.length) * Math.PI - Math.PI/2; // -90° to +90°
          const distance = 200 + (index * 100); // 200m, 300m, 400m, etc.
          relativePosition = [
            Math.cos(angle) * distance, // X position (left/right)
            0, // Keep at ground level for now
            -Math.sin(angle) * distance // Z position (always in front, negative Z)
          ];
        }
        
        const finalDistance = Math.sqrt(relativePosition[0]**2 + relativePosition[2]**2);
        console.log(`Windmill ${windmill.id}:`, {
          gps: windmill.position,
          fixedWorld: fixedWorldPosition,
          userOffset,
          originalDistance: `${originalDistance.toFixed(1)}m`,
          relative: relativePosition,
          finalDistance: `${finalDistance.toFixed(1)}m`
        });
        
        return (
          <group key={windmill.id}>
            {/* Debug marker - bright sphere at windmill base for visibility */}
            <mesh position={[relativePosition[0], 20, relativePosition[2]]}>
              <sphereGeometry args={[5, 8, 8]} />
              <meshBasicMaterial color="lime" transparent opacity={0.9} />
            </mesh>
            
            {/* Distance label higher up */}
            <mesh position={[relativePosition[0], 60, relativePosition[2]]}>
              <sphereGeometry args={[3, 8, 8]} />
              <meshBasicMaterial color="red" />
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