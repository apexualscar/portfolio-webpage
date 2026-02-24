'use client';

import { materialRegistry } from '@/materials/registry';
import { galleryState } from '@/lib/galleryState';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useVideoTexture } from '@react-three/drei';
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

// ---------------------------------------------------------------------------
// Homographic (perspective) helpers
// Computes a CSS matrix3d string that maps a rectangle of size (W×H) to an
// arbitrary quad defined by four 2-D screen points (order: TL, TR, BR, BL).
// Based on the adjugate method from https://franklinta.com/2014/09/08/computing-css-matrix3d-transforms/
// ---------------------------------------------------------------------------
function adj3(m: number[]): number[] {
  return [
    m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4],
    m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5],
    m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3],
  ];
}
function mm3(a: number[], b: number[]): number[] {
  const c = new Array(9).fill(0);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        c[3*i+j] += a[3*i+k] * b[3*k+j];
  return c;
}
function mv3(m: number[], v: number[]): number[] {
  return [
    m[0]*v[0]+m[1]*v[1]+m[2]*v[2],
    m[3]*v[0]+m[4]*v[1]+m[5]*v[2],
    m[6]*v[0]+m[7]*v[1]+m[8]*v[2],
  ];
}
function basisToPoints(pts: [number,number][]): number[] {
  const [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] = pts;
  const m = [x1,x2,x3, y1,y2,y3, 1,1,1];
  const v = mv3(adj3(m), [x4, y4, 1]);
  return mm3(m, [v[0],0,0, 0,v[1],0, 0,0,v[2]]);
}
function homography(W: number, H: number, to: [number,number][]): string {
  const from: [number,number][] = [[0,0],[W,0],[W,H],[0,H]];
  const T = basisToPoints(to);
  const F = basisToPoints(from);
  const M = mm3(T, adj3(F));
  for (let i = 0; i < 9; i++) M[i] /= M[8];
  // CSS matrix3d is column-major; map 2-D homography (skipping z row/col)
  return `matrix3d(${M[0]},${M[3]},0,${M[6]}, ${M[1]},${M[4]},0,${M[7]}, 0,0,1,0, ${M[2]},${M[5]},0,1)`;
}
// ---------------------------------------------------------------------------

// Natural pixel size of the iframe (must match Unity canvas aspect ≈ 4:3)
const IFRAME_W = 800;
const IFRAME_H = 600;

// Mounts a full-canvas fixed div containing an iframe and applies a CSS
// matrix3d each frame so the iframe exactly follows the perspective-warped
// painting mesh, including when viewed from oblique angles.
function UnityOnMesh({ src, meshRef }: { src: string; meshRef: React.RefObject<THREE.Mesh | null> }) {
  const { camera, gl } = useThree();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Outer div covers the full canvas so overflow:hidden clips perspective edges.
    const container = document.createElement('div');
    container.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:10;';

    // Inner div is the element we apply matrix3d to.
    const wrap = document.createElement('div');
    wrap.style.cssText =
      `position:absolute;left:0;top:0;width:${IFRAME_W}px;height:${IFRAME_H}px;transform-origin:0 0;overflow:hidden;`;

    const iframe = document.createElement('iframe');
    iframe.src = `${src}/index.html`;
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.setAttribute('allow', 'autoplay; fullscreen; vr');
    iframe.setAttribute('scrolling', 'no');
    iframe.title = 'Unity WebGL';

    wrap.appendChild(iframe);
    container.appendChild(wrap);
    document.body.appendChild(container);

    containerRef.current = container;
    iframeWrapRef.current = wrap;

    return () => {
      document.body.removeChild(container);
      containerRef.current = null;
      iframeWrapRef.current = null;
    };
  }, [src]);

  useFrame(() => {
    const wrap = iframeWrapRef.current;
    const mesh = meshRef.current;
    if (!wrap || !mesh) return;

    // Project all 4 corners of the plane (local space) → viewport px
    const corners: [number, number, number][] = [
      [-1,  0.75, 0], // TL
      [ 1,  0.75, 0], // TR
      [ 1, -0.75, 0], // BR
      [-1, -0.75, 0], // BL
    ];

    const rect = gl.domElement.getBoundingClientRect();

    const screen = corners.map(([x, y, z]) => {
      const v = new THREE.Vector3(x, y, z);
      mesh.localToWorld(v);
      v.project(camera);
      const sx = (v.x *  0.5 + 0.5) * rect.width  + rect.left;
      const sy = (v.y * -0.5 + 0.5) * rect.height + rect.top;
      return [sx, sy] as [number, number];
    });

    // Apply perspective-correct CSS transform
    wrap.style.transform = homography(IFRAME_W, IFRAME_H, screen);
  });

  return null;
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

  const isUnity = project.frontmatter.shaderType === 'unity';

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
    if (e.distance > 2.0) return;
    setClicked(true);
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

      {/* Unity: iframe tracks the mesh in screen-space each frame, auto-plays, pointer-events:none so clicks navigate as normal */}
      {isUnity && project.frontmatter.shaderSrc && (
        <UnityOnMesh src={project.frontmatter.shaderSrc} meshRef={meshRef} />
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
