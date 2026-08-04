import { describe, it, expect } from "vitest";
import {
  judgeStep,
  baseFragments,
  computeLevelReward,
  getDiveTasks,
} from "./diveMathEngine";
import { ALL_TASKS } from "../data/diveTasks";

describe("judgeStep", () => {
  it("落点等于目标值 → 答对", () => {
    expect(judgeStep({ from: 0, to: -3 }, -3)).toEqual({
      correct: true,
      hintDir: null,
    });
  });

  it("答错 → 只透露方向：目标在上方给 up", () => {
    expect(judgeStep({ from: 0, to: 4 }, 1)).toEqual({
      correct: false,
      hintDir: "up",
    });
  });

  it("答错 → 目标在下方给 down", () => {
    expect(judgeStep({ from: 2, to: -5 }, 0)).toEqual({
      correct: false,
      hintDir: "down",
    });
  });
});

describe("baseFragments", () => {
  it("0 错 = 1，每错 1 次扣 0.2，5 次扣到 0，不为负", () => {
    expect(baseFragments(0)).toBe(1);
    expect(baseFragments(1)).toBeCloseTo(0.8);
    expect(baseFragments(4)).toBeCloseTo(0.2);
    expect(baseFragments(5)).toBe(0);
    expect(baseFragments(9)).toBe(0);
  });
});

describe("computeLevelReward —— 通关必有产出，绝不归零", () => {
  // 原规则「算出来 ≤0 就三样全不发」制造了两条反向激励，
  // 正是「做了很多题却什么都没有」的直接来源。
  it("答错 5 次，通关照样有保底", () => {
    const r = computeLevelReward(5, true, 3);
    expect(r.fragments).toBeGreaterThan(0);
    expect(r.pearls).toBeGreaterThan(0);
    expect(r.playTokens).toBeGreaterThan(0);
  });

  it("今日还没去探险（倍率 0.5）也有保底", () => {
    const r = computeLevelReward(0, true, 0);
    expect(r.fragments).toBeGreaterThan(0);
    expect(r.pearls).toBeGreaterThan(0);
    expect(r.playTokens).toBeGreaterThan(0);
  });

  it("零失误多给 1 珍珠", () => {
    expect(computeLevelReward(0, true, 1).pearls).toBe(2);
    expect(computeLevelReward(2, true, 1).pearls).toBe(1);
  });

  it("错 0–1 次多给 1 次游戏", () => {
    expect(computeLevelReward(1, true, 1).playTokens).toBe(2);
    expect(computeLevelReward(2, true, 1).playTokens).toBe(1);
  });

  it("答得越好碎片越多", () => {
    expect(computeLevelReward(0, true, 3).fragments).toBeGreaterThan(
      computeLevelReward(5, true, 3).fragments
    );
  });
});

describe("getDiveTasks", () => {
  it("无聚焦返回全部题目", () => {
    expect(getDiveTasks(null)).toHaveLength(ALL_TASKS.length);
  });

  it("聚焦时只返回该知识点的题", () => {
    const node = ALL_TASKS[0].node;
    const filtered = getDiveTasks(node);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.node === node)).toBe(true);
  });

  it("聚焦到不存在的知识点返回空数组", () => {
    expect(getDiveTasks("K999")).toHaveLength(0);
  });
});
