'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import * as THREE from 'three';

interface ARCameraControllerProps {
  enableControls?: boolean;
}

export function ARCameraController({ enableControls = true }: ARCameraControllerProps) {
  const { camera } = useThree();
  const { orientation, permission } = useDeviceOrientation();
  const quaternion = useRef(new THREE.Quaternion());
  const euler = useRef(new THREE.Euler());
  
  // Screen orientation offset
  const screenOrientationOffset = useRef(0);

  useEffect(() => {
    // Update screen orientation offset when screen orientation changes
    const updateScreenOrientation = () => {
      screenOrientationOffset.current = (screen.orientation?.angle || 0) * Math.PI / 180;
    };
    
    updateScreenOrientation();
    screen.orientation?.addEventListener('change', updateScreenOrientation);
    
    return () => {
      screen.orientation?.removeEventListener('change', updateScreenOrientation);
    };
  }, []);

  // Remove automatic permission request - let parent component handle this

  useFrame(() => {
    if (!enableControls || !orientation || permission !== 'granted') return;

    // Convert device orientation to camera rotation
    // Device coordinates: alpha (compass), beta (pitch), gamma (roll)
    // We need to map these to Three.js camera rotations
    
    const alpha = orientation.alpha * Math.PI / 180; // Compass heading (yaw)
    const beta = orientation.beta * Math.PI / 180;   // Pitch (up/down)
    const gamma = orientation.gamma * Math.PI / 180; // Roll (left/right)
    
    // Create rotation from device orientation
    // Order matters: YXZ is the standard for device orientation
    euler.current.set(
      beta,  // X rotation (pitch)
      alpha, // Y rotation (yaw/compass)
      -gamma // Z rotation (roll, negated because device gamma is opposite to camera roll)
    );
    euler.current.order = 'YXZ';
    
    // Apply screen orientation compensation
    euler.current.z += screenOrientationOffset.current;
    
    // Convert to quaternion and apply to camera
    quaternion.current.setFromEuler(euler.current);
    camera.quaternion.copy(quaternion.current);
    
    // Ensure camera position stays at origin (user's location)
    camera.position.set(0, 1.6, 0); // Standard eye height
  });

  // Remove auto-request on interaction - let parent component handle this

  return null; // This component only controls the camera, doesn't render anything
}