'use client';

import { useEffect, useState, useRef } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';

interface PlayerControllerProps {
  mode: 'wasd' | 'click';
  hasSelectedMode: boolean;
  showSettings: boolean;
  cameraRef?: React.MutableRefObject<any>;
}

export default function PlayerController({ mode, hasSelectedMode, showSettings, cameraRef }: PlayerControllerProps) {
  const { camera, gl, scene } = useThree();
  
  // Save camera position/rotation on unmount (leaving gallery)
  useEffect(() => {
    return () => {
      if (camera && sessionStorage.getItem('gallery-zooming') !== 'true') {
        localStorage.setItem('gallery-camera', JSON.stringify({
          position: camera.position.toArray(),
          rotation: camera.rotation.toArray(),
        }));
      }
    };
  }, [camera]);

  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const controlsRef = useRef<any>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mousePos = useRef({ x: 0, y: 0 });

  // Floor cursor for click mode
  const indicatorRef = useRef<THREE.Mesh>(null);
  // A mathematical plane at y=0.01 used for fast cursor raycasting
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.01));

  const { editMode } = useControls({ editMode: false });

  // Track mouse position for edge panning in click mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      // Three.js NDC Y is +1 at top, -1 at bottom — invert from screen coords
      mousePos.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // WASD State
  const movement = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings || !hasSelectedMode || editMode) return;
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
  }, [showSettings, hasSelectedMode, editMode]);

  // If settings are opened, stop movement
  useEffect(() => {
    if (showSettings || !hasSelectedMode || editMode) {
      movement.current = { forward: false, backward: false, left: false, right: false };
      
      // Only attempt to unlock if we are currently locked
      // This prevents the "user has exited the lock before this request was completed" error
      if (controlsRef.current && controlsRef.current.isLocked) {
        try {
          controlsRef.current.unlock();
        } catch (e) {
          // Ignore PointerLock errors when the user has already exited the lock
        }
      }
    }
  }, [showSettings, hasSelectedMode, editMode, mode]);

  useFrame((state, delta) => {
    if (!hasSelectedMode || showSettings || editMode) return;

    const checkCollision = (direction: THREE.Vector3, distance: number) => {
      // Raycast from slightly below the camera to avoid hitting the ceiling
      const origin = camera.position.clone();
      origin.y -= 0.5; 
      
      raycaster.current.set(origin, direction.normalize());
      
      // Intersect against all objects in the scene except the invisible floor plane
      const intersects = raycaster.current.intersectObjects(
        scene.children.filter(c => c.type !== 'Mesh' || (c as THREE.Mesh).geometry.type !== 'PlaneGeometry'), 
        true
      );

      // If we hit something within the movement distance + a small buffer (player radius)
      if (intersects.length > 0 && intersects[0].distance < distance + 0.5) {
        return true;
      }
      return false;
    };

    if (mode === 'wasd' && controlsRef.current?.isLocked) {
      const speed = 5 * delta;
      
      // Calculate intended movement vectors
      const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forwardVector.y = 0;
      forwardVector.normalize();

      const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      rightVector.y = 0;
      rightVector.normalize();

      // Apply movement if no collision
      if (movement.current.forward && !checkCollision(forwardVector, speed)) {
        controlsRef.current.moveForward(speed);
      }
      if (movement.current.backward && !checkCollision(forwardVector.clone().negate(), speed)) {
        controlsRef.current.moveForward(-speed);
      }
      if (movement.current.right && !checkCollision(rightVector, speed)) {
        controlsRef.current.moveRight(speed);
      }
      if (movement.current.left && !checkCollision(rightVector.clone().negate(), speed)) {
        controlsRef.current.moveRight(-speed);
      }
      
      // Keep camera at fixed height
      camera.position.y = 1.6;
    } else if (mode === 'click') {
      // In click mode the camera should always stay level — zero out any accumulated
      // pitch (x) or roll (z) that might have been left by the zoom animation.
      if (camera.rotation.x !== 0 || camera.rotation.z !== 0) {
        camera.rotation.set(0, camera.rotation.y, 0);
      }

      // Update floor cursor indicator position via plane intersection
      if (indicatorRef.current) {
        const mouseNDC = new THREE.Vector2(mousePos.current.x, mousePos.current.y);
        raycaster.current.setFromCamera(mouseNDC, camera);
        const hit = new THREE.Vector3();
        const intersected = raycaster.current.ray.intersectPlane(floorPlane.current, hit);
        if (intersected) {
          indicatorRef.current.position.set(hit.x, 0.02, hit.z);
          // Subtle pulse on scale
          const pulse = 1 + 0.08 * Math.sin(state.clock.elapsedTime * 3);
          indicatorRef.current.scale.setScalar(pulse);
        } else {
          // Hide below floor if no intersection
          indicatorRef.current.position.set(0, -100, 0);
        }
      }

      // Edge panning — rotate camera when mouse nears screen edge
      const edgeThreshold = 0.80;
      const panSpeed = 1.8 * delta;
      const mx = mousePos.current.x;

      if (Math.abs(mx) > edgeThreshold) {
        const sign = mx > 0 ? -1 : 1;
        const intensity = (Math.abs(mx) - edgeThreshold) / (1 - edgeThreshold);
        // Explicitly zero out pitch (x) and roll (z) so edge-panning can never
        // accumulate vertical tilt from prior zoom animations.
        camera.rotation.set(0, camera.rotation.y + sign * intensity * panSpeed, 0);
      }

      if (targetPosition) {
        // Calculate direction to target
        const direction = new THREE.Vector3().subVectors(targetPosition, camera.position);
        direction.y = 0;
        const distanceToTarget = direction.length();

        if (distanceToTarget > 0.1) {
          // Check if path is clear
          if (!checkCollision(direction, 0.2)) {
            camera.position.lerp(targetPosition, 0.1);
          } else {
            // Stop moving if we hit a wall
            setTargetPosition(null);
          }
        } else {
          setTargetPosition(null);
        }
      }
    }
  });

  const handleFloorClick = (e: any) => {
    if (mode === 'click' && !showSettings && hasSelectedMode && !editMode) {
      const point = e.point;
      setTargetPosition(new THREE.Vector3(point.x, 1.6, point.z));
    }
  };

  return (
    <>
      {mode === 'wasd' && hasSelectedMode && !showSettings && !editMode && <PointerLockControls ref={controlsRef} />}
      
      {/* Invisible floor plane for click-to-move raycasting */}
      {mode === 'click' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={handleFloorClick} visible={false}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial />
        </mesh>
      )}

      {/* Floor cursor ring — shows where the player will walk to */}
      {mode === 'click' && hasSelectedMode && (
        <mesh ref={indicatorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -100, 0]} renderOrder={999}>
          <ringGeometry args={[0.20, 0.34, 48]} />
          <meshBasicMaterial color="#ffffff" opacity={0.9} transparent depthTest={false} depthWrite={false} />
        </mesh>
      )}
    </>
  );
}
