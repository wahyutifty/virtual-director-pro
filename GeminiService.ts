
import { GoogleGenAI, Schema, Type, Modality } from "@google/genai";
import { AppInputs, CreativePlanResponse, FileData } from "../types";
import { CONTENT_STYLES, STYLE_MAPPING } from "../constants";

const MODEL_PLANNING = "gemini-3-pro-preview";
const MODEL_IMAGE_LITE = "gemini-2.5-flash-image";
const MODEL_IMAGE_PRO = "gemini-3-pro-image-preview";
const MODEL_VIDEO = "veo-3.1-fast-generate-preview";
const MODEL_TTS = "gemini-2.5-flash-preview-tts";

export class GeminiService {
  private static getClient(apiKey: string) {
    return new GoogleGenAI({ apiKey });
  }

  private static buildCreativePlanPayload(style: string, lang: string, description: string, scriptStyle: string, fileCount: number, inputs: AppInputs) {
    const shots = fileCount || 5;
    const imageQualityPrompt = "8k resolution, photorealistic, cinematic lighting, high fidelity, 35mm lens";
    const mappedStyle = STYLE_MAPPING[style] || 'direct';
    let useGoogleSearch = false;

    let userQuery = `Buat konten: ${description}. Gaya: ${style}. Bahasa: ${lang}. Tone: ${scriptStyle}. Jumlah Shot: ${shots}.`;
    if (inputs.modelPrompt) userQuery += `\nModel Deskripsi: "${inputs.modelPrompt}"`;
    if (inputs.backgroundPrompt) userQuery += `\nBackground Deskripsi: "${inputs.backgroundPrompt}"`;

    let grokLogic = "";
    const audioType = inputs.audioType || 'dubbing'; 

    if (audioType === 'lipsync') {
        grokLogic = `2. **Grok (LIP SYNC MODE)**: 
           - JIKA shot menampilkan wajah model, tambahkan: "...model berbicara: [Kutip Naskah Shot Ini]"
           - Tambahkan "--negative_prompt mouth closed, silence, no talking, ..."`;
    } else if (audioType === 'dubbing') {
        grokLogic = `2. **Grok (DUBBING/VOICEOVER MODE)**: 
           - JANGAN PERNAH menyuruh model berbicara/lip sync.
           - FOKUS pada gerakan/aksi/ekspresi (smiling, nodding, pointing), tapi DALAM MODE VOICE OVER (Tanpa Lip Sync).
           - Jika ada instruksi suara, gunakan: "Narator berbicara: [Kutip Naskah]" (Agar Grok generate audio tanpa lip sync).
           - Tambahkan "--negative_prompt talking, speaking, moving mouth, ..."`;
    } else {
        grokLogic = `2. **Grok (NO AUDIO MODE)**: 
           - Fokus murni visual estetik dan gerakan kamera.
           - JANGAN ada instruksi bicara atau script.`;
    }

    const baseSystemInstruction = `
        Anda adalah AI Creative Director. Tugas Anda adalah membuat rencana konten (storyboard) untuk affiliate marketing.
        
        ATURAN UTAMA (VISUAL CONSISTENCY IS KING):
        1.  **ANALISIS:** Lihat 'Foto Model'. Ikuti VISUAL FOTO MODEL 100%.
        2.  **PENGULANGAN:** Salin-tempel deskripsi visual karakter ke SETIAP prompt.
        3.  **STRUKTUR PROMPT:** "[Karakter] wearing [Pakaian] in [Lokasi], [Action], [Angle], [Lighting]."
        
        RUMUS PROMPT KHUSUS PLATFORM:
        1. **Dreamina**: [Visual Only].
        ${grokLogic}

        ATURAN OUTPUT JSON:
        Struktur: { "tiktokScript": "...", "shotScripts": ["...", "..."], "shotPrompts": ["...", "..."], "tiktokMetadata": { "keywords": ["...", "..."], "description": "..." }, "consistency_profile": "..." }
    `;

    let systemInstruction = baseSystemInstruction;

    switch (mappedStyle) {
        case 'professional_ads':
             systemInstruction = `${baseSystemInstruction} GAYA: PROFESSIONAL ADS.`;
            break;
        case 'direct':
        case 'quick_review':
            systemInstruction = `${baseSystemInstruction} GAYA: UGC REVIEW.`;
            break;
        default:
            systemInstruction = `${baseSystemInstruction} GAYA: ${style.toUpperCase()}.`;
    }

    return { systemInstruction, userQuery, useGoogleSearch };
  }

  static async getCreativePlan(
    apiKey: string,
    style: string,
    inputs: AppInputs,
    topic: string,
    language: string,
    scriptStyle: string
  ): Promise<CreativePlanResponse> {
    const ai = this.getClient(apiKey);
    let fileCount = 5;
    if (style === 'treadmill') fileCount = inputs.outfitImages.filter(x => x).length || 5;
    if (style === 'realestate') fileCount = inputs.locationImages.filter(x => x).length || 5;

    const { systemInstruction, userQuery, useGoogleSearch } = this.buildCreativePlanPayload(style, language, topic, scriptStyle, fileCount, inputs);

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        tiktokScript: { type: Type.STRING },
        shotPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
        shotScripts: { type: Type.ARRAY, items: { type: Type.STRING } },
        consistency_profile: { type: Type.STRING },
        tiktokMetadata: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        platformPrompts: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT,
             properties: {
               dreamina: { type: Type.STRING },
               grok: { type: Type.STRING },
               meta: { type: Type.STRING }
             }
           }
        }
      },
      required: ["tiktokScript", "shotPrompts", "shotScripts", "consistency_profile"]
    };

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      systemInstruction: systemInstruction,
    };
    
    if (useGoogleSearch) {
        config.tools = [{googleSearch: {}}];
    }

    const response = await ai.models.generateContent({
      model: MODEL_PLANNING,
      contents: { parts: [{ text: userQuery }] },
      config: config
    });

    try {
        return JSON.parse(response.text!) as CreativePlanResponse;
    } catch (e) {
        return JSON.parse(response.text!.replace(/```json|```/g, "").trim());
    }
  }

  static async generateImage(
    apiKey: string,
    prompt: string,
    referenceImages: (FileData | string)[],
    config: {
      style: string;
      consistencyProfile: string;
      isHighQuality?: boolean;
    }
  ): Promise<string> {
    const ai = this.getClient(apiKey);
    const modelName = config.isHighQuality ? MODEL_IMAGE_PRO : MODEL_IMAGE_LITE;
    
    const strongPrompt = `
      TUGAS: RENDER VISUAL PRODUK/MODEL.
      GAYA: ${config.style.toUpperCase()}, REALISTIS, 8K.
      KONSISTENSI: ${config.consistencyProfile}
      AKSI: ${prompt}
      (Photorealistic, high fidelity)
    `;

    const imageParts: any[] = referenceImages.map(ref => {
      if (typeof ref !== 'string') {
        return { inlineData: { mimeType: ref.mimeType, data: ref.data } };
      }
      return null;
    }).filter(p => p !== null);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: strongPrompt }, ...imageParts] },
      config: config.isHighQuality ? { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } } : undefined
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    throw new Error("Gagal render gambar.");
  }

  static async generateVideo(
    apiKey: string,
    prompt: string,
    imageBytes?: string,
    mimeType?: string
  ): Promise<string> {
    const ai = this.getClient(apiKey);
    
    let operation = await ai.models.generateVideos({
      model: MODEL_VIDEO,
      prompt: `${prompt}, cinematic movement, high quality`,
      image: imageBytes ? {
        imageBytes: imageBytes,
        mimeType: mimeType || 'image/png'
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Gagal generate video.");
    
    return `${downloadLink}&key=${apiKey}`;
  }

  static async generateTTS(
    apiKey: string,
    text: string,
    voiceName: string
  ): Promise<string> {
    const ai = this.getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' }
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  }
}
