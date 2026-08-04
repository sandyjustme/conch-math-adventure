import { describe, it, expect } from "vitest";
import { generateRuleQuestions } from "./rulesQuestions";
import type { AnswerRecord } from "../types";

const rec = (nodeId: string, correct: boolean): AnswerRecord => ({
  nodeId,
  correct,
  latencyMs: 0,
  timestamp: 1,
});

/** 分数断在 F4 的记录 */
const brokenAtF4 = [
  rec("F1", true),
  rec("F1", true),
  rec("F3", true),
  rec("F4", false),
  rec("F4", false),
];

/** 分数各层都过关 */
const fractionsOk = [
  rec("F1", true),
  rec("F3", true),
  rec("F4", true),
  rec("F6", true),
];

describe("generateRuleQuestions", () => {
  it("出满指定题数", () => {
    expect(generateRuleQuestions([], "K1", 5)).toHaveLength(5);
    expect(generateRuleQuestions([], "K1", 8)).toHaveLength(8);
  });

  it("correct 下标一定落在 choices 范围内（原来第 5 题就是坏在这）", () => {
    for (let run = 0; run < 200; run++) {
      for (const q of generateRuleQuestions(brokenAtF4, "K8", 5)) {
        expect(q.correct).toBeGreaterThanOrEqual(0);
        expect(q.correct).toBeLessThan(q.choices.length);
        expect(q.choices[q.correct]).toBeTruthy();
      }
    }
  });

  it("选项互不重复，不会出现两个一样的答案", () => {
    for (let run = 0; run < 300; run++) {
      for (const q of [
        ...generateRuleQuestions(brokenAtF4, "K8", 5),
        ...generateRuleQuestions(fractionsOk, "K8", 5),
      ]) {
        expect(new Set(q.choices).size).toBe(q.choices.length);
        expect(q.choices.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("每题都有题面和提示", () => {
    for (const q of generateRuleQuestions(brokenAtF4, "K8", 5)) {
      expect(q.story.length).toBeGreaterThan(5);
      expect(q.hint.length).toBeGreaterThan(2);
      expect(q.nodeId).toBeTruthy();
    }
  });

  it("分数还断着 → 出的全是分数层的题，不跳去有理数", () => {
    for (let run = 0; run < 50; run++) {
      for (const q of generateRuleQuestions(brokenAtF4, "K8", 5)) {
        expect(q.nodeId.startsWith("F")).toBe(true);
      }
    }
  });

  it("练的是断点层和它上面一层，不会乱跳", () => {
    const ids = new Set(
      generateRuleQuestions(brokenAtF4, "K8", 20).map((q) => q.nodeId)
    );
    for (const id of ids) {
      expect(["F4", "F5"]).toContain(id);
    }
  });

  it("分数过关了 → 才上有理数", () => {
    for (const q of generateRuleQuestions(fractionsOk, "K8", 5)) {
      expect(q.nodeId).toBe("K8");
    }
  });

  it("题面不是裸算式，裹在守则情境里", () => {
    const qs = generateRuleQuestions(brokenAtF4, "K8", 5);
    expect(
      qs.every((q) => /守则|走廊|门|电梯|广播|层|镜子/.test(q.story))
    ).toBe(true);
  });

  it("不再是清一色的「谁更大」", () => {
    const stories = generateRuleQuestions(fractionsOk, "K8", 30).map(
      (q) => q.story
    );
    const onlyCompare = stories.every((s) => s.includes("谁更大"));
    expect(onlyCompare).toBe(false);
  });
});
