'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Monitor, Cuboid } from 'lucide-react';

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  
  const is3D = pathname.startsWith('/gallery');

  const toggleView = () => {
    if (is3D) {
      localStorage.setItem('portfolio-view-preference', 'classic');
      router.push('/portfolio');
    } else {
      localStorage.setItem('portfolio-view-preference', '3d');
      router.push('/gallery');
    }
  };

  return (
    <button
      onClick={toggleView}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 dark:bg-white dark:text-black"
    >
      {is3D ? (
        <>
          <Monitor size={16} />
          <span>Classic View</span>
        </>
      ) : (
        <>
          <Cuboid size={16} />
          <span>3D Gallery</span>
        </>
      )}
    </button>
  );
}
