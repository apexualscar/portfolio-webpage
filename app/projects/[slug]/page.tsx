import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectData, getSortedProjectsData } from '@/lib/projects';
import ProjectDetail from '@/components/projects/ProjectDetail';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectData(slug);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.frontmatter.title} | My Portfolio`,
    description: project.frontmatter.description,
    openGraph: {
      title: project.frontmatter.title,
      description: project.frontmatter.description,
      images: [
        {
          url: project.frontmatter.thumbnail,
          width: 1200,
          height: 630,
          alt: project.frontmatter.title,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  const projects = getSortedProjectsData();
  return projects.map((project) => ({
    slug: project.frontmatter.slug,
  }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectData(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
