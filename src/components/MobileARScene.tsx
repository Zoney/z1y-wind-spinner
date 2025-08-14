'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import { PerspectiveCamera, VideoTexture } from 'three';
import { Sky, Environment, Stars } from '@react-three/drei';
import { WindmillWithAudio } from './WindmillWithAudio';
import { WindmillConfig, UserLocation } from '@/types/windmill';
import { convertGPSToLocal } from '@/utils/coordinates';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface MobileARSceneProps {
  windmills: WindmillConfig[];
  userLocation: UserLocation;
}

interface ARCameraProps {
  orientation: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    absolute: boolean;
  };
  videoTexture?: VideoTexture;
}

function ARCamera({ orientation, videoTexture }: ARCameraProps) {
  const { camera, scene } = useThree();
  const cameraRef = useRef<PerspectiveCamera>(null);

  useFrame(() => {
    if (!cameraRef.current) return;
    
    // Only apply orientation if we have valid data
    if (orientation.alpha !== null && orientation.beta !== null && orientation.gamma !== null) {
      // Device orientation API values:
      // - alpha: compass heading (0-360°, 0 = North)
      // - beta: device pitch (0° = flat, 90° = upright, -90° = upside down)
      // - gamma: device roll (left/right tilt)
      
      // Convert to radians
      const alpha = (orientation.alpha * Math.PI) / 180;
      const beta = (orientation.beta * Math.PI) / 180;  
      const gamma = (orientation.gamma * Math.PI) / 180;

      // Use quaternion-based rotation to avoid gimbal lock
      // Create rotation from device orientation using proper ZXY order
      cameraRef.current.rotation.order = 'ZXY';
      
      // Map device orientation to camera rotation:
      // - Y rotation (yaw): compass heading (alpha)
      // - X rotation (pitch): device tilt (beta) with proper offset
      // - Z rotation (roll): device roll (gamma) - minimal for stability
      
      cameraRef.current.rotation.y = -alpha; // Negative for correct compass direction
      cameraRef.current.rotation.x = -(beta - Math.PI / 2); // Corrected pitch mapping
      cameraRef.current.rotation.z = gamma * 0.1; // Dampened roll for stability
    }

    // Update background with camera feed
    if (videoTexture && scene.background !== videoTexture) {
      scene.background = videoTexture;
    }
  });

  useEffect(() => {
    cameraRef.current = camera as PerspectiveCamera;
  }, [camera]);

  return null;
}

function ARContent({ windmills, userLocation, orientation, videoTexture }: MobileARSceneProps & { orientation: ARCameraProps['orientation']; videoTexture?: VideoTexture }) {
  
  return (
    <>
      {/* AR Camera controls */}
      <ARCamera orientation={orientation} videoTexture={videoTexture} />
      
      {/* Main scene group - user is at origin */}
      <group position={[0, 0, 0]}>
        {/* Enhanced lighting for AR visibility */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.8} />
        <directionalLight position={[0, 20, 0]} intensity={0.6} />
        
        {/* Environment - very subtle for AR overlay */}
        {!videoTexture && (
          <group>
            <Sky
              distance={450000}
              sunPosition={[0, 1, 0]}
              inclination={0}
              azimuth={0.25}
            />
            <Environment preset="sunset" />
            <Stars
              radius={100}
              depth={50}
              count={3000}
              factor={2}
              saturation={0}
              fade
              speed={1}
            />
          </group>
        )}
        
        {/* Ground plane - very transparent for AR overlay */}
        <mesh position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial 
            color="#2d5016" 
            transparent 
            opacity={videoTexture ? 0.05 : 0.1} 
          />
        </mesh>
        
      </group>
      
      {/* Debug: Reference axes and markers */}
      <group>
        {/* Close debug markers to test visibility */}
        <mesh position={[10, 5, 0]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={[0, 5, -10]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        <mesh position={[-10, 5, 0]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color="green" />
        </mesh>
        
        {/* Distance markers every 100m */}
        {[100, 200, 500, 1000, 2000].map(distance => (
          <group key={distance}>
            <mesh position={[distance, 10, 0]}>
              <sphereGeometry args={[5, 8, 8]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
            <mesh position={[0, 10, -distance]}>
              <sphereGeometry args={[5, 8, 8]} />
              <meshBasicMaterial color="cyan" />
            </mesh>
          </group>
        ))}
        
        {/* X axis (red) - pointing east */}
        <mesh position={[25, 1, 0]}>
          <boxGeometry args={[50, 2, 2]} />
          <meshBasicMaterial color="red" />
        </mesh>
        {/* Z axis (blue) - pointing north */}
        <mesh position={[0, 1, -25]}>
          <boxGeometry args={[2, 2, 50]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        {/* Y axis (green) - pointing up */}
        <mesh position={[0, 25, 0]}>
          <boxGeometry args={[2, 50, 2]} />
          <meshBasicMaterial color="green" />
        </mesh>
      </group>

      {/* Wind turbines positioned relative to user at origin */}
      {windmills.map((windmill) => {
        const relativePosition = convertGPSToLocal(windmill.position, userLocation);
        
        // Validate position is reasonable
        if (!relativePosition || relativePosition.some(coord => !isFinite(coord))) {
          console.error(`Invalid position for windmill ${windmill.id}:`, relativePosition);
          return null;
        }
        
        // Calculate distance for debugging
        const distance = Math.sqrt(relativePosition[0]**2 + relativePosition[2]**2);
        
        // Only show windmills within reasonable distance (50km max)
        if (distance > 50000) {
          console.warn(`Windmill ${windmill.id} too far away: ${distance.toFixed(1)}m`);
          return null;
        }
        
        // Ensure windmill is at proper height relative to ground
        // Windmills should appear at their GPS altitude, which includes the tower height
        const windmillGroundHeight = relativePosition[1]; // This is the altitude difference
        const windmillTowerBase = windmillGroundHeight; // Tower base at ground level
        const windmillHeight = windmill.height || 100; // Default 100m tower
        
        console.log(`AR Windmill ${windmill.id}:`, {
          position: relativePosition,
          distance: `${distance.toFixed(1)}m`,
          altitude: `${windmillGroundHeight.toFixed(1)}m`,
          towerHeight: `${windmillHeight}m`,
          coordinates: `GPS(${windmill.position.latitude.toFixed(6)}, ${windmill.position.longitude.toFixed(6)})`
        });
        
        return (
          <group key={windmill.id}>
            {/* Ground marker at base of windmill */}
            <mesh position={[relativePosition[0], windmillTowerBase + 5, relativePosition[2]]}>
              <sphereGeometry args={[8, 8, 8]} />
              <meshBasicMaterial color="red" />
            </mesh>
            
            {/* Tall marker at nacelle height (top of tower) */}
            <mesh position={[relativePosition[0], windmillTowerBase + windmillHeight, relativePosition[2]]}>
              <sphereGeometry args={[12, 8, 8]} />
              <meshBasicMaterial color="magenta" />
            </mesh>
            
            {/* Vertical line showing tower height */}
            <mesh position={[relativePosition[0], windmillTowerBase + windmillHeight / 2, relativePosition[2]]}>
              <boxGeometry args={[2, windmillHeight, 2]} />
              <meshBasicMaterial color="orange" transparent opacity={0.7} />
            </mesh>
            
            {/* Actual windmill - positioned at ground level */}
            <WindmillWithAudio
              config={windmill}
              position={[relativePosition[0], windmillTowerBase, relativePosition[2]]}
              userLocation={userLocation}
            />
          </group>
        );
      })}
    </>
  );
}

export function MobileARScene({ windmills, userLocation }: MobileARSceneProps) {
  const { orientation, isSupported, hasPermission, error, requestPermission } = useDeviceOrientation();
  const [videoTexture, setVideoTexture] = useState<VideoTexture | undefined>();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const initialCameraPosition: [number, number, number] = [0, 1.7, 0]; // User eye height

  // Initialize camera feed
  useEffect(() => {
    if (!hasPermission) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
          const texture = new VideoTexture(video);
          texture.needsUpdate = true;
          setVideoTexture(texture);
        };
      } catch (err) {
        console.error('Camera access failed:', err);
        setCameraError('Camera access failed. AR mode will work without camera background.');
      }
    };

    initCamera();

    return () => {
      if (videoTexture) {
        const video = videoTexture.image as HTMLVideoElement;
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  // Show permission UI if needed
  if (!hasPermission && isSupported) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-4">Enable AR Mode</h2>
          <p className="text-white/80 mb-4 text-sm">
            Allow device orientation access to use your phone like AR glasses
          </p>
          {error && (
            <p className="text-red-300 mb-4 text-sm">
              {error}
            </p>
          )}
          <button
            onClick={requestPermission}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Enable Device Orientation
          </button>
        </div>
      </div>
    );
  }

  // Show error if not supported
  if (!isSupported) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-4">AR Not Supported</h2>
          <p className="text-white/80 text-sm">
            Device orientation is not supported on this device or browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
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
          alpha: !videoTexture // Enable transparency only when no camera background
        }}
      >
        <ARContent 
          windmills={windmills} 
          userLocation={userLocation} 
          orientation={orientation}
          videoTexture={videoTexture}
        />
      </Canvas>
      
      <div className="absolute top-4 left-4 z-10 bg-black/75 text-white p-4 rounded-lg max-w-sm">
        <h2 className="text-lg font-bold mb-2">📱 AR Mode Active</h2>
        <p className="text-sm mb-1">Move your device to look around</p>
        <p className="text-sm mb-1">Location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
        <p className="text-xs text-green-300 mb-1">✓ Windmills positioned in real world</p>
        <p className="text-xs text-blue-300 mb-1">🧭 Compass shows device orientation</p>
        {videoTexture && (
          <p className="text-xs text-yellow-300 mb-1">📷 Camera background active</p>
        )}
        {cameraError && (
          <p className="text-xs text-orange-300 mb-1">⚠️ {cameraError}</p>
        )}
        <div className="text-xs text-gray-300 mt-2">
          {orientation.alpha !== null && (
            <div>Heading: {Math.round(orientation.alpha || 0)}°</div>
          )}
          {orientation.beta !== null && (
            <div>Tilt: {Math.round(orientation.beta || 0)}°</div>
          )}
          {orientation.gamma !== null && (
            <div>Roll: {Math.round(orientation.gamma || 0)}°</div>
          )}
        </div>
      </div>
    </div>
  );
}