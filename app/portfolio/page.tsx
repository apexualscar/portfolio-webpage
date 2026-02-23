import { getSortedProjectsData } from '@/lib/projects';
import ProjectCard from '@/components/projects/ProjectCard';
import ViewToggle from '@/components/shared/ViewToggle';

export default function PortfolioPage() {
  const projects = getSortedProjectsData();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            My Portfolio
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            A collection of my recent work, including 3D experiences, shaders, and web applications.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.frontmatter.slug} project={project} />
          ))}
        </div>
      </div>
      <ViewToggle />
    </main>
  );
}
