'use client';

import UnityEmbed from './UnityEmbed';

interface ShaderEmbedProps {
  type: 'unity' | 'glsl' | 'shadertoy' | 'none';
  src: string;
}

export default function ShaderEmbed({ type, src }: ShaderEmbedProps) {
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
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500">
        <p>GLSL Canvas Placeholder for {src}</p>
      </div>
    );
  }

  return null;
}
