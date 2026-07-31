export interface KnowledgeNode {
  id: string;
  name: string;
  chapter: string;
  description: string;
  dependencies: string[];
  elementaryDeps: string[];
  breakpointRisk: boolean;
  hooks: string[];
  emotionalAnchors: string[];
  variants: VariantTemplate[];
}

export interface VariantTemplate {
  type: "情境变式" | "表述变式" | "逆向变式" | "缺项变式" | "干扰变式";
  template: string;
}

export interface RareShell {
  id: string;
  name: string;
  description: string;
  acquiredAt: string;
  story: string;
}

export interface SneakAttack {
  nodeId: string;
  level: number;
  nextAt: number;
  context: string;
}

export interface AnswerRecord {
  nodeId: string;
  correct: boolean;
  latencyMs: number;
  timestamp: number;
}

export interface GameScore {
  gameId: string;
  score: number;
  playedAt: string;
}

export interface Redemption {
  code: string;
  time: string;
}

/** 一集的完成记录（持久化）。无题集的 choice / correct 为 null */
export interface EpisodeRecord {
  no: number;
  choice: "A" | "B" | null;
  correct: boolean | null;
  completedAt: number;
}

export type View =
  | "drama"
  | "cafe"
  | "adventure"
  | "dive"
  | "soup"
  | "abyss"
  | "rules"
  | "games"
  | "album"
  | "redeem"
  | "map"
  | "dashboard";

export type MasteryStatus = "locked" | "unlocked" | "in_progress" | "mastered";
