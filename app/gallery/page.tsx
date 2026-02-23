import { getSortedProjectsData } from '@/lib/projects';
import ViewToggle from '@/components/shared/ViewToggle';
import GallerySceneWrapper from '@/components/gallery/GallerySceneWrapper';

export default function GalleryPage() {
  const projects = getSortedProjectsData();

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <GallerySceneWrapper projects={projects} />
      <ViewToggle />
    </main>
  );
}
