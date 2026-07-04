import type { RawSignal, ScoredSignal } from "../types.js";

const detectHookType = (title: string, description: string): ScoredSignal["hookType"] => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.match(/\?|how|why|what|when|who/)) return "question";
  if (text.match(/secret|shocking|nobody|never|always|stop|warning/)) return "shock";
  if (text.match(/i (was|did|made|lost|found|went)|story|told me|happened/)) return "story";
  if (text.match(/^\d|#\d|\d things|\d ways|\d tips|step \d/)) return "list";
  if (text.match(/how to|will help|you can|get|learn|master|achieve/)) return "promise";
  return "unknown";
};

export const scoreSignal = (signal: RawSignal, previousRankMap: Map<string, number>): ScoredSignal => {
  const totalInteractions = signal.likes + signal.comments + signal.shares + (signal.saves ?? 0);
  const engagementRate = signal.views > 0 ? totalInteractions / signal.views : 0;

  // Viral score: weighted blend of engagement rate, saves (high intent), and recency
  const saveWeight = signal.saves ? (signal.saves / signal.views) * 3 : 0;
  const shareWeight = (signal.shares / signal.views) * 2;
  const recencyMs = Date.now() - new Date(signal.publishedAt).getTime();
  const recencyBoost = Math.max(0, 1 - recencyMs / (48 * 60 * 60 * 1000)); // decays over 48h
  const viralScore = (engagementRate + saveWeight + shareWeight) * (1 + recencyBoost);

  const previousRank = previousRankMap.get(signal.id);

  return {
    ...signal,
    engagementRate,
    viralScore,
    hookType: detectHookType(signal.title, signal.description),
    isRising: previousRank !== undefined && previousRank > 10, // was outside top 10 last cycle
    rankThisCycle: 0, // set by caller after sorting
    rankLastCycle: previousRank,
  };
};

export const rankSignals = (
  signals: RawSignal[],
  previousRankMap: Map<string, number> = new Map(),
): ScoredSignal[] => {
  const scored = signals.map((s) => scoreSignal(s, previousRankMap));
  scored.sort((a, b) => b.viralScore - a.viralScore);
  return scored.map((s, i) => ({ ...s, rankThisCycle: i + 1 }));
};
