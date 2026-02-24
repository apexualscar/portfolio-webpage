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
  const [unityActive, setUnityActive] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const isUnity = project.frontmatter.shaderType === 'unity';

  const { editMode } = useControls({ editMode: false });

  // Animation for hover
  const { scale, emissiveIntensity } = useSpring({
    scale: hovered ? 1.05 : 1,
    emissiveIntensity: hovered ? 0.2 : 0,
    config: { mass: 1, tension: 280, friction: 60 },
  });

  // Escape key closes the Unity overlay
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUnityActive(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClick = (e: any) => {
    if (editMode) return;
    e.stopPropagation();
    
    // Only allow clicking if within 2.0 units (the "View" distance)
    if (e.distance > 2.0) return;

    // Unity paintings open inline rather than navigating away
    if (isUnity) {
      setUnityActive(true);
      return;
    }

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

      {/* Unity WebGL overlay — lives in DOM space via <Html transform> so an iframe can run here */}
      {isUnity && (
        <Html
          transform
          occlude
          position={[0, 0, 0.03]}
          scale={0.01}
          // While inactive, pointer events are none so the mesh click handler still fires
          style={{ pointerEvents: unityActive ? 'auto' : 'none' }}
        >
          <div style={{ width: 200, height: 150, overflow: 'hidden', borderRadius: 4, background: '#000', position: 'relative' }}>
            {unityActive ? (
              <>
                <iframe
                  src={`${project.frontmatter.shaderSrc}/index.html`}
                  width={200}
                  height={150}
                  style={{ border: 'none', display: 'block' }}
                  allow="autoplay; fullscreen; vr"
                />
                {/* Close button */}
                <button
                  onClick={() => setUnityActive(false)}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.65)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '50%', width: 22, height: 22,
                    cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >✕</button>
              </>
            ) : (
              /* Passive overlay — pointer-events: none, only visible on hover */
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: hovered ? 'rgba(0,0,0,0.5)' : 'transparent',
                color: '#fff', gap: 6,
                transition: 'background 0.2s',
              }}>
                {hovered && (
                  <>
                    <div style={{ fontSize: 30 }}>▶</div>
                    <div style={{ fontSize: 9, opacity: 0.75, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Click to Play</div>
                  </>
                )}
              </div>
            )}
          </div>
        </Html>
      )}

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
