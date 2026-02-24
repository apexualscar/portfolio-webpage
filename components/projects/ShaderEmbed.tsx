'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { materialRegistry } from '@/materials/registry';
import UnityEmbed from './UnityEmbed';
import type { ShaderUniformDef } from '@/lib/projects';

interface ShaderEmbedProps {
  type: 'unity' | 'glsl' | 'shadertoy' | 'none';
  src: string;
  material?: string;
  shaderUniforms?: ShaderUniformDef[];
}

// Defined at module scope so it never remounts the Canvas on parent re-render
function ShaderCanvas({ materialKey, overrides }: { materialKey: string; overrides: Record<string, any> }) {
  const MatComp = materialRegistry[materialKey];
  if (!MatComp) {
    return (
      <mesh>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial color="#333" />
      </mesh>
    );
  }
  return (
    <mesh>
      <planeGeometry args={[4, 3]} />
      <MatComp uniformOverrides={overrides} />
    </mesh>
  );
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ShaderEmbed({ type, src, material, shaderUniforms }: ShaderEmbedProps) {
  const [overrides, setOverrides] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    shaderUniforms?.forEach((u) => {
      init[u.name] = u.default;
    });
    return init;
  });

  if (type === 'unity') {
    return <UnityEmbed src={src} />;
  }

  if (type === 'shadertoy') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://www.shadertoy.com/embed/${src}?gui=true&t=10&paused=false&muted=false`}
          allowFullScreen
        />
      </div>
    );
  }

  if (type === 'glsl') {
    const hasControls = shaderUniforms && shaderUniforms.length > 0;

    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-600">
        {/* Canvas */}
        <div className="aspect-video w-full bg-black">
          <Canvas
            frameloop="always"
            camera={{ position: [0, 0, 1.5], fov: 60 }}
            style={{ width: '100%', height: '100%' }}
          >
            <color attach="background" args={['#000000']} />
            {material && <ShaderCanvas materialKey={material} overrides={overrides} />}
          </Canvas>
        </div>

        {/* Uniform controls */}
        {hasControls && (
          <div className="border-t border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Shader Controls
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {shaderUniforms!.map((u) => {
                if (u.type === 'float') {
                  const val = (overrides[u.name] as number) ?? (u.default as number);
                  return (
                    <div key={u.name} className="flex flex-col gap-1 min-w-[180px]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          {u.label}
                        </label>
                        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                          {val.toFixed(u.step && u.step < 0.1 ? 3 : u.step && u.step < 1 ? 2 : 1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={u.min ?? 0}
                        max={u.max ?? 1}
                        step={u.step ?? 0.01}
                        value={val}
                        onChange={(e) =>
                          setOverrides((prev) => ({ ...prev, [u.name]: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1.5 accent-zinc-600 dark:accent-zinc-300 cursor-pointer"
                      />
                    </div>
                  );
                }

                if (u.type === 'color') {
                  const raw = overrides[u.name];
                  // raw may be a hex string or a THREE.Vector3-like {r,g,b}
                  const hexVal =
                    typeof raw === 'string'
                      ? raw
                      : raw && typeof raw === 'object'
                      ? rgbToHex(raw.r, raw.g, raw.b)
                      : (u.default as string);
                  return (
                    <div key={u.name} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {u.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={hexVal}
                          onChange={(e) => {
                            const { r, g, b } = hexToRgb(e.target.value);
                            setOverrides((prev) => ({ ...prev, [u.name]: { r, g, b } }));
                          }}
                          className="h-8 w-14 cursor-pointer rounded border border-zinc-300 dark:border-zinc-500 bg-transparent p-0.5"
                        />
                        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                          {hexVal}
                        </span>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
