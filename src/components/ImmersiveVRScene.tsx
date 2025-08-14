'use client';

import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { VRButton, XR, createXRStore, useXR } from '@react-three/xr';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { SharedSceneContent } from './SharedSceneContent';
import { WindmillConfig, UserLocation } from '@/types/windmill';

// Extended event types for XR interactions
interface XRPointerEvent extends Omit<ThreeEvent<PointerEvent>, 'point' | 'pointerType'> {
  point?: THREE.Vector3;
  pointerType?: string;
}

interface XRClickEvent extends Omit<ThreeEvent<MouseEvent>, 'pointerType'> {
  pointerType?: string;
}

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
  const [clicked, setClicked] = useState(false);
  const position: [number, number, number] = [0, 1.2, -1.5];

  const handleClick = (event: XRClickEvent) => {
    console.log('Reset button clicked via', event.pointerType);
    setClicked(true);
    onReset();
    event.stopPropagation();
    
    setTimeout(() => setClicked(false), 200);
  };

  return (
    <group position={position}>
      {/* Reset button - small clickable red button */}
      <mesh
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
        <meshBasicMaterial color={clicked ? "#ff8800" : hovered ? "#ff6666" : "#ff3333"} />
      </mesh>
      
      {/* Reset text above button */}
      <mesh position={[0, 0.2, 0]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
      
      {/* Glow effect when hovered */}
      {hovered && (
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.01, 12]} />
          <meshBasicMaterial 
            color="#ffaaaa"
            transparent 
            opacity={0.3} 
          />
        </mesh>
      )}
    </group>
  );
}

function VRContent({ windmills, userLocation }: ImmersiveVRSceneProps) {
  const session = useXR((state) => state.session);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (session) {
      console.log('XR Session active:', {
        enabledFeatures: session.enabledFeatures,
        supportedFrameRates: session.supportedFrameRates,
        inputSources: session.inputSources?.length || 0,
      });
    }
  }, [session]);

  useEffect(() => {
    if (resetMessage) {
      const timer = setTimeout(() => setResetMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [resetMessage]);
  
  const handleReset = async () => {
    try {
      setResetMessage('Attempting VR reset...');
      
      // Check if GPS coordinates are available
      if (!userLocation.latitude || !userLocation.longitude) {
        setResetMessage('Error: GPS coordinates not available. Please enable location services and try again.');
        return;
      }

      // Reset the XR session to recalibrate the headset's tracking space
      const xrSession = session || (window as typeof window & { navigator: Navigator & { xr?: { session?: XRSession } } }).navigator?.xr?.session;
      
      if (xrSession && xrSession.requestReferenceSpace) {
        try {
          // Request a new reference space to reset tracking
          await xrSession.requestReferenceSpace('local-floor');
          setResetMessage('VR tracking space reset successfully!');
          console.log('VR tracking space reset successfully');
        } catch (referenceError) {
          console.warn('Failed to reset reference space:', referenceError);
          setResetMessage('VR reset partially successful. Try removing and putting on headset again.');
        }
      } else {
        setResetMessage('VR reset not supported on this device. Try removing and putting on headset again.');
        console.log('VR reset not supported - no active XR session or requestReferenceSpace method');
      }
    } catch (error) {
      console.error('VR reset failed:', error);
      setResetMessage(`Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}. You can try clicking the button again.`);
    }
  };
  
  return (
    <>
      {/* Passthrough manager for VR headsets */}
      <PassthroughManager />
      
      {/* VR Controllers and Hands are now handled automatically by the XRStore configuration */}
      
      {/* VR Reset Button */}
      <VRResetButton onReset={handleReset} />
      
      {/* Reset message display in VR */}
      {resetMessage && (
        <group position={[0, 2, -2]}>
          <mesh>
            <planeGeometry args={[3, 0.8]} />
            <meshBasicMaterial 
              color={resetMessage.includes('Error') || resetMessage.includes('failed') ? "#ff6666" : 
                     resetMessage.includes('successfully') ? "#66ff66" : "#ffff66"} 
              transparent 
              opacity={0.9} 
            />
          </mesh>
          {/* Text representation - in a real app, you'd use Text component */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[2.8, 0.6]} />
            <meshBasicMaterial color="black" transparent opacity={0.8} />
          </mesh>
        </group>
      )}
      
      {/* Shared scene content */}
      <SharedSceneContent 
        windmills={windmills} 
        userLocation={userLocation}
        showCompass={true}
        showMeasurementPoles={true}
      />
    </>
  );
}

export function ImmersiveVRScene({ windmills, userLocation }: ImmersiveVRSceneProps) {
  const store = createXRStore({
    // Customize the default hand ray appearance
    hand: {
      rayPointer: { rayModel: { color: '#00E5FF' } },
    },
    // Customize controller ray appearance
    controller: {
      rayPointer: { rayModel: { color: '#FF6B6B' } },
    },
  });
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
          far: 200000 // Increased far plane to 200km for very distant windmills
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
        <h2 className="text-lg font-bold mb-2">🥽 VR Mode</h2>
        <p className="text-sm mb-1">Put on your Oculus Quest 3 and click &quot;Enter VR&quot;</p>
        <p className="text-sm mb-1">Your location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
        <p className="text-xs text-green-300 mb-1">✓ Windmills stay in fixed world positions</p>
        <p className="text-xs text-blue-300 mb-1">🧭 Compass shows your real-world orientation</p>
        <p className="text-xs text-purple-300 mb-1">👁️ Mixed Reality: See real world + windmills</p>
        <p className="text-xs text-gray-300 mb-1">Spatial audio enabled - wind turbine sounds based on distance</p>
        <p className="text-xs text-cyan-300">👋 Hand tracking supported - pinch to interact</p>
      </div>
    </div>
  );
}