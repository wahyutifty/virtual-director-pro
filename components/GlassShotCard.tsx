
import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, AlertCircle, X, Copy, ExternalLink, Wand2 } from 'lucide-react';
import { Shot } from '../types';
import { generateFallbackPrompt, copyTextToClipboard, ensureString } from '../utils';

interface GlassShotCardProps {
  shot: Shot;
  index: number;
  onRegenerate: (index: number) => void;
  onGenerateVideo?: () => void;
  flowLabel?: string;
  style: string;
  audioType: string;
  scriptStyle: string;
}

export const GlassShotCard: React.FC<GlassShotCardProps> = ({ shot, index, onRegenerate, onGenerateVideo, flowLabel, style, audioType, scriptStyle }) => {
  const [tool, setTool] = useState<string | null>(null); 
  const [showTools, setShowTools] = useState(false);
  const prompts = shot.platformPrompts || {}; 
  
  const getDisplayPrompt = (t: string) => {
      let p = t === 'dreamina' ? prompts.dreamina : (t === 'grok' ? prompts.grok : prompts.meta);
      if (t === 'grok' || !p || p === "Prompt loading..." || p.includes("...")) {
          return generateFallbackPrompt(t, shot, style, index, audioType, shot.voiceover_script, scriptStyle);
      }
      return ensureString(p);
  };

  return (
      <div className="group relative bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 transition-all duration-500 hover:-translate-y-2">
          <div className="relative aspect-[9/16] bg-slate-900 overflow-hidden">
              {shot.isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 bg-slate-900">
                    <Loader2 className="w-10 h-10 animate-spin mb-3" />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Rendering Scene</span>
                  </div>
              ) : shot.videoUrl ? (
                  <video 
                    src={shot.videoUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                  />
              ) : shot.imageUrl ? (
                  <>
                      <img src={shot.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Shot ${index + 1}`}/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-slate-900 shadow-xl uppercase tracking-widest">{ensureString(flowLabel || `Shot ${index+1}`)}</div>
                  </>
              ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 text-xs gap-2 bg-slate-900">
                    <AlertCircle size={24}/>
                    <span className="font-black uppercase tracking-widest">Render Error</span>
                  </div>
              )}
          </div>
          
          <div className="p-5 bg-white border-t border-slate-50 relative z-20">
              {!showTools ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                      onClick={() => setShowTools(true)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                      <ImageIcon size={14}/> Prompts
                  </button>
                  <button 
                      onClick={onGenerateVideo}
                      className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                      <Wand2 size={14}/> AI Video
                  </button>
                </div>
              ) : (
                  <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                       <div className="flex justify-between items-center mb-3 px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Export Format</span>
                          <button onClick={() => { setShowTools(false); setTool(null); }} className="text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                       </div>
                      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-2">
                          {['dreamina', 'grok', 'meta'].map(t => (
                              <button key={t} onClick={() => setTool(tool === t ? null : t)} className={`flex-1 py-2.5 text-[9px] uppercase font-black rounded-xl transition-all ${tool === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{t}</button>
                          ))}
                      </div>
                  </div>
              )}

              {tool && showTools && (
                  <div className="absolute bottom-full left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-2xl rounded-t-[2.5rem] animate-in slide-in-from-bottom-2 z-30">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{tool} Production Key</span>
                        <button onClick={() => setTool(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                      </div>
                      <div className="h-28 overflow-y-auto custom-scrollbar text-[10px] text-slate-600 font-mono leading-relaxed mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {getDisplayPrompt(tool)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => {copyTextToClipboard(getDisplayPrompt(tool));}} className="py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-black transition-colors"><Copy size={12}/> Copy</button>
                        <a href={tool === 'dreamina' ? 'https://dreamina.capcut.com/' : tool === 'grok' ? 'https://grok.com/' : 'https://meta.ai/'} target="_blank" rel="noreferrer" className="py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                            <ExternalLink size={12}/> Open AI
                        </a>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};
