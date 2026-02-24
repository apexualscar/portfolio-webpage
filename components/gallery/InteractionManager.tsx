'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Project } from '@/lib/projects';
import { useControls } from 'leva';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

interface InteractionManagerProps {
  projects: Project[];
  setInteractableProject: (project: Project | null) => void;
  isZooming: boolean;
  setIsZooming: (zooming: boolean) => void;
  cameraRef?: React.MutableRefObject<any>;
  mode: 'wasd' | 'click';
}

export default function InteractionManager({ projects, setInteractableProject, isZooming, setIsZooming, mode }: InteractionManagerProps) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const center = new THREE.Vector2(0, 0);
  const router = useRouter();
  const { editMode } = useControls({ editMode: false });
  const currentProjectRef = useRef<Project | null>(null);

  useFrame(() => {
    if (editMode || isZooming) {
      if (currentProjectRef.current !== null) {
        currentProjectRef.current = null;
        setInteractableProject(null);
      }
      return;
    }

    raycaster.current.setFromCamera(center, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    let foundProject: Project | null = null;

    for (const intersect of intersects) {
      // Find if the intersected object belongs to a painting
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData?.isPainting && obj.userData?.projectSlug) {
          // Check distance
          if (intersect.distance <= 2.0) {
            const project = projects.find(p => p.frontmatter.slug === obj!.userData.projectSlug);
            if (project) {
              foundProject = project;
            }
          }
          break;
        }
        obj = obj.parent;
      }
      if (foundProject) break;
    }

    if (currentProjectRef.current?.frontmatter.slug !== foundProject?.frontmatter.slug) {
      currentProjectRef.current = foundProject;
      setInteractableProject(foundProject);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (currentProjectRef.current && !isZooming && !editMode) {
          triggerZoom(currentProjectRef.current);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      // If pointer lock is active, a click might just be for shooting/interacting
      if (document.pointerLockElement && currentProjectRef.current && !isZooming && !editMode) {
        triggerZoom(currentProjectRef.current);
      }
    };

    const handleCustomZoom = (e: CustomEvent) => {
      if (!isZooming && !editMode) {
        // In WASD mode, only allow zoom if pointer lock is already active.
        // This prevents the canvas click used to re-acquire lock from
        // simultaneously triggering a painting zoom.
        if (mode === 'wasd' && !document.pointerLockElement) return;
        const project = projects.find(p => p.frontmatter.slug === e.detail.slug);
        if (project) triggerZoom(project);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    document.addEventListener('trigger-zoom', handleCustomZoom as EventListener);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('trigger-zoom', handleCustomZoom as EventListener);
    };
  }, [isZooming, editMode, projects, mode]);

  const triggerZoom = (project: Project) => {
    setIsZooming(true);
    setInteractableProject(null);

    // Save the camera position before zooming so we can return to it
    localStorage.setItem('gallery-camera', JSON.stringify({
      position: camera.position.toArray(),
      rotation: camera.rotation.toArray()
    }));
    sessionStorage.setItem('gallery-zooming', 'true');

    // Find the painting object in the scene to get its exact world position and rotation
    let paintingObj: THREE.Object3D | null = null;
    scene.traverse((child: THREE.Object3D) => {
      if (child.userData?.isPainting && child.userData?.projectSlug === project.frontmatter.slug) {
        paintingObj = child;
      }
    });

    if (paintingObj) {
      const targetPosition = new THREE.Vector3();
      const targetQuaternion = new THREE.Quaternion();
      
      (paintingObj as THREE.Object3D).getWorldPosition(targetPosition);
      (paintingObj as THREE.Object3D).getWorldQuaternion(targetQuaternion);

      // Calculate a position slightly in front of the painting
      const offset = new THREE.Vector3(0, 0, 1.2); // 1.2 units in front
      offset.applyQuaternion(targetQuaternion);
      targetPosition.add(offset);

      // Animate camera
      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: "power2.inOut"
      });

      // For rotation, we need to animate the quaternion or lookAt
      // A simple way is to animate the camera's rotation directly if we use euler, but quaternion is safer
      const startQuat = camera.quaternion.clone();
      
      gsap.to({}, {
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: function() {
          camera.quaternion.slerpQuaternions(startQuat, targetQuaternion, this.progress());
        },
        onComplete: () => {
          router.push(`/projects/${project.frontmatter.slug}`);
        }
      });
    } else {
      // Fallback if object not found
      router.push(`/projects/${project.frontmatter.slug}`);
    }
  };

  return null;
}
