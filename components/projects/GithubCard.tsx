'use client';

import { useEffect, useState } from 'react';
import { Github, Star, GitFork } from 'lucide-react';

interface GithubCardProps {
  url: string;
}

export default function GithubCard({ url }: GithubCardProps) {
  const [repoData, setRepoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const owner = match[1];
          const repo = match[2];
          const res = await fetch(`/api/github?repo=${owner}/${repo}`);
          if (res.ok) {
            const data = await res.json();
            setRepoData(data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch repo data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, [url]);

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />;
  }

  if (!repoData) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-zinc-200 p-4 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <Github size={20} />
        <span>View on GitHub</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Github size={24} className="text-zinc-900 dark:text-white" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">{repoData.full_name}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Star size={16} />
            {repoData.stargazers_count}
          </span>
          <span className="flex items-center gap-1">
            <GitFork size={16} />
            {repoData.forks_count}
          </span>
        </div>
      </div>
      {repoData.description && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{repoData.description}</p>
      )}
      {repoData.language && (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {repoData.language}
        </div>
      )}
    </a>
  );
}
