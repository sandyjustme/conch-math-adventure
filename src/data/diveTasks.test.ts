import { describe, it, expect } from "vitest";
import { ALL_TASKS, DIVE_MAX, DIVE_MIN, type Task } from "./diveTasks";
import { validateDiveTasks } from "../engine/validateDiveTasks";

describe("潜水算术题库", () => {
  it("所有题目通过完整校验（回归：第 32 题曾越界到 11）", () => {
    const result = validateDiveTasks();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("题库非空且每题有步骤", () => {
    expect(ALL_TASKS.length).toBeGreaterThan(0);
    for (const t of ALL_TASKS) expect(t.steps.length).toBeGreaterThan(0);
  });

  it("每题的答案（最后一步终点）都在数轴范围内", () => {
    for (const t of ALL_TASKS) {
      const answer = t.steps[t.steps.length - 1].to;
      expect(answer).toBeGreaterThanOrEqual(DIVE_MIN);
      expect(answer).toBeLessThanOrEqual(DIVE_MAX);
    }
  });
});

describe("validateDiveTasks 能抓出坏数据", () => {
  const goodTask: Task = {
    node: "K1",
    title: "测试",
    tip: "",
    startAt: 0,
    ghosts: [],
    steps: [{ from: 0, to: 3, dir: "up", dist: 3, main: "", why: "" }],
    recap: "",
  };

  it("越界位置报错", () => {
    const bad = {
      ...goodTask,
      steps: [{ ...goodTask.steps[0], to: 11, dist: 11 }],
    };
    expect(validateDiveTasks([bad]).valid).toBe(false);
  });

  it("步骤断链报错", () => {
    const bad = {
      ...goodTask,
      steps: [
        { from: 0, to: 3, dir: "up" as const, dist: 3, main: "", why: "" },
        { from: 5, to: 2, dir: "down" as const, dist: 3, main: "", why: "" },
      ],
    };
    expect(validateDiveTasks([bad]).valid).toBe(false);
  });

  it("dist 与位移不符报错", () => {
    const bad = { ...goodTask, steps: [{ ...goodTask.steps[0], dist: 5 }] };
    expect(validateDiveTasks([bad]).valid).toBe(false);
  });

  it("方向与位移方向不符报错", () => {
    const bad = {
      ...goodTask,
      steps: [{ ...goodTask.steps[0], dir: "down" as const }],
    };
    expect(validateDiveTasks([bad]).valid).toBe(false);
  });

  it("好数据通过", () => {
    expect(validateDiveTasks([goodTask]).valid).toBe(true);
  });
});
