'use client';

import { Project } from '@/lib/projects';
import Painting from './Painting';

interface GalleryRoomProps {
  projects: Project[];
}

export default function GalleryRoom({ projects }: GalleryRoomProps) {
  // Simple layout: place paintings along a wall
  const wallLength = Math.max(10, projects.length * 4);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[wallLength, 10]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[wallLength, 5]} />
        <meshStandardMaterial color="#eee" roughness={0.9} />
      </mesh>

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
