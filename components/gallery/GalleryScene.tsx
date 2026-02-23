'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { Environment, Loader } from '@react-three/drei';
import { Settings, MousePointer2, Keyboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GalleryRoom from '@/components/gallery/GalleryRoom';
import PlayerController from '@/components/gallery/PlayerController';
import { Project } from '@/lib/projects';

interface GallerySceneProps {
  projects: Project[];
}

export const spawnPosition: [number, number, number] = [0, 1.6, 0];
export const spawnRotation: [number, number, number] = [0, 0, 0];
  
export default function GalleryScene({ projects }: GallerySceneProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'wasd' | 'click'>('wasd');
  const [quality, setQuality] = useState<'high' | 'low'>('low');
  const [flowStep, setFlowStep] = useState<'welcome' | 'controls' | 'done'>('welcome');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('portfolio-control-mode');
    if (savedMode === 'wasd' || savedMode === 'click') {
      setMode(savedMode);
      // We don't set flowStep to 'done' here anymore so the welcome screen always shows
    }
    const savedQuality = localStorage.getItem('portfolio-quality');
    if (savedQuality === 'high' || savedQuality === 'low') {
      setQuality(savedQuality);
    }
  }, []);

  const handleSelectMode = (newMode: 'wasd' | 'click') => {
    setMode(newMode);
    setFlowStep('done');
    setShowSettings(false);
    localStorage.setItem('portfolio-control-mode', newMode);
  };

  const handleSelectQuality = (newQuality: 'high' | 'low') => {
    setQuality(newQuality);
    localStorage.setItem('portfolio-quality', newQuality);
  };

  return (
    <>
      <div className={`w-full h-full transition-all duration-1000 ${flowStep !== 'done' ? 'blur-md scale-105' : 'blur-0 scale-100'}`}>
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

          <PlayerController mode={mode} hasSelectedMode={flowStep === 'done'} showSettings={showSettings} />
        </Canvas>
      </div>
      <Loader />

      {/* UI Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {flowStep !== 'done' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto transition-all duration-500">
            {flowStep === 'welcome' && (
              <div className="bg-black/80 backdrop-blur-xl p-12 rounded-3xl border border-white/10 max-w-lg w-full text-center shadow-2xl animate-in fade-in zoom-in duration-500">
                <h1 className="text-4xl font-light tracking-wide text-white mb-2">Welcome</h1>
                <p className="text-zinc-400 text-sm tracking-widest uppercase mb-12">To the gallery of User</p>
                
                <div className="flex flex-col gap-4 justify-center items-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFlowStep('controls'); }}
                    className="px-12 py-4 rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all duration-300 font-medium text-lg w-full max-w-[280px] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                  >
                    Enter Experience
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push('/portfolio'); }}
                    className="px-8 py-3 rounded-full bg-transparent border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-zinc-300 font-medium text-sm w-full max-w-[200px]"
                  >
                    Simplified
                  </button>
                </div>
              </div>
            )}

            {flowStep === 'controls' && (
              <div className="bg-black/80 backdrop-blur-xl p-12 rounded-3xl border border-white/10 max-w-lg w-full text-center shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                <h2 className="text-3xl font-light tracking-wide text-white mb-2">Navigation</h2>
                <p className="text-zinc-400 text-sm tracking-widest uppercase mb-10">Select your preference</p>
                
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelectMode('wasd'); }}
                    className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/50 hover:-translate-y-1 transition-all duration-300 text-white aspect-square"
                  >
                    <Keyboard size={40} className="text-zinc-400 group-hover:text-white transition-colors duration-300" />
                    <span className="font-medium tracking-wider">WASD</span>
                  </button>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelectMode('click'); }}
                    className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/50 hover:-translate-y-1 transition-all duration-300 text-white aspect-square"
                  >
                    <MousePointer2 size={40} className="text-zinc-400 group-hover:text-white transition-colors duration-300" />
                    <span className="font-medium tracking-wider">CLICK</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {flowStep === 'done' && (
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
