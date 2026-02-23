'use client';

import dynamic from 'next/dynamic';
import { Project } from '@/lib/projects';

const GalleryScene = dynamic(() => import('./GalleryScene'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="animate-pulse">Loading 3D Gallery...</div>
    </div>
  ),
});

interface GallerySceneWrapperProps {
  projects: Project[];
}

export default function GallerySceneWrapper({ projects }: GallerySceneWrapperProps) {
  return <GalleryScene projects={projects} />;
}
