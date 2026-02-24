'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/** Read / write the dark-mode preference and apply it to <html>. */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('portfolio-theme', next ? 'dark' : 'light');
  };

  return { isDark, toggle };
}

/**
 * Self-contained pill toggle fixed to the bottom-left corner.
 * Drop it anywhere in the tree — it manages its own position.
 */
export default function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-white dark:bg-zinc-700 px-3 py-2 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-600 transition-colors duration-300 hover:scale-105 active:scale-95"
    >
      {/* Sun icon */}
      <Sun size={14} className={`transition-colors duration-300 ${isDark ? 'text-zinc-400' : 'text-amber-500'}`} />

      {/* Sliding pill track */}
      <div className="relative w-8 h-4 rounded-full bg-zinc-200 dark:bg-zinc-900 transition-colors duration-300">
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-300 ${
            isDark ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </div>

      {/* Moon icon */}
      <Moon size={14} className={`transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-zinc-400'}`} />
    </button>
  );
}
