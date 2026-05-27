import type { YouTubeVideo } from "../types.js";

export class GroundingService {
  async verifyCitation(claim: string, videos: YouTubeVideo[]): Promise<{ isGrounded: boolean; accuracy: number }> {
    const found = videos.some(
      (v) =>
        v.title.toLowerCase().includes(claim.toLowerCase()) ||
        v.description.toLowerCase().includes(claim.toLowerCase())
    );
    return { isGrounded: found, accuracy: found ? 0.95 : 0.0 };
  }

  async groundAnswerInVideos(answer: string, videos: YouTubeVideo[]): Promise<number> {
    const sentences = answer.split(".").filter((s) => s.trim());
    let groundedCount = 0;
    for (const sentence of sentences) {
      const result = await this.verifyCitation(sentence, videos);
      if (result.isGrounded) groundedCount++;
    }
    return sentences.length > 0 ? groundedCount / sentences.length : 0;
  }
}

export default GroundingService;
