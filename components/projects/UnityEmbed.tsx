'use client';

import { useState, useRef } from 'react';

interface UnityEmbedProps {
  src: string;
}

export default function UnityEmbed({ src }: UnityEmbedProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Request native fullscreen on the container div — more reliable than on the iframe
  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    } else if ((el as any).mozRequestFullScreen) {
      (el as any).mozRequestFullScreen();
    }
  };

  return (
    // Break out of the parent max-w-3xl by using a negative-margin bleed so
    // the embed fills the full readable column at a true 16:9 ratio.
    // On larger screens it expands to max-w-5xl so the canvas has room to breathe.
    <div className="relative -mx-6 sm:-mx-12 md:-mx-24 lg:-mx-40">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-none sm:rounded-2xl bg-zinc-900"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400 text-sm z-10">
            <span className="animate-pulse">Loading Unity WebGL…</span>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 text-sm gap-2 z-10">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium text-zinc-300">Unity build not found</p>
            <p className="text-xs text-zinc-500">
              Place your Unity WebGL export at <code className="text-zinc-400">{src}</code>
            </p>
          </div>
        )}

        {/* The iframe sits behind the overlay buttons, pointer-events on the
            button strip are never captured by the iframe */}
        <iframe
          ref={iframeRef}
          src={`${src}/index.html`}
          className="absolute inset-0 w-full h-full border-0"
          style={{ display: status === 'error' ? 'none' : 'block', background: '#000' }}
          onLoad={() => {
            setStatus('ready');
            // Inject a stylesheet into the Unity iframe so its canvas always
            // fills the iframe, overriding Unity's inline JS sizing.
            const doc = iframeRef.current?.contentDocument;
            if (doc && doc.head) {
              const style = doc.createElement('style');
              style.textContent = `
                canvas { width: 100% !important; height: 100% !important; }
                #unity-container { width: 100% !important; height: 100% !important; }
                body { margin: 0; overflow: hidden; background: #000; }
              `;
              doc.head.appendChild(style);
            }
          }}
          onError={() => setStatus('error')}
          allow="fullscreen; autoplay; vr"
          scrolling="no"
          allowFullScreen
          title="Unity WebGL"
        />

        {/* Top-right toolbar — always rendered once ready so it's never hidden
            behind the iframe. A 40px tall transparent strip at the top gives
            the user a mouse target that doesn't pass through to the iframe. */}
        {status === 'ready' && (
          <div
            className="absolute top-0 right-0 z-20 flex items-center gap-2 px-3 py-2"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow transition"
              style={{ backdropFilter: 'blur(4px)' }}
              title="Native fullscreen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
              Fullscreen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
