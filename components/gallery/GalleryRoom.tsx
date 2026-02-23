'use client';

import { Project } from '@/lib/projects';
import Painting from '@/components/gallery/Painting';
import { useGLTF } from '@react-three/drei';

interface GalleryRoomProps {
  projects: Project[];
  quality: 'high' | 'low';
}

export default function GalleryRoom({ projects, quality }: GalleryRoomProps) {
  // Load the appropriate model based on quality setting
  // Note: Ensure you have placed your downloaded models at these paths in the public folder
  const modelPath = quality === 'high' ? '/models/gallery-high.glb' : '/models/gallery-low.glb';
  
  // useGLTF will suspend while loading. If the file is missing, it will throw an error.
  const { scene } = useGLTF(modelPath);

  // Simple layout: place paintings along a wall
  const wallLength = Math.max(10, projects.length * 4);

  return (
    <group>
      <primitive object={scene} />

      {/* Paintings */}
      {projects.map((project, index) => {
        const xPos = (index - (projects.length - 1) / 2) * 4;
        return (
          <Painting
            key={project.frontmatter.slug}
            project={project}
            position={[xPos, 1.5, -4.9]}
          />
        );
      })}
    </group>
  );
}

// Preload models to avoid stuttering when switching (if they exist)
try {
  useGLTF.preload('/models/gallery-high.glb');
  useGLTF.preload('/models/gallery-low.glb');
} catch (e) {
  // Ignore preload errors if files don't exist yet
}
