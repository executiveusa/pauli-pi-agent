export interface UGCProfile {
  characterId: string;
  name: string;
  niche: string;
  avatarPersonaDescription: string;
  voiceStyleId: string;
  toneOfVoice: string[];
}

export const VALLARTA_CONCIERGE_CHARACTER: UGCProfile = {
  characterId: "char-pv-01",
  name: "Sofia",
  niche: "Luxury travel & spa concierge",
  avatarPersonaDescription: "Bilingual, polished, friendly, local expert on Puerto Vallarta hidden gems",
  voiceStyleId: "voice-sofia-bilingual-01",
  toneOfVoice: ["elegant", "warm", "insightful", "hospitable"]
};
