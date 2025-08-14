'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { VRButton, XR, createXRStore, useXR } from '@react-three/xr';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { WindmillWithAudio } from './WindmillWithAudio';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToLocal, convertGPSToFixedWorld, getUserOffsetFromReference } from '@/utils/coordinates';

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

function VRResetButton({ onReset }: { onReset: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<[number, number, number]>([0, 1.2, -1.5]);
  const meshRef = useRef<THREE.Mesh>(null);
  const dragStartPos = useRef<THREE.Vector3 | null>(null);
  const dragOffset = useRef<THREE.Vector3>(new THREE.Vector3());

  const handlePointerDown = (event: any) => {
    if (event.button === 0) { // Primary button (trigger)
      setIsDragging(true);
      dragStartPos.current = event.point.clone();
      dragOffset.current.set(
        event.point.x - position[0],
        event.point.y - position[1], 
        event.point.z - position[2]
      );
      event.stopPropagation();
    }
  };

  const handlePointerUp = (event: any) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartPos.current = null;
      
      // If we didn't drag much, treat it as a click
      if (event.point && dragStartPos.current) {
        const dragDistance = event.point.distanceTo(dragStartPos.current);
        if (dragDistance < 0.1) { // Less than 10cm of movement
          onReset();
        }
      }
    }
  };

  const handlePointerMove = (event: any) => {
    if (isDragging && event.point) {
      const newPosition: [number, number, number] = [
        event.point.x - dragOffset.current.x,
        event.point.y - dragOffset.current.y,
        event.point.z - dragOffset.current.z
      ];
      setPosition(newPosition);
    }
  };

  return (
    <group position={position}>
      {/* Reset button - draggable red button */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        <meshBasicMaterial color={isDragging ? "#ffaa33" : hovered ? "#ff6666" : "#ff3333"} />
      </mesh>
      
      {/* Reset text above button */}
      <mesh position={[0, 0.3, 0]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
      
      {/* Glow effect when hovered or dragging */}
      {(hovered || isDragging) && (
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
          <meshBasicMaterial 
            color={isDragging ? "#ffcc88" : "#ffaaaa"} 
            transparent 
            opacity={0.3} 
          />
        </mesh>
      )}
      
      {/* Drag indicator when dragging */}
      {isDragging && (
        <mesh position={[0, -0.3, 0]}>
          <planeGeometry args={[0.6, 0.15]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

function VRContent({ windmills, userLocation }: ImmersiveVRSceneProps) {
  // Calculate user's offset from reference point in fixed world coordinates
  const userOffset = getUserOffsetFromReference(userLocation);
  
  const handleReset = () => {
    // Reset the XR session to recalibrate the headset's tracking space
    const xrSession = (window as any).navigator?.xr?.session;
    if (xrSession) {
      try {
        // Request a new reference space to reset tracking
        xrSession.requestReferenceSpace('local-floor').then((refSpace: any) => {
          console.log('VR tracking space reset successfully');
        });
      } catch (error) {
        console.log('VR reset not supported:', error);
      }
    }
    
    // Force a re-render by triggering a state change
    window.location.reload();
  };
  
  return (
    <>
      {/* Passthrough manager for AR headsets */}
      <PassthroughManager />
      
      {/* VR Reset Button */}
      <VRResetButton onReset={handleReset} />
      
      
      {/* Main scene group - user is at origin, but everything else is positioned in fixed world coordinates */}
      <group position={[0, 0, 0]}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        
        
      </group>
      
      {/* Measurement poles behind user in fixed world coordinates */}
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

      {/* Wind turbines positioned in fixed world coordinates relative to user */}
      {windmills.map((windmill) => {
        // Get windmill position in fixed world coordinates
        const fixedWorldPosition = convertGPSToFixedWorld(windmill.position);
        // Offset by user's position to place user at origin
        const relativePosition: [number, number, number] = [
          fixedWorldPosition[0] - userOffset[0],
          fixedWorldPosition[1] - userOffset[1], 
          fixedWorldPosition[2] - userOffset[2]
        ];
        
        console.log(`Windmill ${windmill.id} fixed world position:`, fixedWorldPosition);
        console.log(`Windmill ${windmill.id} relative to user:`, relativePosition, 
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