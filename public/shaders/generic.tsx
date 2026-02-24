// GenericShader.tsx
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { galleryState } from "@/lib/galleryState";

const vertexShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  void main() {
    vec2 fragCoord = vUv * uResolution;
    vec2 uv = (fragCoord * 2.0 - uResolution.xy) / uResolution.y;
    float t = uTime * 0.2;
    vec3 col = vec3(0.5 + 0.5 * sin(uv.x + t),
                    0.5 + 0.5 * sin(uv.y + t),
                    0.5 + 0.5 * sin(t));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const GenericShaderMaterial = () => {
  const timeRef = useRef(0);

  // Stable ref — never recreated so R3F reconciler never resets uTime to 0.
  const uniforms = useRef({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  });

  useFrame((state, delta) => {
    // Pause time accumulation while the user is zoomed into / viewing the painting.
    if (galleryState.isZooming) return;
    timeRef.current += delta;
    uniforms.current.uTime.value = timeRef.current;
    uniforms.current.uResolution.value.set(state.size.width, state.size.height);
  });

  return (
    <shaderMaterial
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms.current}
    />
  );
}

export default GenericShaderMaterial;
