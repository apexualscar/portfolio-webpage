import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const projectsDirectory = path.join(process.cwd(), 'content/projects');

export interface ProjectFrontmatter {
  title: string;
  slug: string;
  date: string;
  description: string;
  tags: string[];
  thumbnail: string;
  githubUrl?: string;
  videoUrl?: string;
  shaderType: 'unity' | 'glsl' | 'shadertoy' | 'none';
  shaderSrc?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: string;
}

export interface Project {
  frontmatter: ProjectFrontmatter;
  content: string;
}

export function getSortedProjectsData(): Project[] {
  // Get file names under /content/projects
  const fileNames = fs.readdirSync(projectsDirectory);
  const allProjectsData = fileNames.map((fileName) => {
    // Remove ".mdx" from file name to get id
    const id = fileName.replace(/\.mdx$/, '');

    // Read markdown file as string
    const fullPath = path.join(projectsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the id
    return {
      frontmatter: {
        ...matterResult.data,
        slug: id,
      } as ProjectFrontmatter,
      content: matterResult.content,
    };
  });

  // Sort projects by date
  return allProjectsData.sort((a, b) => {
    if (a.frontmatter.date < b.frontmatter.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getProjectData(slug: string): Project | undefined {
  try {
    const fullPath = path.join(projectsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    return {
      frontmatter: {
        ...matterResult.data,
        slug,
      } as ProjectFrontmatter,
      content: matterResult.content,
    };
  } catch (e) {
    return undefined;
  }
}
