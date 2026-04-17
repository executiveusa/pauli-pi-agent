import { google, Auth } from "googleapis";
import type { YouTubeVideo } from "../types.js";
import fs from "fs/promises";
import path from "path";

export class YouTubeClient {
  private oauth2Client: Auth.OAuth2Client;
  private youtubeApiClient: ReturnType<typeof google.youtube>;
  private tokenPath: string;

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    tokenPath = ".youtube-token.json"
  ) {
    this.tokenPath = tokenPath;
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.youtubeApiClient = google.youtube({ version: "v3", auth: this.oauth2Client });
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/youtube.readonly"],
      prompt: "consent",
    });
  }

  async exchangeCodeForToken(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    await this.saveToken(tokens);
    return tokens;
  }

  async loadToken() {
    try {
      const data = await fs.readFile(this.tokenPath, "utf-8");
      const tokens = JSON.parse(data) as Auth.Credentials;
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch {
      return null;
    }
  }

  private async saveToken(tokens: Auth.Credentials) {
    const dir = path.dirname(this.tokenPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));
  }

  async refreshTokenIfNeeded() {
    const creds = this.oauth2Client.credentials;
    if (!creds.expiry_date || creds.expiry_date < Date.now()) {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      await this.saveToken(credentials);
    }
  }

  async fetchWatchHistory(limit = 1000, resumeFromToken?: string) {
    await this.refreshTokenIfNeeded();
    const videos: Partial<YouTubeVideo>[] = [];
    let pageToken = resumeFromToken;
    let processed = 0;

    while (processed < limit) {
      const response = await this.youtubeApiClient.activities.list({
        part: ["contentDetails", "snippet"],
        home: true,
        maxResults: Math.min(50, limit - processed),
        pageToken: pageToken,
      });

      if (!response.data.items?.length) break;

      for (const activity of response.data.items) {
        if (processed >= limit) break;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const watchDetails = (activity.contentDetails as any)?.watch;
        if (watchDetails?.videoId) {
          const videoId = watchDetails.videoId as string;
          const watchedAt = new Date(activity.snippet?.publishedAt ?? Date.now());
          const metadata = await this.getVideoMetadata(videoId);
          if (metadata) {
            videos.push({ ...metadata, watchedAt, embedding: new Array(384).fill(0) });
            processed++;
          }
        }
      }

      pageToken = response.data.nextPageToken ?? undefined;
      if (!pageToken) break;
    }

    return { videos, nextPageToken: pageToken, totalProcessed: processed };
  }

  private async getVideoMetadata(videoId: string) {
    try {
      const response = await this.youtubeApiClient.videos.list({
        part: ["snippet", "contentDetails"],
        id: [videoId],
      });

      if (!response.data.items?.length) return null;
      const video = response.data.items[0];
      const snippet = video.snippet!;
      const contentDetails = video.contentDetails!;

      const durationMatch = contentDetails.duration?.match(/PT(\d+H)?(\d+M)?(\d+S)?/) ?? null;
      let durationSeconds = 0;
      if (durationMatch) {
        if (durationMatch[1]) durationSeconds += parseInt(durationMatch[1]) * 3600;
        if (durationMatch[2]) durationSeconds += parseInt(durationMatch[2]) * 60;
        if (durationMatch[3]) durationSeconds += parseInt(durationMatch[3]);
      }

      return {
        id: videoId,
        title: snippet.title ?? "Untitled",
        description: snippet.description ?? "",
        channelName: snippet.channelTitle ?? "Unknown",
        publishedAt: new Date(snippet.publishedAt ?? Date.now()),
        durationSeconds,
        thumbnailUrl: snippet.thumbnails?.default?.url ?? undefined,
        topicCategory: snippet.categoryId ?? undefined,
        importanceScore: 0.5,
        prerequisiteForVideoIds: [],
        relatedVideoIds: [],
      };
    } catch (error) {
      console.error(`Error fetching metadata for ${videoId}:`, error);
      return null;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await this.youtubeApiClient.activities.list({
        part: ["contentDetails"],
        home: true,
        maxResults: 1,
      });
      return !!response.data.items;
    } catch {
      return false;
    }
  }
}

export default YouTubeClient;
