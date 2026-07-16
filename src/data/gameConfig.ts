export const EXCHANGE_RATE = 5;
export const FRAGMENTS_PER_PEARL = 10;

export const SNEAK_INTERVALS = [
  { level: 0, label: "10分钟后", ms: 10 * 60 * 1000, reward: 1 },
  { level: 1, label: "1天后", ms: 24 * 60 * 60 * 1000, reward: 2 },
  { level: 2, label: "3天后", ms: 3 * 24 * 60 * 60 * 1000, reward: 2 },
  { level: 3, label: "7天后", ms: 7 * 24 * 60 * 60 * 1000, reward: 3 },
  { level: 4, label: "15天后", ms: 15 * 24 * 60 * 60 * 1000, reward: 4 },
  { level: 5, label: "30天后", ms: 30 * 24 * 60 * 60 * 1000, reward: 5 },
];

export const GAME_DURATION_MS = 30_000;
export const BUBBLES_PER_ROUND = 10;

export const MASTERY_THRESHOLD = 0.9;
export const CORRECT_STREAK_TO_ADVANCE = 4;
export const CORRECT_STREAK_TO_REDUCE_SCAFFOLD = 2;
export const MAX_CONSECUTIVE_FAILURES = 2;
