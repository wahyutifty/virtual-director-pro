import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Play, Pause, SkipForward } from 'lucide-react';
import { Shot } from '../types';

interface AnimaticPlayerProps {
  shots: Shot[];
  audioUrl: string | null;
  onClose: () => void;
}

export const AnimaticPlayer: React.FC<AnimaticPlayerProps> = ({ shots, audioUrl, onClose }) => {
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const validShots = shots.filter(s => s.imageUrl); 
  
  // CALCULATE DURATION WEIGHTS BASED ON SCRIPT LENGTH
  const shotTimings = useMemo(() => {
      if (!validShots.length) return [];
      
      // 1. Calculate weights
      const weights = validShots.map(s => {
          const scriptLen = (s.voiceover_script || "").length;
          // Min weight of 20 chars for visual-only shots to prevent instant skip
          return scriptLen < 5 ? 20 : scriptLen; 
      });
      
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      
      // 2. Convert to percentages
      let currentPct = 0;
      return weights.map(w => {
          const start = currentPct;
          const portion = w / totalWeight;
          currentPct += portion;
          return { startPct: start, endPct: currentPct };
      });
  }, [validShots]);

  const DEFAULT_SLIDE_DURATION = 3000; 

  useEffect(() => {
      if (!validShots.length) return;

      const handleTick = () => {
          if (!isPlaying) return;

          if (audioUrl && audioRef.current) {
              // --- SMART AUDIO SYNC ---
              const duration = audioRef.current.duration;
              const currentTime = audioRef.current.currentTime;
              
              if (duration && duration > 0) {
                  const progressPct = currentTime / duration; // 0.0 to 1.0
                  setProgress(progressPct * 100);

                  // Find which shot corresponds to current progress percentage
                  // using our pre-calculated text-based timings
                  const newIndex = shotTimings.findIndex(t => progressPct >= t.startPct && progressPct < t.endPct);
                  
                  if (newIndex !== -1 && newIndex !== currentShotIndex) {
                      setCurrentShotIndex(newIndex);
                  } else if (currentTime >= duration) {
                      setIsPlaying(false);
                  }
              }
          } else {
              // --- SILENT MODE TIMER ---
              const totalDuration = validShots.length * DEFAULT_SLIDE_DURATION;
              setProgress(prev => {
                  const newProgress = prev + (100 / (totalDuration / 100));
                  if (newProgress >= 100) {
                      setIsPlaying(false);
                      return 100;
                  }
                  return newProgress;
              });

              // In silent mode, we just do equal distribution or could use weights too
              // For simplicity, let's keep equal distribution for silent preview
              const slideDurationPercent = 100 / validShots.length;
              const estimatedIndex = Math.floor((progress + 1) / slideDurationPercent);
              const safeIndex = Math.min(estimatedIndex, validShots.length - 1);
              if (safeIndex !== currentShotIndex) setCurrentShotIndex(safeIndex);
          }
      };

      const interval = setInterval(handleTick, 100); // Check every 100ms
      progressInterval.current = interval;

      return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying, audioUrl, validShots.length, progress, shotTimings, currentShotIndex]);

  const handlePlayPause = () => {
      if (audioUrl && audioRef.current) {
          if (isPlaying) audioRef.current.pause();
          else audioRef.current.play();
      } else {
          if (!isPlaying && progress >= 100) {
              setProgress(0);
              setCurrentShotIndex(0);
          }
      }
      setIsPlaying(!isPlaying);
  };

  useEffect(() => {
      if (audioUrl && audioRef.current) {
          audioRef.current.play().catch(e => console.log("Audio autoplay failed", e));
      }
  }, [audioUrl]);

  if (!validShots.length) return null;

  return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
           {/* Animation Keyframes */}
           <style>{`
              @keyframes kb-in { from { transform: scale(1); } to { transform: scale(1.15); } }
              @keyframes kb-out { from { transform: scale(1.15); } to { transform: scale(1); } }
              .anim-kb-in { animation: kb-in 20s ease-out forwards; }
              .anim-kb-out { animation: kb-out 20s ease-out forwards; }
           `}</style>

           {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}

           <div className="relative w-full max-w-sm aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
               {/* Ken Burns Animated Image */}
               <img 
                  key={currentShotIndex} // Force remount to restart animation
                  src={validShots[currentShotIndex]?.imageUrl!} 
                  className={`w-full h-full object-cover ${currentShotIndex % 2 === 0 ? 'anim-kb-in' : 'anim-kb-out'}`}
                  alt={`Scene ${currentShotIndex + 1}`}
               />
               
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-[10px] font-bold">
                  SCENE {currentShotIndex + 1} / {validShots.length}
               </div>
               
               <div className="absolute bottom-20 left-4 right-4 text-center">
                  <p className="text-white/95 text-xs font-medium drop-shadow-lg bg-black/40 p-3 rounded-xl backdrop-blur-md leading-relaxed border border-white/10">
                      {validShots[currentShotIndex]?.voiceover_script || validShots[currentShotIndex]?.visual_prompt}
                  </p>
               </div>

               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                   <div className="flex items-center justify-center gap-6 mb-4">
                      <button onClick={() => {
                           if(audioUrl && audioRef.current) { audioRef.current.currentTime = 0; }
                           setProgress(0); setCurrentShotIndex(0); setIsPlaying(true);
                           if(audioUrl) audioRef.current.play();
                      }} className="text-white/70 hover:text-white"><SkipForward className="rotate-180" size={20}/></button>
                      
                      <button onClick={handlePlayPause} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                          {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1"/>}
                      </button>
                      
                      <button onClick={onClose} className="text-white/70 hover:text-red-400"><X size={24}/></button>
                   </div>
                   
                   <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
                   </div>
               </div>
           </div>
           
           <p className="text-white/50 text-xs mt-4 font-medium uppercase tracking-widest">Ken Burns Smart Preview</p>
      </div>
  );
};