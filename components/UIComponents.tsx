
import React from 'react';
import { Upload, Monitor, Smartphone, Users, MessageCircle, ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';
import { FileData } from '../types';

export const WelcomeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] rounded-[2rem] p-8 max-w-sm w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Hallo Affiliator 136</h2>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Welcome to Future Studio</p>
          </div>
          <div className="space-y-3 mb-8">
              <a href="https://youtu.be/VLf_9JVS_6I" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="bg-red-50 text-red-600 p-2 rounded-lg group-hover:bg-red-100 transition-colors"><Monitor size={16} /></div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">Tutorial Desktop</span>
              </a>
              <a href="https://youtu.be/BtZdJQkF-Ro" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-100 transition-colors"><Smartphone size={16} /></div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">Tutorial HP</span>
              </a>
              <a href="https://t.me/+0ya6fSZRW_5mZDdl" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="bg-sky-50 text-sky-600 p-2 rounded-lg group-hover:bg-sky-100 transition-colors"><Users size={16} /></div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">Group Telegram</span>
              </a>
              <a href="https://wa.me/6288985584050" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="bg-green-50 text-green-600 p-2 rounded-lg group-hover:bg-green-100 transition-colors"><MessageCircle size={16} /></div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">WA Admin</span>
              </a>
          </div>
          <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 mb-4 bg-slate-50 py-1.5 rounded-lg border border-slate-100 inline-block px-4">⚠️ 1 USER 1 LINK</p>
              <button onClick={onClose} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">Masuk ke Tool <ArrowRight size={16}/></button>
          </div>
      </div>
  </div>
);

export const UploadCard: React.FC<{
  label: string;
  hasFile: boolean;
  fileData: FileData | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  icon?: React.ReactNode;
}> = ({ label, hasFile, fileData, onChange, onClear, icon }) => {
  const displayIcon = icon || <Upload size={16}/>;
  return (
      <label className={`relative flex flex-col items-center justify-center h-28 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group overflow-hidden ${hasFile ? 'bg-white border-indigo-300 shadow-md' : 'bg-white/40 border-white/60 hover:border-indigo-300 hover:bg-white/60'}`}>
          {hasFile && fileData ? (
              <div className="absolute inset-0 z-0">
                  <img src={`data:${fileData.mimeType};base64,${fileData.data}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                  <div className="absolute inset-0 bg-indigo-900/30"></div>
              </div>
          ) : null}
          <div className={`mb-1 p-2 rounded-full transition-transform duration-300 group-hover:scale-110 relative z-10 ${hasFile ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
              {hasFile ? <CheckCircle2 size={16}/> : displayIcon}
          </div>
          <span className={`text-[10px] font-bold relative z-10 text-center px-2 ${hasFile ? 'text-white drop-shadow-md' : 'text-slate-500'}`}>{label}</span>
          <input type="file" accept="image/*" onChange={onChange} className="hidden" />
          {hasFile && (
              <button onClick={(e) => { e.preventDefault(); onClear(); }} className="absolute top-1 right-1 z-20 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"><Trash2 size={10}/></button>
          )}
      </label>
  );
};

export const InputMethodToggle: React.FC<{
  mode: 'upload' | 'prompt';
  setMode: (mode: 'upload' | 'prompt') => void;
  label: string;
}> = ({ mode, setMode, label }) => (
  <div className="flex items-center gap-1 mb-2 bg-slate-100 p-1 rounded-lg w-fit mx-auto md:mx-0">
      <button onClick={() => setMode('upload')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${mode === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Upload {label}</button>
      <button onClick={() => setMode('prompt')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${mode === 'prompt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Tulis Prompt</button>
  </div>
);

export const SelectBox: React.FC<{
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon?: React.ReactNode;
}> = ({ label, value, options, onChange, icon }) => (
  <div className="relative group">
    {icon && <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">{icon}</div>}
    <select 
      value={value} 
      onChange={onChange}
      className={`w-full bg-white/50 border border-white/60 rounded-xl ${icon ? 'pl-9' : 'pl-3'} pr-8 py-3 text-xs text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-300 shadow-sm appearance-none cursor-pointer transition-all`}
    >
      {options.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
    </select>
  </div>
);

export const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    React.useEffect(() => {
        let index = 0;
        let isDeleting = false;
        let timeout: ReturnType<typeof setTimeout>;
        const animate = () => {
            if (!isDeleting && index <= text.length) {
                setDisplayedText(text.substring(0, index));
                index++;
                timeout = setTimeout(animate, 100);
            } else if (isDeleting && index >= 0) {
                setDisplayedText(text.substring(0, index));
                index--;
                timeout = setTimeout(animate, 50);
            } else if (index > text.length) {
                isDeleting = true;
                timeout = setTimeout(animate, 2000); 
            } else if (index < 0) {
                isDeleting = false;
                timeout = setTimeout(animate, 500); 
            }
        };
        animate();
        return () => clearTimeout(timeout);
    }, [text]);
    return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {displayedText}
            <span className="animate-pulse text-indigo-600 ml-1">|</span>
        </span>
    );
};
