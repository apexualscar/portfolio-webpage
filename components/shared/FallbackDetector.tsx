'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FallbackDetector() {
  const router = useRouter();

  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    const isMobile = window.innerWidth < 768;
    const hasWebGL = checkWebGL();
    
    const savedPreference = localStorage.getItem('portfolio-view-preference');

    if (savedPreference === '3d') {
      router.replace('/gallery');
    } else if (savedPreference === 'classic') {
      router.replace('/portfolio');
    } else if (hasWebGL && !isMobile) {
      router.replace('/gallery');
    } else {
      router.replace('/portfolio');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="animate-pulse text-zinc-500">Loading experience...</div>
    </div>
  );
}
