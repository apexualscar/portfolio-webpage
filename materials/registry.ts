import React from 'react';
import GenericShaderMaterial from '@/public/shaders/generic';
import FractalShaderMaterial from '@/public/shaders/fractal';

export type ShaderMaterialProps = {
  emissiveIntensity?: any;
  uniformOverrides?: Record<string, any>;
};

export const materialRegistry: Record<string, React.ComponentType<ShaderMaterialProps>> = {
  genericShader: GenericShaderMaterial,
  fractalShader: FractalShaderMaterial,
};
