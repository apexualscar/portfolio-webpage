import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/lib/projects';
import { Github, Video, Code } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { title, slug, description, tags, thumbnail, githubUrl, videoUrl, shaderType } = project.frontmatter;

  return (
    <Link href={`/projects/${slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-md dark:bg-zinc-700 dark:ring-zinc-600 hover:dark:ring-zinc-500">
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-600">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-200">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-6 flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
          {githubUrl && <Github size={18} />}
          {videoUrl && <Video size={18} />}
          {shaderType !== 'none' && <Code size={18} />}
        </div>
      </div>
    </Link>
  );
}
