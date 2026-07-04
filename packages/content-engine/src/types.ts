export type Platform = "tiktok" | "instagram" | "youtube" | "linkedin" | "x";

export type Geo = "us" | "mx" | "rs" | "in" | "global";

export type Company =
  | "macs-digital"
  | "pauli-effect"
  | "kupuri-media"
  | "cheggie"
  | "myweb-lane"
  | "cascadia-atlas";

export interface RawSignal {
  id: string;
  platform: Platform;
  geo: Geo;
  url: string;
  title: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  publishedAt: string;
  scrapedAt: string;
  hookText?: string;
  format?: "talking-head" | "b-roll" | "text-overlay" | "carousel" | "audio";
  topic?: string;
  emotionalTone?: "inspiring" | "funny" | "shocking" | "informative" | "controversial";
}

export interface ScoredSignal extends RawSignal {
  engagementRate: number;
  viralScore: number;
  hookType: "question" | "shock" | "story" | "list" | "promise" | "unknown";
  isRising: boolean;
  rankThisCycle: number;
  rankLastCycle?: number;
}

export interface CompanySignalBrief {
  company: Company;
  date: string;
  geo: Geo;
  topPatterns: Array<{
    hookType: string;
    format: string;
    topic: string;
    viralScore: number;
  }>;
  readyHooks: string[];
  formatTemplates: string[];
  avoidThis: string;
  rawSignalCount: number;
}
