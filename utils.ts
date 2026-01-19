
import { CONTENT_STYLES } from './constants';
import { FileData, Shot } from './types';

export const ensureString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.map(item => ensureString(item)).join(', ');
  if (typeof val === 'object') {
    try { return Object.values(val).map(v => ensureString(v)).join(' | '); } catch (e) { return "Complex Data"; }
  }
  return String(val);
};

export const safeArray = (val: any): any[] => (Array.isArray(val) ? val : []);

export const copyTextToClipboard = async (text: string) => {
  if (!text) return false;
  if ('clipboard' in navigator && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  }
  try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus(); textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
  } catch (e) { return false; }
};

/**
 * Task 1: Create API Utility for Token-based Generation
 * Sends a prompt to the Google Labs proxy endpoint using a Neural Session Token.
 */
export async function generateImageWithToken(prompt: string, token: string): Promise<string[]> {
  try {
    const response = await fetch('/api/google-labs/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: "9:16",
        image_count: 2
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Request failed with status ${response.status}`);
    }

    const data = await response.json();
    // Assuming the response structure contains an array of images/URLs as per Google Labs standards
    return data.images || data.results || [];
  } catch (error) {
    console.error("Error generating image with token:", error);
    throw error;
  }
}

export const generateFallbackPrompt = (platform: string, shot: Shot, style: string, index: number, audioType: string, script: string, scriptStyle: string) => {
    const visual = ensureString(shot.visual_prompt) || "Adegan visual tidak tersedia.";
    const safeScript = ensureString(script || shot.voiceover_script);
    const audioStrategy = CONTENT_STYLES[style]?.audioStrategy || 'dubbing';

    const negativeBase = "--negative_prompt teks, subtitle, caption, grafis, watermark, logo, tulisan, UI, kartun, anime, palsu, distorsi, wajah barat, rambut pirang, orang utuh, tubuh manusia (jika POV), wajah (jika POV), background asli, background sumber, background input, sisa background";
    const stableNegative = "gerakan berlebihan, morphing, perubahan bentuk produk, tangan aneh, anatomi buruk, glitch, pergerakan kamera cepat, zoom cepat, baju berubah, warna berubah";

    switch (platform) {
        case 'dreamina': 
            const baseDreamina = `${visual}. 8k, photorealistic, cinematic lighting. ${negativeBase}, ${stableNegative}`;
            if (baseDreamina.length > 990) {
                return baseDreamina.substring(0, 990);
            }
            return baseDreamina;
            
        case 'meta':
            return `${visual}, Very Slow Zoom In, Slow Motion, fotorealistik, 8k, model Indonesia. ${negativeBase}, ${stableNegative}`;
            
        case 'grok': 
            let shouldLipSync = false;

            if (audioStrategy === 'lipsync') {
                shouldLipSync = true;
            } else if (audioStrategy === 'dubbing') {
                shouldLipSync = false;
            } else if (audioStrategy === 'selectable') {
                 shouldLipSync = (audioType === 'lipsync');
            } else if (audioStrategy === 'hybrid_ads') {
                if (index === 0 || index === 4) shouldLipSync = true;
                else shouldLipSync = false;
            } else if (audioStrategy === 'hybrid_ugc') {
                if (index === 3) shouldLipSync = false; 
                else shouldLipSync = true;
            } else if (audioStrategy === 'hybrid_vlog') {
                shouldLipSync = (safeScript && safeScript.length > 2); 
            }

            if (shouldLipSync && safeScript.length > 2) {
                 return `${visual} (Gerakan Kamera Halus, Fokus Wajah Bicara), model berbicara: "${safeScript}" ${negativeBase}, ${stableNegative}`;
            } else {
                 const voiceInstruction = safeScript.length > 2 ? `, Narator berbicara: "${safeScript}"` : "";
                 return `${visual} (Gerakan Kamera Halus, Fokus Aksi/Pose, Mode Voice Over/Dubbing)${voiceInstruction} ${negativeBase}, ${stableNegative}, talking, moving mouth, speaking, open mouth`;
            }
            
        default: 
            return visual;
    }
};

export function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function pcmToWav(samples: Int16Array, channels: number, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  const length = samples.length;
  for (let i = 0; i < length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}
