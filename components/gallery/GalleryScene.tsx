'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Environment, Loader } from '@react-three/drei';
import { Leva } from 'leva';
import { Settings, MousePointer2, Keyboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GalleryRoom from '@/components/gallery/GalleryRoom';
import PlayerController from '@/components/gallery/PlayerController';
import InteractionManager from '@/components/gallery/InteractionManager';
import { Project } from '@/lib/projects';
import { galleryState } from '@/lib/galleryState';
import { motion, AnimatePresence } from 'framer-motion';

interface GallerySceneProps {
  projects: Project[];
}

export const spawnPosition: [number, number, number] = [0, 1.6, 0];
export const spawnRotation: [number, number, number] = [0, 0, 0];

export default function GalleryScene({ projects }: GallerySceneProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'wasd' | 'click'>('wasd');
  const [quality, setQuality] = useState<'high' | 'low'>('low');
  const [flowStep, setFlowStep] = useState<'welcome' | 'controls' | 'done'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('gallery-welcomed')) {
      return 'done';
    }
    return 'welcome';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [interactableProject, setInteractableProject] = useState<Project | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showLeva, setShowLeva] = useState(false);
  const cameraRef = useRef<any>(null);

  // Keep galleryState in sync so shader components can read it inside the Canvas.
  useEffect(() => {
    galleryState.isZooming = isZooming;
  }, [isZooming]);

  // Track pointer lock so we can show a "Click to resume" hint in WASD mode.
  useEffect(() => {
    const onLockChange = () => setIsPointerLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  // Backtick ( ` ) toggles the Leva dev panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') setShowLeva(prev => !prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    sessionStorage.removeItem('gallery-zooming');
    const savedMode = localStorage.getItem('portfolio-control-mode');
    if (savedMode === 'wasd' || savedMode === 'click') {
      setMode(savedMode);
    }
    const savedQuality = localStorage.getItem('portfolio-quality');
    if (savedQuality === 'high' || savedQuality === 'low') {
      setQuality(savedQuality);
    }
  }, []);

  useEffect(() => {
    if (flowStep !== 'done') return;
    let attempts = 0;
    function tryRestoreCamera() {
      if (!cameraRef.current) {
        if (attempts < 10) {
          attempts++;
          setTimeout(tryRestoreCamera, 100);
        }
        return;
      }
      const saved = localStorage.getItem('gallery-camera');
      if (saved) {
        try {
          const { position, rotation } = JSON.parse(saved);
          if (position && rotation) {
            cameraRef.current.position.set(...position);
            cameraRef.current.rotation.set(...rotation);
          }
        } catch {}
      }
    }
    tryRestoreCamera();
  }, [flowStep]);

  const handleSelectMode = (newMode: 'wasd' | 'click') => {
    setMode(newMode);
    setFlowStep('done');
    setShowSettings(false);
    localStorage.setItem('portfolio-control-mode', newMode);
    sessionStorage.setItem('gallery-welcomed', '1');
  };

  const handleSelectQuality = (newQuality: 'high' | 'low') => {
    setQuality(newQuality);
    localStorage.setItem('portfolio-quality', newQuality);
  };

  return (
    <>
      <Leva hidden={!showLeva} />
      <div className={`w-full h-full transition-all duration-1000 ${flowStep !== 'done' ? 'blur-md scale-105' : 'blur-0 scale-100'}`}>
        <Canvas
          shadows
          camera={{ position: spawnPosition, rotation: spawnRotation, fov: 60 }}
          onCreated={({ camera }) => { cameraRef.current = camera; }}
          onClick={() => setShowSettings(false)}
        >
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
            <InteractionManager 
              projects={projects} 
              setInteractableProject={setInteractableProject} 
              isZooming={isZooming} 
              setIsZooming={setIsZooming} 
              cameraRef={cameraRef}
              mode={mode}
            />
          </Suspense>

          <PlayerController mode={mode} hasSelectedMode={flowStep === 'done' && !isZooming} showSettings={showSettings} cameraRef={cameraRef} />
        </Canvas>
      </div>
      <Loader />

      {/* Crosshair and Interaction UI */}
      {flowStep === 'done' && !showSettings && !isZooming && (
        <div className="fixed inset-0 pointer-events-none z-30 flex flex-col items-center justify-center">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${interactableProject ? 'bg-white scale-150' : 'bg-white/50'}`} />
          {interactableProject && (
            <div className="absolute mt-12 text-white font-medium tracking-widest uppercase text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 drop-shadow-md">
              View
            </div>
          )}
        </div>
      )}

      {/* WASD click-to-resume hint — shown when pointer lock is not active */}
      {flowStep === 'done' && mode === 'wasd' && !isPointerLocked && !showSettings && !isZooming && (
        <div className="fixed inset-0 z-[25] flex items-center justify-center pointer-events-none">
          <div className="px-5 py-2.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-sm text-white/70 text-sm tracking-widest uppercase font-medium select-none">
            Click to resume
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence mode="wait">
          {flowStep !== 'done' && (
            <motion.div 
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto"
            >
              {flowStep === 'welcome' && (
                <motion.div 
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-black/80 backdrop-blur-xl p-12 rounded-3xl border border-white/10 max-w-lg w-full text-center shadow-2xl"
                >
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
                </motion.div>
              )}

              {flowStep === 'controls' && (
                <motion.div 
                  key="controls"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-black/80 backdrop-blur-xl p-12 rounded-3xl border border-white/10 max-w-lg w-full text-center shadow-2xl"
                >
                  <h2 className="text-3xl font-light tracking-wide text-white mb-2">Navigation</h2>
                  <p className="text-zinc-400 text-sm tracking-widest uppercase mb-10">Select your preference</p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectMode('wasd'); }}
                      className="group flex flex-col items-center justify-start gap-3 p-8 pt-7 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/50 hover:-translate-y-1 transition-all duration-300 text-white"
                    >
                      <Keyboard size={40} className="text-zinc-400 group-hover:text-white transition-colors duration-300 shrink-0" />
                      <span className="font-medium tracking-wider">WASD</span>
                      <p className="text-zinc-500 text-xs leading-relaxed text-center group-hover:text-zinc-400 transition-colors duration-300">
                        Move with W A S D.<br />Mouse to look around.<br />Click canvas to lock cursor.
                      </p>
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectMode('click'); }}
                      className="group flex flex-col items-center justify-start gap-3 p-8 pt-7 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/50 hover:-translate-y-1 transition-all duration-300 text-white"
                    >
                      <MousePointer2 size={40} className="text-zinc-400 group-hover:text-white transition-colors duration-300 shrink-0" />
                      <span className="font-medium tracking-wider">CLICK</span>
                      <p className="text-zinc-500 text-xs leading-relaxed text-center group-hover:text-zinc-400 transition-colors duration-300">
                        Click the floor to walk.<br />Move mouse to screen edge to pan.<br />No cursor lock needed.
                      </p>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
// End of file
