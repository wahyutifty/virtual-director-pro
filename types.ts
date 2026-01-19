
import React from 'react';

export interface FileData {
  data: string;
  mimeType: string;
}

export interface Shot {
  shot_number: number;
  visual_prompt: string;
  voiceover_script: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  isLoading: boolean;
  error?: string | null;
  platformPrompts?: Record<string, string>;
  outfitImage?: FileData | null;
  locationImage?: FileData | null;
  modelImage?: FileData | null;
}

export interface AppInputs {
  productImage: FileData | null;
  modelImage: FileData | null;
  backgroundImage: FileData | null;
  outfitImages: (FileData | null)[];
  locationImages: (FileData | null)[];
  topic: string;
  mood: string;
  language: string;
  scriptStyle: string;
  modelPrompt: string;
  backgroundPrompt: string;
  audioType: string;
}

export interface InputModes {
  model: 'upload' | 'prompt';
  background: 'upload' | 'prompt';
}

export interface CreativePlanResponse {
  tiktokScript: string;
  shotPrompts: string[];
  shotScripts: string[];
  consistency_profile: string;
  tiktokMetadata?: {
    description: string;
    keywords: string[];
  };
  platformPrompts?: Record<string, string>[];
}

export interface ContentStyle {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  inputs: string[];
  audioStrategy: string;
}
