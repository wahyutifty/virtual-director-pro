
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Loader2, PlayCircle, Pause, Play, Images, 
  Mic, FileText, AlertCircle, Home, User, ImageIcon, Globe, PenTool, Mic2, X,
  Crown, Video, CheckCircle, Info, Link, Eye, EyeOff, Terminal, Cpu
} from 'lucide-react';
import { GeminiService } from './services/geminiService';
import { 
  CONTENT_STYLES, LANGUAGES, SCRIPT_STYLES, VOICE_OPTIONS, STORY_FLOWS
} from './constants';
import { 
  ensureString, safeArray, base64ToArrayBuffer, pcmToWav, generateImageWithToken 
} from './utils';
import { 
  WelcomeModal, UploadCard, SelectBox, TypewriterText 
} from './components/UIComponents';
import { GlassShotCard } from './components/GlassShotCard';
import { AnimaticPlayer } from './components/AnimaticPlayer';
import { AppInputs, FileData, Shot, CreativePlanResponse } from './types';

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<string>('aesthetic');
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  
  const [inputs, setInputs] = useState<AppInputs>({
    productImage: null, 
    modelImage: null, 
    backgroundImage: null,
    outfitImages: [null, null, null, null, null, null],
    locationImages: [null, null, null, null, null, null], 
    topic: '', 
    mood: 'Soft', 
    language: 'Indonesian', 
    scriptStyle: 'Direct & Clear',
    modelPrompt: '', 
    backgroundPrompt: '',
    audioType: 'dubbing'
  });
  
  const [storyboard, setStoryboard] = useState<Shot[]>([]);
  const [metadata, setMetadata] = useState<{ title: string; hashtags: string; script_outline: string } | null>(null);
  const [consistencyContext, setConsistencyContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<number | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Puck'); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnimatic, setShowAnimatic] = useState(false);
  const [editableScript, setEditableScript] = useState('');
  
  const [videoStatus, setVideoStatus] = useState("Preparing scene...");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      const styleConfig = CONTENT_STYLES[selectedStyle];
      const defaultAudio = styleConfig?.audioStrategy === 'selectable' ? 'dubbing' : styleConfig?.audioStrategy;
      setInputs(prev => ({ ...prev, audioType: defaultAudio || 'dubbing' }));
  }, [selectedStyle]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string, index: number | null = null) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const fileData: FileData = { data: base64, mimeType: file.type };
        if (type === 'general') setInputs(prev => ({ ...prev, productImage: fileData }));
        else if (type === 'model') setInputs(prev => ({ ...prev, modelImage: fileData }));
        else if (type === 'background') setInputs(prev => ({ ...prev, backgroundImage: fileData }));
        else if (type === 'outfit' && index !== null) {
            const newOutfits = [...inputs.outfitImages];
            newOutfits[index] = fileData;
            setInputs(prev => ({ ...prev, outfitImages: newOutfits }));
        }
        else if (type === 'location' && index !== null) {
            const newLocations = [...inputs.locationImages];
            newLocations[index] = fileData;
            setInputs(prev => ({ ...prev, locationImages: newLocations }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = (type: string, index: number | null = null) => {
    if (type === 'general') setInputs(prev => ({ ...prev, productImage: null }));
    else if (type === 'model') setInputs(prev => ({ ...prev, modelImage: null }));
    else if (type === 'background') setInputs(prev => ({ ...prev, backgroundImage: null }));
    else if (type === 'outfit' && index !== null) {
      const newOutfits = [...inputs.outfitImages];
      newOutfits[index] = null;
      setInputs(prev => ({ ...prev, outfitImages: newOutfits }));
    }
    else if (type === 'location' && index !== null) {
      const newLocations = [...inputs.locationImages];
      newLocations[index] = null;
      setInputs(prev => ({ ...prev, locationImages: newLocations }));
    }
  };

  const ensureApiKey = async () => {
    if (isHighQuality || isGeneratingVideo !== null) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
    return true;
  };

  const handleGenerateStoryboard = async () => {
    await ensureApiKey();
    const apiKey = process.env.API_KEY || '';
    if (!inputs.productImage && CONTENT_STYLES[selectedStyle].inputs.includes('productImage')) return setError("Upload produk utama.");

    setIsAnalyzing(true); setError(null); setProgress('Merancang Strategi...');
    setStoryboard([]); setMetadata(null);

    try {
        const plan: CreativePlanResponse = await GeminiService.getCreativePlan(apiKey, selectedStyle, inputs, inputs.topic, inputs.language, inputs.scriptStyle);
        
        const consistentScript = safeArray(plan.shotScripts).filter((s: string) => s).join('\n\n');
        const meta = {
            title: ensureString(plan.tiktokMetadata?.description) || "Campaign",
            hashtags: safeArray(plan.tiktokMetadata?.keywords).map((k: string) => `#${ensureString(k)}`).join(' '),
            script_outline: consistentScript || ensureString(plan.tiktokScript)
        };
        setMetadata(meta);
        setEditableScript(meta.script_outline);
        const cleanProfile = ensureString(plan.consistency_profile);
        setConsistencyContext(cleanProfile);

        let initialShots: Shot[] = safeArray(plan.shotPrompts).map((prompt: string, idx: number) => ({
            shot_number: idx + 1,
            visual_prompt: ensureString(prompt),
            platformPrompts: plan.platformPrompts?.[idx] || {},
            voiceover_script: safeArray(plan.shotScripts)[idx] || "", 
            imageUrl: null, 
            isLoading: true,
        }));

        setStoryboard(initialShots);
        setIsAnalyzing(false); setIsGeneratingImages(true); setProgress('Rendering Visual...');
        
        const updatedShots = [...initialShots];
        for (let i = 0; i < updatedShots.length; i++) {
            try {
                // Task 2: Integrate Token Logic
                if (sessionToken) {
                    setProgress(`Requesting Neural Asset ${i + 1}/${updatedShots.length}...`);
                    const images = await generateImageWithToken(updatedShots[i].visual_prompt, sessionToken);
                    if (images && images.length > 0) {
                        updatedShots[i].imageUrl = images[0];
                    } else {
                        throw new Error("Neural Bridge returned empty image set.");
                    }
                } else {
                    // Fallback to standard Gemini Image API
                    let refs: (FileData | string)[] = [];
                    if (inputs.productImage) refs.push(inputs.productImage);
                    if (inputs.modelImage) refs.push(inputs.modelImage);

                    const url = await GeminiService.generateImage(apiKey, updatedShots[i].visual_prompt, refs, {
                        style: selectedStyle,
                        consistencyProfile: cleanProfile,
                        isHighQuality
                    });
                    updatedShots[i].imageUrl = `data:image/png;base64,${url}`;
                }
            } catch (e: any) { 
              console.error("Shot generation error:", e);
              updatedShots[i].error = e.message || "Gagal render"; 
              if (String(e).includes("entity was not found")) {
                await window.aistudio.openSelectKey();
                return;
              }
            }
            updatedShots[i].isLoading = false;
            setStoryboard([...updatedShots]);
            setProgress(`Shot ${i + 1}/${updatedShots.length} Selesai...`);
        }
        setIsGeneratingImages(false);
    } catch (err: any) { 
      setError("Gagal: " + (err.message || String(err))); 
      setIsAnalyzing(false); setIsGeneratingImages(false); 
    }
  };

  const handleGenerateAiVideo = async (index: number) => {
    await window.aistudio.openSelectKey();
    const apiKey = process.env.API_KEY || '';
    setIsGeneratingVideo(index);
    setVideoStatus("Cinematographer is setting up...");
    
    const shot = storyboard[index];
    const imageParts = shot.imageUrl?.split(',');
    const base64 = imageParts?.[1];
    const mime = imageParts?.[0].split(':')[1].split(';')[0];

    const messages = [
      "Director is reviewing the script...",
      "Setting up cinematic lighting...",
      "Capturing the magic in 1080p...",
      "Fine-tuning motion vectors...",
      "Adding final touches to the scene..."
    ];
    
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setVideoStatus(messages[msgIdx]);
    }, 8000);

    try {
      const videoUrl = await GeminiService.generateVideo(apiKey, shot.visual_prompt, base64, mime);
      const newStoryboard = [...storyboard];
      newStoryboard[index].videoUrl = videoUrl;
      setStoryboard(newStoryboard);
    } catch (e: any) {
      setError("Video generation failed. Please try again.");
    } finally {
      clearInterval(interval);
      setIsGeneratingVideo(null);
    }
  };

  const handleGenerateAudio = async () => {
    const apiKey = process.env.API_KEY || '';
    if (!editableScript) return setError("Naskah kosong.");
    setIsGeneratingAudio(true);
    setError(null);
    try {
      const base64 = await GeminiService.generateTTS(apiKey, editableScript, selectedVoice);
      const audioData = base64ToArrayBuffer(base64);
      const samples = new Int16Array(audioData);
      const wavBlob = pcmToWav(samples, 1, 24000);
      setAudioUrl(URL.createObjectURL(wavBlob));
    } catch (e: any) {
      setError("Audio failed: " + e.message);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const downloadDoc = () => {
    const blob = new Blob([editableScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata?.title || 'campaign'}_script.txt`;
    a.click();
  };

  const downloadImages = async () => {
    if (!window.JSZip) return setError("JSZip utility not available.");
    const zip = new window.JSZip();
    storyboard.forEach((shot, i) => {
      if (shot.imageUrl) {
        if (shot.imageUrl.startsWith('data:')) {
          zip.file(`shot_${i+1}.png`, shot.imageUrl.split(',')[1], {base64: true});
        } else {
          // Handle remote URLs if necessary - for now we just link or could fetch
          // In token mode, these are remote URLs. We should ideally fetch them to zip them.
        }
      }
    });
    const content = await zip.generateAsync({type:"blob"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'campaign_storyboard_assets.zip';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 flex relative overflow-x-hidden">
        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
        {showAnimatic && <AnimaticPlayer shots={storyboard} audioUrl={audioUrl} onClose={() => setShowAnimatic(false)} />}

        {/* SIDEBAR (Neural Bridge Configuration) */}
        <aside className="hidden lg:flex w-72 h-screen sticky top-0 bg-white border-r border-slate-200 flex-col p-6 z-40 shrink-0">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">T</div>
                <div>
                   <h1 className="text-xs font-black tracking-widest text-slate-900 uppercase">Director Pro</h1>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">v4.2 Production Suite</p>
                </div>
            </div>

            <div className="flex-1 space-y-8">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Navigation</span>
                    <nav className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold transition-all"><Home size={16}/> Studio Flow</button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"><Video size={16}/> Asset Library</button>
                    </nav>
                </div>

                <div className="pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Cpu size={12}/> Neural Bridge
                        </span>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${sessionToken ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50 animate-pulse'}`}></div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase">Ngatmay Session</label>
                           <button onClick={() => setShowToken(!showToken)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                              {showToken ? <EyeOff size={12}/> : <Eye size={12}/>}
                           </button>
                        </div>
                        <div className="relative">
                            <input 
                                type={showToken ? "text" : "password"}
                                value={sessionToken}
                                onChange={(e) => setSessionToken(e.target.value)}
                                placeholder="Paste token here..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 px-3 text-[10px] text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                            />
                            {!sessionToken && <Terminal className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700" size={12} />}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className={`text-[8px] font-black uppercase ${sessionToken ? 'text-emerald-500' : 'text-slate-600'}`}>
                                {sessionToken ? 'Bridge Active' : 'Waiting for link'}
                            </span>
                            <button 
                                onClick={() => setSessionToken('')} 
                                className="text-[8px] font-black text-slate-600 hover:text-rose-400 uppercase transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <p className="mt-3 text-[9px] text-slate-400 leading-relaxed font-medium">Connect your local bridge to enable ultra-low latency rendering pipelines.</p>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
                 <button onClick={() => window.aistudio.openSelectKey()} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all group">
                    <span className="flex items-center gap-2"><Link size={14}/> Cloud Key</span>
                    <CheckCircle className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" size={14}/>
                 </button>
            </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
            {isGeneratingVideo !== null && (
              <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                  <Loader2 size={80} className="text-indigo-500 animate-spin" />
                  <Video className="absolute inset-0 m-auto text-white animate-pulse" size={32} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">VEO PRODUCTION SUITE</h2>
                <p className="text-indigo-300 font-bold uppercase tracking-[0.3em] text-xs mb-8">{videoStatus}</p>
                <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 animate-progress-indeterminate"></div>
                </div>
                <p className="text-white/40 text-[10px] mt-12 max-w-xs">AI Video generation may take up to 2 minutes. Please do not close this tab.</p>
              </div>
            )}

            <header className="fixed top-0 left-0 lg:left-72 right-0 z-50 px-4 py-3 transition-all duration-500">
                <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-full px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="lg:hidden w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">T</div>
                        <h1 className="text-xs font-bold tracking-tighter text-slate-800">TENTATIF DIRECTOR <span className="text-indigo-600">PRO</span></h1>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                        onClick={() => setIsHighQuality(!isHighQuality)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${isHighQuality ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                       >
                         <Crown size={12} fill={isHighQuality ? "currentColor" : "none"}/> {isHighQuality ? 'PRO MODE ACTIVE' : 'UPGRADE TO PRO'}
                       </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-24 flex flex-col items-center gap-8 w-full">
                {!storyboard.length && !isAnalyzing && (
                    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">Your Digital Studio. <TypewriterText text="Ready." /></h2>
                            <p className="text-slate-500 font-medium text-lg">Automated high-end content for the next-gen creator.</p>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-10 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Sparkles size={12}/> Select Campaign Direction</label>
                                <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                                    {Object.values(CONTENT_STYLES).map((style: any) => (
                                        <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all duration-300 border-2 ${selectedStyle === style.id ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                                            <div className={`mb-2 p-3 rounded-2xl ${selectedStyle === style.id ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-slate-400 shadow-sm'}`}>{style.icon}</div>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter text-center ${selectedStyle === style.id ? 'text-indigo-900' : 'text-slate-400'}`}>{style.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><ImageIcon size={12}/> Visual Resources</label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <UploadCard label="Master Product Photo" hasFile={!!inputs.productImage} fileData={inputs.productImage} onChange={(e) => handleFileUpload(e, 'general')} onClear={() => handleClearFile('general')} />
                                    <UploadCard label="Brand Model Persona" hasFile={!!inputs.modelImage} fileData={inputs.modelImage} onChange={(e) => handleFileUpload(e, 'model')} onClear={() => handleClearFile('model')} icon={<User size={14}/>} />
                                 </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                 <SelectBox label="Market Language" icon={<Globe size={12}/>} value={inputs.language} onChange={(e) => setInputs({...inputs, language: e.target.value})} options={LANGUAGES.map(l => ({v: l.id, l: l.name}))} />
                                 <SelectBox label="Copywriting Tone" icon={<PenTool size={12}/>} value={inputs.scriptStyle} onChange={(e) => setInputs({...inputs, scriptStyle: e.target.value})} options={SCRIPT_STYLES.map(s => ({v: s.id, l: s.name}))} />
                            </div>

                            <textarea value={inputs.topic} onChange={(e) => setInputs(p => ({...p, topic: e.target.value}))} placeholder="Brief your digital director (e.g., Summer skincare routine for Gen Z)..." className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm text-slate-700 focus:bg-white focus:border-indigo-300 outline-none h-32 shadow-inner transition-all" />

                            <button onClick={handleGenerateStoryboard} className="w-full py-5 rounded-3xl font-black text-sm text-white shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 bg-slate-900 group">
                                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" /> START PRODUCTION
                            </button>
                        </div>
                    </div>
                )}

                {isAnalyzing && (
                     <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
                         <div className="relative mb-8">
                             <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                             <Loader2 size={72} className="text-indigo-600 animate-spin relative z-10" />
                         </div>
                         <h3 className="text-3xl font-black text-slate-900 mb-2">Architecting Campaign...</h3>
                         <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">{progress}</p>
                     </div>
                )}

                {storyboard.length > 0 && !isAnalyzing && (
                    <div className="w-full animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                            <div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 block">Campaign Board</span>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{ensureString(metadata?.title)}</h2>
                                <p className="text-slate-400 font-medium text-sm mt-2">{ensureString(metadata?.hashtags)}</p>
                            </div>
                            <div className="flex gap-3">
                                 <button onClick={() => setStoryboard([])} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition">New Draft</button>
                                 <button onClick={() => setShowAnimatic(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-black shadow-2xl transition-all flex items-center gap-2">
                                    <PlayCircle size={16}/> Preview Animatic
                                 </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                             <div className="lg:col-span-1 space-y-6">
                                 <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl">
                                     <div className="flex items-center justify-between mb-6">
                                         <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest"><FileText size={16} className="text-indigo-500"/> Script & Audio</h3>
                                         <button onClick={downloadDoc} className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-1 uppercase">Download TXT</button>
                                     </div>
                                     <textarea 
                                        value={editableScript} 
                                        onChange={(e) => setEditableScript(e.target.value)} 
                                        className="w-full h-80 p-5 bg-slate-50 rounded-3xl border border-slate-100 text-sm text-slate-700 leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium"
                                     />
                                     
                                     <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                         <div className="mb-4">
                                             <SelectBox label="Voice Talent" value={selectedVoice} options={VOICE_OPTIONS.map(v => ({v: v.id, l: v.name}))} onChange={(e) => setSelectedVoice(e.target.value)} icon={<Mic2 size={12}/>} />
                                         </div>
                                         
                                         {audioUrl ? (
                                             <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                                                 <button onClick={() => {
                                                     const audio = audioRef.current;
                                                     if (audio) {
                                                         if (isPlaying) audio.pause();
                                                         else audio.play();
                                                         setIsPlaying(!isPlaying);
                                                     }
                                                 }} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition">
                                                     {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
                                                 </button>
                                                 <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                     <div className="h-full bg-indigo-500 w-[70%]"></div>
                                                 </div>
                                                 <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                                             </div>
                                         ) : (
                                             <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase transition flex items-center justify-center gap-2">
                                                 {isGeneratingAudio ? <Loader2 size={14} className="animate-spin"/> : <Mic size={14}/>} {isGeneratingAudio ? "Synthesizing..." : "Generate Voiceover"}
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <div className="lg:col-span-2">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                     {storyboard.map((shot, idx) => (
                                         <GlassShotCard 
                                          key={idx} 
                                          shot={shot} 
                                          index={idx} 
                                          onRegenerate={() => {}} 
                                          onGenerateVideo={() => handleGenerateAiVideo(idx)}
                                          flowLabel={STORY_FLOWS[selectedStyle]?.[idx]?.split(":")[0] || `Shot ${idx+1}`} 
                                          audioType={inputs.audioType} 
                                          scriptStyle={inputs.scriptStyle} 
                                          style={selectedStyle} 
                                         />
                                     ))}
                                 </div>
                                 <div className="mt-10 flex justify-end">
                                     <button onClick={downloadImages} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-2xl hover:bg-black transition flex items-center gap-3">
                                         <Images size={18}/> Download Asset Pack
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-auto py-12 border-t border-slate-200 bg-white">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">T</div>
                   <div>
                      <h4 className="font-black text-slate-900 text-sm tracking-widest uppercase">Tentatif Director Pro</h4>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">AI-Powered Production Suite v4.2</p>
                   </div>
                </div>
                <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <a href="#" className="hover:text-indigo-600 transition">Terms</a>
                  <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition flex items-center gap-1"><Info size={10}/> Billing Docs</a>
                </div>
              </div>
            </footer>
        </div>

        {error && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 z-[100] animate-in slide-in-from-bottom-4">
                <AlertCircle size={20} className="text-red-400" />
                <span className="font-bold text-xs uppercase tracking-widest">{error}</span>
                <button onClick={() => setError(null)} className="ml-4 hover:bg-white/10 rounded-full p-1"><X size={16}/></button>
            </div>
        )}
    </div>
  );
};

export default App;
