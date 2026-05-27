export interface VoiceSynthesisConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  styleExaggeration: number;
  speakingRate: number;
}

export const SOFIA_VOICE_CONFIG: VoiceSynthesisConfig = {
  voiceId: "voice-sofia-bilingual-01",
  stability: 0.75,
  similarityBoost: 0.85,
  styleExaggeration: 0.15,
  speakingRate: 0.95
};
