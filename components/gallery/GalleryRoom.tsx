'use client';

import { Project } from '@/lib/projects';
import Painting from '@/components/gallery/Painting';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import EditableTransform from '@/components/gallery/EditableTransform';
import {spawnPosition, spawnRotation} from './GalleryScene';

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

  // Global Edit Mode Toggle
  const { editMode } = useControls({
    editMode: false,
  });

  // Simple layout: place paintings along a wall
  const wallLength = Math.max(10, projects.length * 4);

  return (
    <group>
      {editMode && <OrbitControls makeDefault />}
      <primitive object={scene} />

      {/* Spawn Point Editor */}
      {editMode && (
        <EditableTransform 
          name="Spawn Point" 
          initialPosition={spawnPosition as [number, number, number]} 
          initialRotation={spawnRotation as [number, number, number]} 
          editMode={editMode}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshBasicMaterial color="red" wireframe />
          </mesh>
        </EditableTransform>
      )}

      {/* Paintings */}
      {projects.map((project, index) => {
        const xPos = (index - (projects.length - 1) / 2) * 4;
        const pos = project.frontmatter.position || [xPos, 1.5, -4.9];
        const rot = project.frontmatter.rotation || [0, 0, 0];
        
        return (
          <EditableTransform
            key={project.frontmatter.slug}
            name={`Painting: ${project.frontmatter.title}`}
            initialPosition={pos as [number, number, number]}
            initialRotation={rot as [number, number, number]}
            editMode={editMode}
          >
            <Painting
              project={project}
              position={[0, 0, 0]}
            />
          </EditableTransform>
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
