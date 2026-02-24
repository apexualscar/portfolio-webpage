// GenericShader.tsx
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

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
uniform vec3 uResolution;

varying vec2 vUv;

vec3 palette(float t) {
    vec3 a = vec3(0.924, 0.239, 0.308);
    vec3 b = vec3(0.999, 0.908, 0.483);
    vec3 c = vec3(1.118, 1.428, 0.293);
    vec3 d = vec3(0.862, 2.085, 4.029);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    float t = mod(uTime, 6.28318);

    vec2 uv = (vUv * 2.0 - 1.0);
    vec2 uv0 = uv;

    vec3 finalColour = vec3(0.0);

    float frequency = 10.0;
    float amplitude = 2.0;
    float divisions = 4.0;
    float offset = 2.0;
    float intensity = 0.01;
    float colorVariance = 0.5;

    for (float i = 0.0; i < divisions; i++) {

        // NEW: derive uv_i fresh each iteration
        vec2 uv_i = fract(uv0 * (offset + i)) - 0.5;

        float d = length(uv_i) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + i * colorVariance + t);

        d = sin(d * frequency + t) / frequency;
        d = abs(d);

        d = pow(intensity / d, amplitude);

        finalColour += col * d;
    }

    gl_FragColor = vec4(finalColour, 1.0);
  }
`;

const FractalShaderMaterial = () => {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!mat.current) return;
    timeRef.current += delta;
    mat.current.uniforms.uTime.value = timeRef.current;
    mat.current.uniforms.uResolution.value.set(
      state.size.width,
      state.size.height
    );
  });

  return (
    <shaderMaterial
      ref={mat}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={{
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      }}
    />
  );
}

export default FractalShaderMaterial;
