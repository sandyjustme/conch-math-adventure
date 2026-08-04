import { describe, it, expect } from "vitest";
import {
  fractionTasksFor,
  trunkTasksFor,
  totalTicks,
  valueAtTick,
  tickLabel,
  type LineTask,
} from "./lineTasks";
import { SKILL_ORDER } from "./fractionTasks";
import { NODES } from "./knowledgeGraph";

const wellFormed = (t: LineTask, label: string) => {
  const total = totalTicks(t);
  expect(total, `${label} 总格数`).toBeGreaterThan(0);
  expect(t.answerTick, `${label} 答案不能越界`).toBeGreaterThanOrEqual(0);
  expect(t.answerTick, `${label} 答案不能越界`).toBeLessThanOrEqual(total);
  if (t.fromTick !== null) {
    expect(t.fromTick, `${label} 起点不能越界`).toBeGreaterThanOrEqual(0);
    expect(t.fromTick, `${label} 起点不能越界`).toBeLessThanOrEqual(total);
  }
  expect(t.prompt.length, `${label} 题面`).toBeGreaterThan(4);
  expect(t.skill, `${label} 入库标识`).toBeTruthy();
};

describe("分数题转成统一格式", () => {
  it("每一层都出得出题，且格式合法", () => {
    for (const skill of SKILL_ORDER) {
      const ts = fractionTasksFor(skill, 4);
      expect(ts.length, `${skill} 出题数`).toBe(4);
      ts.forEach((t, i) => wellFormed(t, `${skill}#${i}`));
      expect(ts.every((t) => t.skill === skill)).toBe(true);
    }
  });

  it("题库不够时循环补齐，但 id 不重复", () => {
    const ts = fractionTasksFor("F5", 8); // F5 只有 2 道
    expect(ts).toHaveLength(8);
    expect(new Set(ts.map((t) => t.id)).size).toBe(8);
  });
});

describe("主干题参数化生成", () => {
  it("每个知识点都出得出题，反复跑也不越界", () => {
    for (const node of NODES) {
      for (let run = 0; run < 20; run++) {
        trunkTasksFor(node.id, 4).forEach((t, i) =>
          wellFormed(t, `${node.id}#${i}`)
        );
      }
    }
  });

  it("不会见底：连出 200 题都合法且 id 不重复", () => {
    const ts = trunkTasksFor("K8", 200);
    expect(new Set(ts.map((t) => t.id)).size).toBe(200);
    ts.forEach((t, i) => wellFormed(t, `K8#${i}`));
  });

  it("有起点的题，起点和答案不应重合（否则不用动就对了）", () => {
    for (let run = 0; run < 200; run++) {
      for (const t of trunkTasksFor("K8", 4)) {
        if (t.fromTick !== null) expect(t.answerTick).not.toBe(t.fromTick);
      }
    }
  });

  it("同一张工单 4 题句式不重样 ——「一直在做一样的题」的修复", () => {
    // 有专门变式库的节点：一张工单内题面前 6 个字互不相同
    for (const node of ["K1", "K3", "K5", "K7", "K8", "K10"]) {
      for (let run = 0; run < 10; run++) {
        const heads = trunkTasksFor(node, 3).map((t) => t.prompt.slice(0, 6));
        expect(new Set(heads).size, `${node} 三题句式重复: ${heads}`).toBe(3);
      }
    }
  });

  it("K5 相反数变式：不管哪种说法，答案都是相反数", () => {
    for (let run = 0; run < 50; run++) {
      for (const t of trunkTasksFor("K5", 4)) {
        expect(t.fromTick).not.toBeNull();
        // 起点 a 与答案 -a 关于 0（tick 6）对称
        expect(t.fromTick! + t.answerTick).toBe(12);
      }
    }
  });

  it("题面不出现考试口吻", () => {
    const all = [
      ...NODES.flatMap((n) => trunkTasksFor(n.id, 3)),
      ...SKILL_ORDER.flatMap((s) => fractionTasksFor(s, 3)),
    ];
    const bad = all.filter((t) =>
      /计算|答案|测试|考|第\s*\d+\s*题|请问/.test(t.prompt)
    );
    expect(bad.map((t) => t.prompt)).toEqual([]);
  });
});

describe("坐标换算", () => {
  it("分数线 0..1 显示成 n/d", () => {
    const t = fractionTasksFor("F1", 1)[0];
    expect(tickLabel(t, 1)).toMatch(/^1\/\d+$/);
  });

  it("整数线显示成数值，含负数", () => {
    const t = trunkTasksFor("K7", 1)[0];
    // 线是 −6..6：手机上 12 格好点，21 格会挤成一把梳子
    expect(valueAtTick(t, 0)).toBe(-6);
    expect(tickLabel(t, 0)).toBe("-6");
    expect(tickLabel(t, 6)).toBe("0");
  });

  it("整数线不超过 12 格，保证每格够大能按", () => {
    for (const node of ["K1", "K5", "K6", "K7", "K8", "K10"]) {
      const t = trunkTasksFor(node, 1)[0];
      expect(t.max - t.min, `${node} 线太长`).toBeLessThanOrEqual(12);
    }
  });
});
