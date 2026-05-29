export interface ShotItem {
  timestamp: string;
  visualDescription: string;
  audioVoiceoverLine: string;
}

export class ShotListGenerator {
  generateShotList(hook: string, body: string): ShotItem[] {
    return [
      {
        timestamp: "0:00-0:03",
        visualDescription: "Sofia smiling, ocean background with spa logo overlay",
        audioVoiceoverLine: hook
      },
      {
        timestamp: "0:03-0:15",
        visualDescription: "Close-up of premium treatment spa massage room and ocean view",
        audioVoiceoverLine: body
      }
    ];
  }
}
