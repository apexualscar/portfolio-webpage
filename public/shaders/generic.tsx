// GenericShader.tsx
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { galleryState } from "@/lib/galleryState";
import type { ShaderMaterialProps } from "@/materials/registry";

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
  uniform float uSpeed;
  uniform vec2 uResolution;
  uniform vec3 uTint;
  varying vec2 vUv;
  void main() {
    vec2 fragCoord = vUv * uResolution;
    vec2 uv = (fragCoord * 2.0 - uResolution.xy) / uResolution.y;
    float t = uTime * uSpeed;
    vec3 col = vec3(0.5 + 0.5 * sin(uv.x + t),
                    0.5 + 0.5 * sin(uv.y + t),
                    0.5 + 0.5 * sin(t));
    gl_FragColor = vec4(col * uTint, 1.0);
  }
`;

const GenericShaderMaterial = ({ uniformOverrides }: ShaderMaterialProps) => {
  const timeRef = useRef(0);

  const uniforms = useRef({
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uSpeed:      { value: 1.0 },
    uTint:       { value: new THREE.Vector3(1, 1, 1) },
  });

  useFrame((state, delta) => {
    if (galleryState.isZooming) return;
    timeRef.current += delta;
    uniforms.current.uTime.value = timeRef.current;
    uniforms.current.uResolution.value.set(state.size.width, state.size.height);

    if (uniformOverrides) {
      if (uniformOverrides.uSpeed !== undefined)
        uniforms.current.uSpeed.value = uniformOverrides.uSpeed;
      if (uniformOverrides.uTint !== undefined) {
        const c = new THREE.Color(uniformOverrides.uTint);
        uniforms.current.uTint.value.set(c.r, c.g, c.b);
      }
    }
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
