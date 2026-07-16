// Real News + Social in the Terminal — clients for the backend's /v1/news and /v1/social
// endpoints (financial RSS + StockTwits). Replace the NB_HEADLINES/SR_POSTS mocks.
// Ported from the Cockpit (same real source). Market data only — no method.
import { hqpGet } from "./hqp";

export interface NewsHeadline {
  id: string;
  source: string;
  source_label: string;
  headline: string;
  url: string;
  impact: "Market Moving" | "High" | "Normal";
  tags: string[];
  ts: string;
}

export interface NewsResp {
  headlines: NewsHeadline[];
  n: number;
  sources_live: string[];
  source_color: Record<string, string>;
  fetched_at: string;
  source: string;
}

export interface SocialPost {
  id: number;
  author: string;
  handle: string;
  avatar: string | null;
  followers: number;
  verified: boolean;
  body: string;
  symbols: string[];
  sentiment: "Bullish" | "Bearish" | "Neutral";
  impact: "High" | "Medium" | "Low";
  ts: string;
  url: string;
  platform: string;
}

export interface SocialResp {
  posts: SocialPost[];
  n: number;
  source: string;
  offline: boolean;
  fetched_at?: string;
}

export const fetchNews = () => hqpGet<NewsResp>("/v1/news");
export const fetchSocialTrending = () => hqpGet<SocialResp>("/v1/social/trending");

export const IMPACT_COLOR: Record<string, string> = {
  "Market Moving": "#E74C3C",
  High: "#F39C12",
  Medium: "#F39C12",
  Normal: "#4A90D9",
  Low: "#5b7a99",
};

export const SENTIMENT_COLOR: Record<string, string> = {
  Bullish: "#2ECC71",
  Bearish: "#E74C3C",
  Neutral: "#7d96b3",
};
