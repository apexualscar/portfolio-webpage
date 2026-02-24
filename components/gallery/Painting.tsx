'use client';

import { materialRegistry } from '@/materials/registry';
import { galleryState } from '@/lib/galleryState';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, useVideoTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { Project } from '@/lib/projects';
import { useControls } from 'leva';

interface PaintingProps {
  project: Project;
  position: [number, number, number];
}

function VideoMaterial({ url, emissiveIntensity }: { url: string, emissiveIntensity: any }) {
  const texture = useVideoTexture(url);
  return (
    <>
      {/* @ts-ignore */}
      <animated.meshStandardMaterial
        map={texture}
        emissive="#fff"
        emissiveIntensity={emissiveIntensity}
      />
    </>
  );
}

function ImageMaterial({ url, emissiveIntensity }: { url: string, emissiveIntensity: any }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(url);
  }, [url]);

  return (
    <>
      {/* @ts-ignore */}
      <animated.meshStandardMaterial
        map={texture}
        emissive="#fff"
        emissiveIntensity={emissiveIntensity}
        transparent={true}
      />
    </>
  );
}

function ShaderMaterial({ src, emissiveIntensity }: { src: string, emissiveIntensity: any }) {
  const [shaderCode, setShaderCode] = useState<string | null>(null);
  const timeRef = useRef(0);

  // Stable ref so R3F reconciler never resets uTime back to 0 on re-render.
  const uniforms = useRef({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(2, 1.5) }
  });

  useEffect(() => {
    fetch(src)
      .then(res => res.text())
      .then(text => setShaderCode(text))
      .catch(err => console.error("Failed to load shader", err));
  }, [src]);

  useFrame((_state, delta) => {
    if (galleryState.isZooming) return;
    timeRef.current += delta;
    uniforms.current.uTime.value = timeRef.current;
  });

  if (!shaderCode) {
    // @ts-ignore
    return <animated.meshStandardMaterial color="#333" emissiveIntensity={emissiveIntensity} />;
  }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // @ts-ignore
  return (
    <animated.shaderMaterial
      uniforms={uniforms.current}
      vertexShader={vertexShader}
      fragmentShader={shaderCode}
    />
  );
}

export default function Painting({ project, position }: PaintingProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const { editMode } = useControls({ editMode: false });

  // Animation for hover
  const { scale, emissiveIntensity } = useSpring({
    scale: hovered ? 1.05 : 1,
    emissiveIntensity: hovered ? 0.2 : 0,
    config: { mass: 1, tension: 280, friction: 60 },
  });

  const handleClick = (e: any) => {
    if (editMode) return;
    e.stopPropagation();
    
    // Only allow clicking if within 2.0 units (the "View" distance)
    if (e.distance > 2.0) return;

    setClicked(true);
    
    // Dispatch custom event for InteractionManager to handle the zoom
    const event = new CustomEvent('trigger-zoom', { detail: { slug: project.frontmatter.slug } });
    document.dispatchEvent(event);
  };

  const isVideo = project.frontmatter.videoUrl?.endsWith('.mp4') || project.frontmatter.videoUrl?.endsWith('.webm');
  const materialKey = typeof project.frontmatter.material === 'string' ? project.frontmatter.material : undefined;
  const MaterialComponent = materialKey ? materialRegistry[materialKey] : undefined;

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
        position={[0, 0, 0.01]} // Fix z-fighting by moving slightly in front of the frame
        scale={scale}
        userData={{ isPainting: true, projectSlug: project.frontmatter.slug }}
        onPointerMove={(e) => {
          if (editMode) return;
          e.stopPropagation();
          if (e.distance <= 2.0) {
            if (!hovered) {
              setHovered(true);
              document.body.style.cursor = 'pointer';
            }
          } else {
            if (hovered) {
              setHovered(false);
              document.body.style.cursor = 'auto';
            }
          }
        }}
        onPointerOut={(e) => {
          if (editMode) return;
          e.stopPropagation();
          if (hovered) {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }
        }}
        onClick={handleClick}
      >
        <planeGeometry args={[2, 1.5]} />
        {isVideo ? (
          <VideoMaterial url={project.frontmatter.videoUrl!} emissiveIntensity={emissiveIntensity} />
        ) : MaterialComponent ? (
          <MaterialComponent emissiveIntensity={emissiveIntensity} />
        ) : (
          <ImageMaterial url={project.frontmatter.thumbnail} emissiveIntensity={emissiveIntensity} />
        )}
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
