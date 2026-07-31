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

describe("computeLevelReward", () => {
  it("满血 + 从探险跳转 + 今日已过1关 → 1×1.5×1.0 = 1 碎片", () => {
    expect(computeLevelReward(0, true, 1)).toEqual({
      fragments: 1,
      pearls: 1,
      playTokens: 2,
    });
  });

  it("今日未探险 → 全局倍率 0.5，1×1.5×0.5=0.75 → 取整 0，三样都不发", () => {
    expect(computeLevelReward(0, true, 0)).toEqual({
      fragments: 0,
      pearls: 0,
      playTokens: 0,
    });
  });

  it("答错 5 次 → 过关 0 碎片且无珍珠无次数", () => {
    expect(computeLevelReward(5, true, 3)).toEqual({
      fragments: 0,
      pearls: 0,
      playTokens: 0,
    });
  });

  it("错 2 次 + 跳转加成 + 过2关 → 0.6×1.5×1.3=1.17 → 1 碎片", () => {
    expect(computeLevelReward(2, true, 2).fragments).toBe(1);
  });

  it("碎片 >0 时固定 +1 珍珠 +2 次数", () => {
    const r = computeLevelReward(0, false, 2);
    expect(r.fragments).toBe(1); // 1×1.0×1.3 = 1.3 → 1
    expect(r.pearls).toBe(1);
    expect(r.playTokens).toBe(2);
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
