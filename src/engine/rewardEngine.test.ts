import { describe, it, expect } from "vitest";
import {
  evaluateAnswer,
  canRedeem,
  getPearlsToNextRedeem,
  fragmentsToPearls,
  shouldMarkBreakthrough,
} from "./rewardEngine";
import type { AnswerRecord } from "../types";

const rec = (correct: boolean, nodeId = "K8", timestamp = 0): AnswerRecord => ({
  nodeId,
  correct,
  latencyMs: 1000,
  timestamp,
});

describe("evaluateAnswer", () => {
  it("答错无奖励", () => {
    expect(evaluateAnswer(false, true, 5)).toEqual({
      pearls: 0,
      fragments: 0,
      reason: "",
    });
  });

  it("突破给 1 珍珠", () => {
    expect(evaluateAnswer(true, true, 0).pearls).toBe(1);
  });

  it("连对 3 次给 1 碎片", () => {
    expect(evaluateAnswer(true, false, 3).fragments).toBe(1);
  });

  it("普通答对无奖励（不滥发）", () => {
    expect(evaluateAnswer(true, false, 1)).toEqual({
      pearls: 0,
      fragments: 0,
      reason: "",
    });
  });
});

describe("兑换与换算", () => {
  it("满 5 珍珠可兑换", () => {
    expect(canRedeem(4)).toBe(false);
    expect(canRedeem(5)).toBe(true);
  });

  it("距下次兑换的珍珠数", () => {
    expect(getPearlsToNextRedeem(3)).toBe(2);
  });

  it("10 碎片 = 1 珍珠，余数保留", () => {
    expect(fragmentsToPearls(23)).toEqual({ pearls: 2, leftover: 3 });
    expect(fragmentsToPearls(0)).toEqual({ pearls: 0, leftover: 0 });
  });
});

describe("shouldMarkBreakthrough", () => {
  it("记录不足 2 条不算突破", () => {
    expect(shouldMarkBreakthrough([rec(true)], "K8")).toBe(false);
  });

  it("先错后对是突破", () => {
    const records = [
      rec(false, "K8", 1),
      rec(false, "K8", 2),
      rec(true, "K8", 3),
    ];
    expect(shouldMarkBreakthrough(records, "K8")).toBe(true);
  });

  it("一直答对不算突破", () => {
    const records = [
      rec(true, "K8", 1),
      rec(true, "K8", 2),
      rec(true, "K8", 3),
    ];
    expect(shouldMarkBreakthrough(records, "K8")).toBe(false);
  });
});
