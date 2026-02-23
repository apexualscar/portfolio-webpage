'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { Environment, Loader } from '@react-three/drei';
import { Settings, MousePointer2, Keyboard } from 'lucide-react';
import GalleryRoom from '@/components/gallery/GalleryRoom';
import PlayerController from '@/components/gallery/PlayerController';
import { Project } from '@/lib/projects';

interface GallerySceneProps {
  projects: Project[];
}

export const spawnPosition: [number, number, number] = [0, 1.6, 0];
export const spawnRotation: [number, number, number] = [0, 0, 0];
  
export default function GalleryScene({ projects }: GallerySceneProps) {
  const [mode, setMode] = useState<'wasd' | 'click'>('wasd');
  const [quality, setQuality] = useState<'high' | 'low'>('low');
  const [hasSelectedMode, setHasSelectedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('portfolio-control-mode');
    if (savedMode === 'wasd' || savedMode === 'click') {
      setMode(savedMode);
      setHasSelectedMode(true);
    }
    const savedQuality = localStorage.getItem('portfolio-quality');
    if (savedQuality === 'high' || savedQuality === 'low') {
      setQuality(savedQuality);
    }
  }, []);

  const handleSelectMode = (newMode: 'wasd' | 'click') => {
    setMode(newMode);
    setHasSelectedMode(true);
    setShowSettings(false);
    localStorage.setItem('portfolio-control-mode', newMode);
  };

  const handleSelectQuality = (newQuality: 'high' | 'low') => {
    setQuality(newQuality);
    localStorage.setItem('portfolio-quality', newQuality);
  };

  return (
    <>
      <Canvas shadows camera={{ position: spawnPosition, rotation: spawnRotation, fov: 60 }} onClick={() => setShowSettings(false)}>
        <color attach="background" args={['#111']} />
        <fog attach="fog" args={['#111', 5, 30]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={1}
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <GalleryRoom projects={projects} quality={quality} />
        </Suspense>

        <PlayerController mode={mode} hasSelectedMode={hasSelectedMode} showSettings={showSettings} />
      </Canvas>
      <Loader />

      {/* UI Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {!hasSelectedMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 max-w-md w-full text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Navigation</h2>
              <p className="text-zinc-400 mb-8">How would you like to explore the gallery?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectMode('wasd'); }}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 transition-all text-white"
                >
                  <Keyboard size={32} />
                  <span className="font-medium">WASD + Mouse</span>
                  <span className="text-xs text-zinc-400">Like a first-person game</span>
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectMode('click'); }}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 transition-all text-white"
                >
                  <MousePointer2 size={32} />
                  <span className="font-medium">Click to Move</span>
                  <span className="text-xs text-zinc-400">Point and click to walk</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {hasSelectedMode && (
          <div className="absolute top-6 left-6 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-white hover:bg-zinc-800 backdrop-blur-md transition-all shadow-lg"
            >
              <Settings size={20} />
            </button>

            {showSettings && (
              <div className="absolute top-14 left-0 bg-zinc-900/90 backdrop-blur-md p-4 rounded-xl border border-zinc-800 shadow-xl w-48 mt-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Controls</h3>
                <div className="flex flex-col gap-2">
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'wasd' ? 'bg-white text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    onClick={(e) => { e.stopPropagation(); handleSelectMode('wasd'); }}
                  >
                    <Keyboard size={16} />
                    WASD
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'click' ? 'bg-white text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    onClick={(e) => { e.stopPropagation(); handleSelectMode('click'); }}
                  >
                    <MousePointer2 size={16} />
                    Click to Move
                  </button>
                </div>

                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 mt-4">Quality</h3>
                <div className="flex flex-col gap-2">
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${quality === 'high' ? 'bg-white text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    onClick={(e) => { e.stopPropagation(); handleSelectQuality('high'); }}
                  >
                    High Res
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${quality === 'low' ? 'bg-white text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    onClick={(e) => { e.stopPropagation(); handleSelectQuality('low'); }}
                  >
                    Low Res
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
