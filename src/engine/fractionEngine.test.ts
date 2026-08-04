import { describe, it, expect } from "vitest";
import {
  isEquivalent,
  judgeDrop,
  computeRoundReward,
  summarizeBySkill,
  findBreakpoint,
  statsFromRecords,
} from "./fractionEngine";
import {
  PROBE_SET,
  PRACTICE_BY_SKILL,
  SKILL_ORDER,
  TASKS_PER_ROUND,
  type FractionTask,
} from "../data/fractionTasks";

const task = (over: Partial<FractionTask> = {}): FractionTask => ({
  id: "t",
  skill: "F1",
  prompt: "拖到 1/2",
  ticks: 4,
  max: 1,
  from: null,
  answer: { n: 2, d: 4 },
  hint: "",
  ...over,
});

describe("等值分数", () => {
  it("1/2 与 3/6 等值", () => {
    expect(isEquivalent({ n: 1, d: 2 }, { n: 3, d: 6 })).toBe(true);
  });
  it("2/3 与 3/4 不等值", () => {
    expect(isEquivalent({ n: 2, d: 3 }, { n: 3, d: 4 })).toBe(false);
  });
});

describe("judgeDrop", () => {
  it("拖到等值位置算对，不因写法不同判错", () => {
    // 答案 2/4，她拖到 8 格里的第 4 格 = 1/2
    const t = task({ ticks: 8, answer: { n: 1, d: 2 } });
    expect(judgeDrop(t, 4).correct).toBe(true);
  });

  it("拖少了 → 提示往右", () => {
    const r = judgeDrop(task(), 1);
    expect(r.correct).toBe(false);
    expect(r.direction).toBe("right");
  });

  it("拖多了 → 提示往左", () => {
    const r = judgeDrop(task(), 3);
    expect(r.correct).toBe(false);
    expect(r.direction).toBe("left");
  });

  it("答错只给方向，不给答案", () => {
    expect(Object.keys(judgeDrop(task(), 0))).toEqual(["correct", "direction"]);
  });
});

describe("奖励曲线 —— 绝不归零（本次重做的核心）", () => {
  it("全错也有产出：做了十题必须比什么都没做更好", () => {
    const r = computeRoundReward(0, 10);
    expect(r.fragments).toBeGreaterThan(0);
    expect(r.pearls).toBeGreaterThan(0);
    expect(r.playTokens).toBeGreaterThan(0);
  });

  it("对得越多拿得越多", () => {
    const a = computeRoundReward(0, 10);
    const b = computeRoundReward(5, 10);
    const c = computeRoundReward(10, 10);
    expect(b.fragments).toBeGreaterThan(a.fragments);
    expect(c.fragments).toBeGreaterThan(b.fragments);
  });

  it("对满一半多给 1 珍珠", () => {
    expect(computeRoundReward(4, 10).pearls).toBe(1);
    expect(computeRoundReward(5, 10).pearls).toBe(2);
  });

  it("全对多给 1 次游戏", () => {
    expect(computeRoundReward(9, 10).playTokens).toBe(1);
    expect(computeRoundReward(10, 10).playTokens).toBe(2);
  });

  it("一题没做才是 0", () => {
    expect(computeRoundReward(0, 0)).toEqual({
      fragments: 0,
      pearls: 0,
      playTokens: 0,
    });
  });

  it("答对数超过总数时不会超发", () => {
    expect(computeRoundReward(99, 10)).toEqual(computeRoundReward(10, 10));
  });
});

describe("隐形诊断", () => {
  const mk = (skill: string, correct: boolean) => ({
    task: task({ skill: skill as FractionTask["skill"] }),
    correct,
  });

  it("按层汇总正确率", () => {
    const stats = summarizeBySkill([
      mk("F1", true),
      mk("F1", true),
      mk("F4", false),
      mk("F4", false),
    ]);
    expect(stats.find((s) => s.skill === "F1")?.accuracy).toBe(1);
    expect(stats.find((s) => s.skill === "F4")?.accuracy).toBe(0);
  });

  it("断点取由浅入深第一个不达标的层", () => {
    const stats = summarizeBySkill([
      mk("F1", true),
      mk("F3", false),
      mk("F6", false),
    ]);
    // F3 和 F6 都不达标，取更浅的 F3
    expect(findBreakpoint(stats)).toBe("F3");
  });

  it("各层都过关 → 分数不是瓶颈", () => {
    const stats = summarizeBySkill([mk("F1", true), mk("F6", true)]);
    expect(findBreakpoint(stats)).toBeNull();
  });

  it("能从持久化记录里还原（nodeId 存 F1..F7）", () => {
    const recs = [
      { nodeId: "F1", correct: true, latencyMs: 0, timestamp: 1 },
      { nodeId: "F4", correct: false, latencyMs: 0, timestamp: 2 },
      { nodeId: "K8", correct: true, latencyMs: 0, timestamp: 3 }, // 有理数的记录要被忽略
    ];
    const stats = statsFromRecords(recs);
    expect(stats.map((s) => s.skill)).toEqual(["F1", "F4"]);
    expect(findBreakpoint(stats)).toBe("F4");
  });
});

describe("题库数据完整性", () => {
  it("第一轮正好 10 题，够一个闭环", () => {
    expect(PROBE_SET).toHaveLength(TASKS_PER_ROUND);
  });

  it("第一轮横跨多层，才定位得出断点", () => {
    const skills = new Set(PROBE_SET.map((t) => t.skill));
    expect(skills.size).toBeGreaterThanOrEqual(5);
  });

  it("每一层都有针对性练习题可补", () => {
    for (const skill of SKILL_ORDER) {
      expect(PRACTICE_BY_SKILL[skill].length).toBeGreaterThan(0);
    }
  });

  it("所有题的正确答案都落在自己的刻度上", () => {
    const bad: string[] = [];
    for (const t of [
      ...PROBE_SET,
      ...Object.values(PRACTICE_BY_SKILL).flat(),
    ]) {
      // 答案必须能用 ticks 格表示（否则她拖不到）
      const tickValue = (t.answer.n / t.answer.d) * t.ticks;
      if (Math.abs(tickValue - Math.round(tickValue)) > 1e-9) {
        bad.push(
          `${t.id} 答案 ${t.answer.n}/${t.answer.d} 落不到 ${t.ticks} 格上`
        );
      }
      if (t.from) {
        const fromTick = (t.from.n / t.from.d) * t.ticks;
        if (Math.abs(fromTick - Math.round(fromTick)) > 1e-9) {
          bad.push(
            `${t.id} 起点 ${t.from.n}/${t.from.d} 落不到 ${t.ticks} 格上`
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("题面不出现考试口吻", () => {
    const bad = [...PROBE_SET, ...Object.values(PRACTICE_BY_SKILL).flat()]
      .filter((t) => /计算|答案|测试|考|第\s*\d+\s*题|请问/.test(t.prompt))
      .map((t) => t.id);
    expect(bad).toEqual([]);
  });
});
