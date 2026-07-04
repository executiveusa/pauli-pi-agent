import type { Geo, Platform, RawSignal } from "../types.js";

/**
 * Platform scrapers pull public trending/explore data.
 * These call public web endpoints — no auth required for basic trending.
 * For production, replace with official API clients where available.
 */

interface ScraperConfig {
  platform: Platform;
  geo: Geo;
  maxResults: number;
}

// Placeholder scraper that generates realistic mock data for dev/test
// In production, replace each stub with the actual platform API call
const mockScrape = (config: ScraperConfig): RawSignal[] => {
  const hookTypes = ["question", "shock", "story", "list", "promise"];
  const formats = ["talking-head", "b-roll", "text-overlay", "carousel"] as const;
  const tones = ["inspiring", "funny", "shocking", "informative"] as const;

  return Array.from({ length: config.maxResults }, (_, i) => {
    const views = Math.floor(Math.random() * 2_000_000) + 10_000;
    const engRate = Math.random() * 0.15;
    return {
      id: `${config.platform}-${config.geo}-${Date.now()}-${i}`,
      platform: config.platform,
      geo: config.geo,
      url: `https://${config.platform}.com/trending/${i}`,
      title: `Trending ${config.platform} post #${i + 1} for ${config.geo.toUpperCase()} market`,
      description: `High-performing ${hookTypes[i % hookTypes.length]} hook content`,
      views,
      likes: Math.floor(views * engRate * 0.6),
      comments: Math.floor(views * engRate * 0.2),
      shares: Math.floor(views * engRate * 0.15),
      saves: Math.floor(views * engRate * 0.05),
      publishedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      hookText: `Hook text for ${hookTypes[i % hookTypes.length]} style content`,
      format: formats[i % formats.length],
      emotionalTone: tones[i % tones.length],
    };
  });
};

export const scrapePlatform = async (config: ScraperConfig): Promise<RawSignal[]> => {
  // TODO: Replace with real platform scraper per platform
  // tiktok → TikTok Research API or Apify actor
  // instagram → unofficial trending endpoint or social-data.tools
  // youtube → YouTube Data API v3 trending endpoint
  // linkedin → LinkedIn Content API (requires company page access)
  // x → X API v2 trending topics
  return mockScrape(config);
};

export const GEO_PLATFORM_MAP: Record<Geo, Platform[]> = {
  us: ["tiktok", "instagram", "youtube", "linkedin"],
  mx: ["instagram", "tiktok", "youtube"],
  rs: ["linkedin", "instagram", "youtube"],
  in: ["youtube", "instagram"],
  global: ["tiktok", "youtube"],
};
