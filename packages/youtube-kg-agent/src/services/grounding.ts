import type { YouTubeVideo } from "../types.js";

export class GroundingService {
  async verifyCitation(
    claim: string,
    videos: YouTubeVideo[]
  ): Promise<{ isGrounded: boolean; accuracy: number }> {
    const claimWords = claim
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);

    if (!claimWords.length) return { isGrounded: false, accuracy: 0 };

    let bestScore = 0;
    for (const video of videos) {
      const corpus = `${video.title} ${video.description}`.toLowerCase();
      const matched = claimWords.filter((w) => corpus.includes(w)).length;
      const score = matched / claimWords.length;
      if (score > bestScore) bestScore = score;
    }

    return { isGrounded: bestScore > 0.2, accuracy: bestScore };
  }

  async groundAnswerInVideos(answer: string, videos: YouTubeVideo[]): Promise<number> {
    if (!videos.length) return 0;
    const sentences = answer
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
    if (!sentences.length) return 0;

    const scores = await Promise.all(
      sentences.map((s) => this.verifyCitation(s, videos))
    );
    const total = scores.reduce((sum, r) => sum + r.accuracy, 0);
    return total / scores.length;
  }
}

export default GroundingService;
