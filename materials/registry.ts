import GenericShaderMaterial from '@/public/shaders/generic';
import FractalShaderMaterial from '@/public/shaders/fractal';
// Example: import CustomShaderMaterial from '@/components/materials/CustomShader.tsx';

export const materialRegistry: Record<string, React.ComponentType<{ emissiveIntensity: any }>> = {
  genericShader: GenericShaderMaterial,
  fractalShader: FractalShaderMaterial,
  // customShader: CustomShaderMaterial,
  // Add more mappings as needed
};
