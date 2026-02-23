'use client';

import { useState } from 'react';

interface UnityEmbedProps {
  src: string;
}

export default function UnityEmbed({ src }: UnityEmbedProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white">
          <div className="animate-pulse">Loading Unity WebGL...</div>
        </div>
      )}
      <iframe
        src={`${src}/index.html`}
        className="h-full w-full border-0"
        onLoad={() => setLoading(false)}
        allow="fullscreen; autoplay; vr"
      />
    </div>
  );
}
