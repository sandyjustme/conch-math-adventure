import type { AnswerRecord } from "../types";
import { EXCHANGE_RATE, FRAGMENTS_PER_PEARL } from "../data/gameConfig";

export interface RewardResult {
  pearls: number;
  fragments: number;
  reason: string;
}

export function evaluateAnswer(
  correct: boolean,
  isBreakthrough: boolean,
  consecutiveCorrect: number
): RewardResult {
  if (!correct) {
    return { pearls: 0, fragments: 0, reason: "" };
  }

  if (isBreakthrough) {
    return { pearls: 1, fragments: 0, reason: "真正想通了一步" };
  }

  if (consecutiveCorrect >= 3) {
    return { pearls: 0, fragments: 1, reason: "连续答对，稳步前进" };
  }

  return { pearls: 0, fragments: 0, reason: "" };
}

export function canRedeem(pearls: number): boolean {
  return pearls >= EXCHANGE_RATE;
}

export function getPearlsToNextRedeem(pearls: number): number {
  return Math.max(0, EXCHANGE_RATE - (pearls % EXCHANGE_RATE));
}

export function fragmentsToPearls(fragments: number): {
  pearls: number;
  leftover: number;
} {
  const pearls = Math.floor(fragments / FRAGMENTS_PER_PEARL);
  return { pearls, leftover: fragments % FRAGMENTS_PER_PEARL };
}

export function shouldMarkBreakthrough(
  records: AnswerRecord[],
  nodeId: string
): boolean {
  const nodeRecords = records.filter((r) => r.nodeId === nodeId);
  if (nodeRecords.length < 2) return false;

  const recent = nodeRecords[nodeRecords.length - 1];
  const previous = nodeRecords.slice(0, -1);
  const prevAccuracy =
    previous.length > 0
      ? previous.filter((r) => r.correct).length / previous.length
      : 0;

  return recent.correct && prevAccuracy < 0.5;
}

// 全局碎片倍率：基于今日探险完成数
// 第1关 → 1.0，每多过1关 → +0.3，不设上限
export function getGlobalMultiplier(todayAdventureCount: number): number {
  if (todayAdventureCount === 0) return 0.5;
  return 1.0 + (todayAdventureCount - 1) * 0.3;
}
