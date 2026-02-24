'use client';

import { useState } from 'react';

interface UnityEmbedProps {
  src: string;
}

export default function UnityEmbed({ src }: UnityEmbedProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400 text-sm gap-2">
          <span className="animate-pulse">Loading Unity WebGL…</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 text-sm gap-2">
          <span className="text-2xl">⚠️</span>
          <p className="font-medium text-zinc-300">Unity build not found</p>
          <p className="text-xs text-zinc-500">
            Place your Unity WebGL export at <code className="text-zinc-400">{src}</code>
          </p>
        </div>
      )}
      <iframe
        src={`${src}/index.html`}
        className="h-full w-full border-0"
        style={{ display: status === 'error' ? 'none' : 'block' }}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
        allow="fullscreen; autoplay; vr"
      />
    </div>
  );
}
