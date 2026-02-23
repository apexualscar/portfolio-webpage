'use client';

import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Project } from '@/lib/projects';
import GithubCard from '@/components/projects/GithubCard';
import VideoEmbed from '@/components/projects/VideoEmbed';
import ShaderEmbed from '@/components/projects/ShaderEmbed';

interface ProjectDetailProps {
  project: Project;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const [mdxSource, setMdxSource] = useState<any>(null);

  useEffect(() => {
    const parseMdx = async () => {
      const mdx = await serialize(project.content);
      setMdxSource(mdx);
    };
    parseMdx();
  }, [project.content]);

  const handleBack = () => {
    const savedPreference = localStorage.getItem('portfolio-view-preference');
    if (savedPreference === '3d') {
      router.push('/gallery');
    } else {
      router.push('/portfolio');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={handleBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Gallery
        </button>

        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            {project.frontmatter.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.frontmatter.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            {new Date(project.frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {project.frontmatter.githubUrl && (
          <div className="mb-12">
            <GithubCard url={project.frontmatter.githubUrl} />
          </div>
        )}

        {project.frontmatter.videoUrl && (
          <div className="mb-12">
            <VideoEmbed url={project.frontmatter.videoUrl} />
          </div>
        )}

        {project.frontmatter.shaderType !== 'none' && project.frontmatter.shaderSrc && (
          <div className="mb-12">
            <ShaderEmbed type={project.frontmatter.shaderType} src={project.frontmatter.shaderSrc} />
          </div>
        )}

        <article className="prose prose-zinc dark:prose-invert max-w-none">
          {mdxSource && <MDXRemote {...mdxSource} />}
        </article>
      </div>
    </main>
  );
}
