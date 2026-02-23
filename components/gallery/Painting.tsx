'use client';

import { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { Project } from '@/lib/projects';
import { useControls } from 'leva';

interface PaintingProps {
  project: Project;
  position: [number, number, number];
}

export default function Painting({ project, position }: PaintingProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const { editMode } = useControls({ editMode: false });

  // Load texture manually to handle SVGs better
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(project.frontmatter.thumbnail);
  }, [project.frontmatter.thumbnail]);

  // Animation for hover
  const { scale, emissiveIntensity } = useSpring({
    scale: hovered ? 1.05 : 1,
    emissiveIntensity: hovered ? 0.2 : 0,
    config: { mass: 1, tension: 280, friction: 60 },
  });

  const handleClick = (e: any) => {
    if (editMode) return;
    e.stopPropagation();
    setClicked(true);
    // In a real app, we might animate the camera here before navigating
    setTimeout(() => {
      router.push(`/projects/${project.frontmatter.slug}`);
    }, 500);
  };

  return (
    <group position={position}>
      {/* Frame */}
      <mesh castShadow receiveShadow position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 1.7, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Canvas */}
      <animated.mesh
        ref={meshRef}
        scale={scale}
        onPointerOver={(e) => {
          if (editMode) return;
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          if (editMode) return;
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={handleClick}
      >
        <planeGeometry args={[2, 1.5]} />
        {/* @ts-ignore */}
        <animated.meshStandardMaterial
          map={texture}
          emissive="#fff"
          emissiveIntensity={emissiveIntensity}
        />
      </animated.mesh>

      {/* Label */}
      <Text
        position={[0, -1.1, 0]}
        fontSize={0.15}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {project.frontmatter.title}
      </Text>

      {/* Spotlight for the painting */}
      <spotLight
        position={[0, 3, 2]}
        angle={0.3}
        penumbra={0.5}
        intensity={2}
        castShadow
        target={meshRef.current || undefined}
      />
    </group>
  );
}
