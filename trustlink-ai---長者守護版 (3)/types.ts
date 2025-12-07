export enum AppView {
  HOME = 'HOME',
  FAMILY = 'FAMILY',
  PRIVACY = 'PRIVACY',
  VOICE_ID = 'VOICE_ID'
}

export enum ThreatType {
  SAFE = 'SAFE',
  UNKNOWN = 'UNKNOWN',
  SCAM_CONTENT = 'SCAM_CONTENT',
  DEEPFAKE = 'DEEPFAKE',
  BOTH = 'BOTH'
}

export interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  advice: string;
  isDeepfakeSuspected?: boolean; // New: Detect AI voice
  threatType: ThreatType;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  photoColor: string;
  hasVoiceID: boolean; // New: Has voice fingerprint been trained?
  securityFact?: string; // New: User-defined secret fact for Voice Password
}

export interface PrivacySettings {
  offlineMode: boolean;
  dataCollection: boolean;
}

export interface VerificationQuestion {
  question: string;
  answerContext: string;
}