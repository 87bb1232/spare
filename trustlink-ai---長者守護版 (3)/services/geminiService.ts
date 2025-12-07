import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysis, VerificationQuestion, ThreatType } from "../types";

const getAI = () => {
  // robust key retrieval: checks process.env first, then falls back to Vite's import.meta.env
  // @ts-ignore - Supress TS error for import.meta if not configured in tsconfig
  const apiKey = process.env.API_KEY || (import.meta && import.meta.env && import.meta.env.VITE_API_KEY);

  if (!apiKey) {
    console.error("TrustLink AI Error: API Key is missing.");
    throw new Error("API Key is missing. Please set VITE_API_KEY in your .env file.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeAudioForScam = async (base64Audio: string): Promise<RiskAnalysis> => {
  try {
    const ai = getAI();
    
    // Prompt updated for "TrustLink" requirements: Detect Deepfakes + Scams
    const prompt = `
      You are "TrustLink AI", a protective sentry for an elderly person. Listen to this 5-8 second phone call segment.
      
      Analyze for TWO threats:
      1. SCAM CONTENT: "Transfer money", "Safe account", "Kidnapped", "Win lottery", "Invest", "Bail".
      2. DEEPFAKE VOICE: Robotic tone, unnatural pauses, metallic artifacts, lack of emotion, or audio glitches common in AI synthesis.
      
      Return JSON:
      - riskLevel: "LOW" (Safe/Silence), "MEDIUM" (Suspicious tone/content), "HIGH" (Clear Scam or Deepfake artifact).
      - score: 0-100.
      - isDeepfakeSuspected: boolean (true if voice sounds synthetic).
      - threatType: One of "SAFE", "UNKNOWN", "SCAM_CONTENT", "DEEPFAKE", "BOTH".
      - advice: A VERY SIMPLE, SHORT command in Traditional Chinese. 
        Examples: "聲音似AI！" (Sounds like AI!), "馬上掛斷！" (Hang up!), "問佢密碼！" (Ask Password!).
        Max 10 chars.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'audio/wav', data: base64Audio } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            score: { type: Type.NUMBER },
            isDeepfakeSuspected: { type: Type.BOOLEAN },
            threatType: { type: Type.STRING, enum: ["SAFE", "UNKNOWN", "SCAM_CONTENT", "DEEPFAKE", "BOTH"] },
            advice: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as RiskAnalysis;
    }
    throw new Error("No response");

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      riskLevel: "LOW",
      score: 0,
      advice: "監聽中...",
      threatType: ThreatType.SAFE
    };
  }
};

// New: Voice Password / Challenge Generator
export const generateVoicePasswordChallenge = async (relation: string, fact?: string): Promise<VerificationQuestion> => {
  try {
    const ai = getAI();
    // Concept: "Voice Password" - Dynamic Q&A to verify identity
    const prompt = `
      Generate a "Voice Password" challenge for an elderly person to test a caller claiming to be their ${relation}.
      
      ${fact ? `SECRET FACT KNOWN: "${fact}". \nINSTRUCTION: You MUST create a question based on this secret fact to verify the caller knows it.` : 'INSTRUCTION: No secret fact is known. Generate a generic, safe personal question suitable for an elderly person to ask (e.g., about pets, recent meals).'}
      
      The question should be simple, natural, and in Traditional Chinese.
      
      Return JSON:
      {
        "question": "The question to ask.",
        "answerContext": "The expected answer based on the fact."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                answerContext: { type: Type.STRING }
            }
          }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as VerificationQuestion;
    }
    throw new Error("Failed");
  } catch (error) {
    console.error("Challenge Gen Error:", error);
    return {
      question: "我們家的寵物叫什麼名字？",
      answerContext: "寵物名字"
    };
  }
};