import React from 'react';
import { 
  User, Tv, Camera, RefreshCw, Footprints, Building, Wand2, Coffee, Video, Plane
} from 'lucide-react';
import { ContentStyle } from './types';

export const LANGUAGES = [ 
  { id: 'Indonesian', name: 'Bahasa Indonesia (ID)' }, 
  { id: 'Malay', name: 'Bahasa Melayu (MY)' }, 
  { id: 'English', name: 'English (US)' } 
];

export const SCRIPT_STYLES = [ 
  { id: 'Direct & Clear', name: 'Jelas (Direct)' }, 
  { id: 'Poetic', name: 'Puitis' }, 
  { id: 'Casual', name: 'Santai (Gaul)' }, 
  { id: 'Professional', name: 'Profesional' }, 
  { id: 'Hype', name: 'Hype (Racun)' } 
];

export const VOICE_OPTIONS = [ 
  { id: 'Puck', name: 'Pria - Ramah' }, 
  { id: 'Fenrir', name: 'Pria - Berat' }, 
  { id: 'Charon', name: 'Pria - Narator' }, 
  { id: 'Kore', name: 'Wanita - Ceria' }, 
  { id: 'Aoede', name: 'Wanita - Elegan' }, 
  { id: 'Leda', name: 'Wanita - Story' } 
];

export const CONTENT_STYLES: Record<string, ContentStyle> = {
  ugc: { 
      id: 'ugc', 
      name: 'UGC Review', 
      icon: <User size={18} />, 
      description: 'Review Jujur & Testimoni. (Auto Hybrid UGC)', 
      inputs: ['productImage', 'modelImage'],
      audioStrategy: 'hybrid_ugc' 
  },
  ads: { 
      id: 'ads', 
      name: 'Professional Ads', 
      icon: <Tv size={18} />, 
      description: 'Iklan TV Komersial High-End. (Hybrid: Model Bicara + B-Roll Produk)', 
      inputs: ['productImage', 'modelImage', 'backgroundImage'],
      audioStrategy: 'hybrid_ads'
  },
  presentation: { 
      id: 'presentation', 
      name: 'Fashion B-Roll', 
      icon: <Camera size={18} />, 
      description: 'Video Fashion Profesional. (Auto Dubbing/No Talk)', 
      inputs: ['productImage', 'modelImage', 'backgroundImage'],
      audioStrategy: 'dubbing'
  },
  mannequin: { 
      id: 'mannequin', 
      name: 'Mannequin 2 Shot', 
      icon: <RefreshCw size={18} />, 
      description: 'Display Fashion Simpel. (Auto Dubbing/No Talk)', 
      inputs: ['productImage', 'modelImage'],
      audioStrategy: 'dubbing'
  },
  treadmill: { 
      id: 'treadmill', 
      name: 'Runway Loop', 
      icon: <Footprints size={18} />, 
      description: 'Video Looping Cepat. (Auto Dubbing/No Talk)', 
      inputs: ['outfitBatch', 'modelImage', 'backgroundImage'],
      audioStrategy: 'dubbing'
  },
  realestate: { 
      id: 'realestate', 
      name: 'Real Estate Tour', 
      icon: <Building size={18} />, 
      description: 'Tur Properti Realistis. (Pilih: Dubbing / Lip Sync Agent)', 
      inputs: ['realEstateBatch', 'modelImage'],
      audioStrategy: 'selectable'
  },
  aesthetic: { 
      id: 'aesthetic', 
      name: 'Aesthetic POV', 
      icon: <Wand2 size={18} />, 
      description: 'POV Tangan Estetik. 5 Shot Story. Background otomatis aesthetic.', 
      inputs: ['productImage', 'backgroundImage'],
      audioStrategy: 'dubbing'
  },
  foodie: { 
      id: 'foodie', 
      name: 'Foodie Ad', 
      icon: <Coffee size={18} />, 
      description: 'Sinematik Kuliner. (Auto Lip Sync Vlogger)', 
      inputs: ['productImage', 'modelImage'],
      audioStrategy: 'lipsync'
  },
  cinematic: { 
      id: 'cinematic', 
      name: 'Cinematic', 
      icon: <Video size={18} />, 
      description: 'Gaya Film Layar Lebar. (Auto Dubbing)', 
      inputs: ['productImage', 'modelImage'],
      audioStrategy: 'dubbing'
  },
  travel: { 
      id: 'travel', 
      name: 'Travel Vlog', 
      icon: <Plane size={18} />, 
      description: 'Vlog Liburan & Wisata. (Auto Hybrid)', 
      inputs: ['locationImage', 'modelImage'],
      audioStrategy: 'hybrid_vlog'
  }
};

export const STYLE_MAPPING: Record<string, string> = {
    ugc: 'quick_review',
    ads: 'professional_ads', 
    presentation: 'fashion_broll',
    mannequin: 'direct',
    treadmill: 'treadmill_fashion_show',
    realestate: 'property',
    aesthetic: 'aesthetic_hands_on',
    foodie: 'food_promo',
    cinematic: 'direct',
    travel: 'travel'
};

export const STORY_FLOWS: Record<string, string[]> = {
    ugc: ["SHOT 1: HOOK (Jembreng/Pegang)", "SHOT 2: THE DEMO (Pakai)", "SHOT 3: THE RESULT (Face)", "SHOT 4: TEXTURE/DETAIL", "SHOT 5: CTA (Face)"],
    ads: ["SHOT 1: MODEL", "SHOT 2: B-ROLL", "SHOT 3: B-ROLL", "SHOT 4: B-ROLL", "SHOT 5: MODEL"],
    presentation: ["SHOT 1: THE POWER WALK", "SHOT 2: SIDE PROFILE", "SHOT 3: OUTFIT DETAIL", "SHOT 4: LIFESTYLE POSE", "SHOT 5: THE PORTRAIT"],
    mannequin: ["SHOT 1: MANNEQUIN DISPLAY", "SHOT 2: ON-MODEL REVEAL"],
    realestate: ["RUANG 1: LIFESTYLE", "RUANG 2: LIFESTYLE", "RUANG 3: LIFESTYLE", "RUANG 4: LIFESTYLE", "RUANG 5: LIFESTYLE"],
    aesthetic: ["SHOT 1: UNBOXING/OUTER", "SHOT 2: PRODUCT REVEAL", "SHOT 3: TEXTURE/DEMO", "SHOT 4: BRANDING DETAIL", "SHOT 5: FINAL LOOK"],
    foodie: ["SHOT 1: BEAUTY SHOT (Plating)", "SHOT 2: THE ACTION (Pour/Slice)", "SHOT 3: MACRO TEXTURE", "SHOT 4: THE TASTE (Eating)", "SHOT 5: SATISFACTION (Smile)"]
};