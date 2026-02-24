'use client';

import { useState, useRef } from 'react';

interface UnityEmbedProps {
  src: string;
}

export default function UnityEmbed({ src }: UnityEmbedProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fullscreen API
  const handleFullscreen = () => {
    const el = iframeRef.current;
    if (el && el.requestFullscreen) {
      el.requestFullscreen();
    } else {
      setFullscreen(true); // fallback for browsers without iframe fullscreen
    }
  };

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 ${fullscreen ? 'fixed inset-0 z-50 w-screen h-screen aspect-auto rounded-none' : 'max-w-4xl mx-auto'}`} style={fullscreen ? { background: '#000' } : {}}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400 text-sm gap-2 z-10">
          <span className="animate-pulse">Loading Unity WebGL…</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 text-sm gap-2 z-10">
          <span className="text-2xl">⚠️</span>
          <p className="font-medium text-zinc-300">Unity build not found</p>
          <p className="text-xs text-zinc-500">
            Place your Unity WebGL export at <code className="text-zinc-400">{src}</code>
          </p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`${src}/index.html`}
        className="absolute inset-0 w-full h-full border-0"
        style={{ display: status === 'error' ? 'none' : 'block', background: '#000', objectFit: 'cover' }}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
        allow="fullscreen; autoplay; vr"
        scrolling="no"
        allowFullScreen
        title="Unity WebGL"
      />
      {/* Fullscreen button */}
      {!fullscreen && status === 'ready' && (
        <button
          onClick={handleFullscreen}
          className="absolute bottom-4 right-4 z-20 bg-black/60 text-white rounded-full px-3 py-2 text-xs font-semibold shadow hover:bg-black/80 transition"
          style={{ backdropFilter: 'blur(2px)' }}
        >
          ⛶ Fullscreen
        </button>
      )}
      {/* Fallback close button for pseudo-fullscreen */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 z-20 bg-black/70 text-white rounded-full px-3 py-2 text-xs font-semibold shadow hover:bg-black/90 transition"
        >
          ✕ Exit Fullscreen
        </button>
      )}
    </div>
  );
}
