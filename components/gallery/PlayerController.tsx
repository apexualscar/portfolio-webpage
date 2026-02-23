'use client';

import { useEffect, useState, useRef } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerControllerProps {
  mode: 'wasd' | 'click';
  hasSelectedMode: boolean;
  showSettings: boolean;
}

export default function PlayerController({ mode, hasSelectedMode, showSettings }: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const controlsRef = useRef<any>(null);

  // WASD State
  const movement = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings || !hasSelectedMode) return;
      switch (e.code) {
        case 'KeyW': movement.current.forward = true; break;
        case 'KeyS': movement.current.backward = true; break;
        case 'KeyA': movement.current.left = true; break;
        case 'KeyD': movement.current.right = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': movement.current.forward = false; break;
        case 'KeyS': movement.current.backward = false; break;
        case 'KeyA': movement.current.left = false; break;
        case 'KeyD': movement.current.right = false; break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [showSettings, hasSelectedMode]);

  // If settings are opened, stop movement
  useEffect(() => {
    if (showSettings || !hasSelectedMode) {
      movement.current = { forward: false, backward: false, left: false, right: false };
      if (controlsRef.current?.isLocked) {
        controlsRef.current.unlock();
      }
    }
  }, [showSettings, hasSelectedMode]);

  useFrame((state, delta) => {
    if (!hasSelectedMode || showSettings) return;

    if (mode === 'wasd' && controlsRef.current?.isLocked) {
      const speed = 5 * delta;
      
      if (movement.current.forward) controlsRef.current.moveForward(speed);
      if (movement.current.backward) controlsRef.current.moveForward(-speed);
      if (movement.current.right) controlsRef.current.moveRight(speed);
      if (movement.current.left) controlsRef.current.moveRight(-speed);
      
      // Keep camera at fixed height
      camera.position.y = 1.6;
    } else if (mode === 'click' && targetPosition) {
      // Lerp camera to target position
      camera.position.lerp(targetPosition, 0.1);
      if (camera.position.distanceTo(targetPosition) < 0.1) {
        setTargetPosition(null);
      }
    }
  });

  const handleFloorClick = (e: any) => {
    if (mode === 'click' && !showSettings && hasSelectedMode) {
      const point = e.point;
      setTargetPosition(new THREE.Vector3(point.x, 1.6, point.z));
    }
  };

  return (
    <>
      {mode === 'wasd' && hasSelectedMode && !showSettings && <PointerLockControls ref={controlsRef} />}
      
      {/* Invisible floor plane for click-to-move raycasting */}
      {mode === 'click' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={handleFloorClick} visible={false}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial />
        </mesh>
      )}
    </>
  );
}
