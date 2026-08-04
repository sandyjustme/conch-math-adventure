import { describe, it, expect } from "vitest";
import {
  currentTrunkNode,
  nextWorkOrder,
  planShift,
  canWorkToday,
  ordersLeftToday,
  breakdownReport,
  shouldAdvanceTrunk,
  ORDERS_PER_SHIFT,
  WAGE_PER_ORDER,
} from "./shiftPlanner";
import type { AnswerRecord } from "../types";

const rec = (nodeId: string, correct: boolean, i = 0): AnswerRecord => ({
  nodeId,
  correct,
  latencyMs: 0,
  timestamp: 1000 + i,
});

/** 造 n 条某项的记录，其中 right 条正确 */
const many = (id: string, right: number, total: number): AnswerRecord[] =>
  Array.from({ length: total }, (_, i) => rec(id, i < right, i));

describe("currentTrunkNode —— 已解锁未过关里最靠前，且不低于 K5", () => {
  it("新档案 → 从 K5 起步，不从一年级难度开始", () => {
    expect(currentTrunkNode([])).toBe("K5");
  });

  it("起点之前的节点不影响起步（K1-K4 不用先过）", () => {
    expect(currentTrunkNode(["K1", "K2"])).toBe("K5");
  });

  it("老存档接着走：掌握到 K8 → 前沿是已解锁的 K9", () => {
    const mastered = ["K1", "K3", "K5", "K6", "K7", "K8"];
    expect(currentTrunkNode(mastered)).toBe("K9");
  });

  it("掌握了 K5 → 下一个解锁前沿 K6", () => {
    expect(currentTrunkNode(["K1", "K3", "K4", "K5"])).toBe("K6");
  });
});

describe("nextWorkOrder —— 初一为主干，卡住才补小学", () => {
  it("没有数据 → 走主干起点 K5，不乱补", () => {
    const o = nextWorkOrder([], []);
    expect(o).toEqual({ kind: "trunk", target: "K5" });
  });

  it("样本不足（少于 3 条）不下结论，仍走主干", () => {
    const o = nextWorkOrder(
      [...many("K8", 0, 2)],
      ["K1", "K2", "K3", "K4", "K5", "K6", "K7"]
    );
    expect(o.kind).toBe("trunk");
  });

  it("主干做得还行 → 继续主干", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const o = nextWorkOrder(many("K8", 8, 10), mastered);
    expect(o).toEqual({ kind: "trunk", target: "K8" });
  });

  it("主干卡住 → 按映射转到最浅的那一层小学内容", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const o = nextWorkOrder(many("K8", 1, 10), mastered);
    // K8 的补漏路径是 F1 F3 F4 F5 F6，最浅的是 F1
    expect(o).toEqual({ kind: "elementary", target: "F1", forNode: "K8" });
  });

  it("浅的那层补过关了 → 自动前进到下一层", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const records = [
      ...many("K8", 1, 10), // 主干仍卡
      ...many("F1", 5, 5), // F1 过关
      ...many("F3", 5, 5), // F3 过关
    ];
    expect(nextWorkOrder(records, mastered)).toEqual({
      kind: "elementary",
      target: "F4",
      forNode: "K8",
    });
  });

  it("整条补漏路径都过关 → 回主干，不无限补", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const records = [
      ...many("K8", 1, 10),
      ...["F1", "F3", "F4", "F5", "F6"].flatMap((s) => many(s, 5, 5)),
    ];
    expect(nextWorkOrder(records, mastered)).toEqual({
      kind: "trunk",
      target: "K8",
    });
  });

  it("没有映射的节点卡住了也不误转（宁可不补，不路由到不存在的内容）", () => {
    // K9 加法运算律在 elementaryMap 里没有映射
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8"];
    const o = nextWorkOrder(many("K9", 0, 10), mastered);
    expect(o).toEqual({ kind: "trunk", target: "K9" });
  });
});

describe("shouldAdvanceTrunk —— 主干推进（隐形摸底的爬升机制）", () => {
  it("一张全对的工单（4 条首试全对）就前进", () => {
    expect(shouldAdvanceTrunk(many("K1", 4, 4), "K1")).toBe(true);
  });

  it("最近 4 条对 3 条也前进", () => {
    const recs = [
      rec("K1", false, 0),
      ...many("K1", 3, 3).map((r, i) => ({ ...r, timestamp: 2000 + i })),
    ];
    expect(shouldAdvanceTrunk(recs, "K1")).toBe(true);
  });

  it("对一半不前进", () => {
    expect(shouldAdvanceTrunk(many("K1", 2, 4), "K1")).toBe(false);
  });

  it("样本不足 4 条不前进 —— 不凭一两题就下结论", () => {
    expect(shouldAdvanceTrunk(many("K1", 3, 3), "K1")).toBe(false);
  });

  it("只看最近 4 条：早年错一片、最近连对 → 前进", () => {
    const recs = [
      ...many("K1", 0, 8),
      ...many("K1", 4, 4).map((r, i) => ({ ...r, timestamp: 9000 + i })),
    ];
    expect(shouldAdvanceTrunk(recs, "K1")).toBe(true);
  });
});

describe("正确率窗口 —— 补漏之后要能翻身", () => {
  it("K8 先错 10 次、补完分数回来最近连对 6 次 → 不再判卡住", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const records = [
      ...many("K8", 0, 10), // 历史全错
      ...many("K8", 6, 6).map((r, i) => ({ ...r, timestamp: 9000 + i })), // 最近全对
    ];
    // 全量算 6/16=0.38 会永远卡住；窗口只看最近 6 条 → 1.0 → 走主干
    expect(nextWorkOrder(records, mastered)).toEqual({
      kind: "trunk",
      target: "K8",
    });
  });
});

describe("固定工资 —— 与正确率无关，工资不许当评价用", () => {
  it("工资表是常量且三项都为正", () => {
    expect(WAGE_PER_ORDER.pearls).toBeGreaterThan(0);
    expect(WAGE_PER_ORDER.fragments).toBeGreaterThan(0);
    expect(WAGE_PER_ORDER.playTokens).toBeGreaterThan(0);
  });
});

describe("planShift", () => {
  it("默认排满一班", () => {
    expect(planShift([], [])).toHaveLength(ORDERS_PER_SHIFT);
  });

  it("可以指定张数", () => {
    expect(planShift([], [], 1)).toHaveLength(1);
  });
});

describe("打烊 —— 做完当天不再发工资", () => {
  it("新的一天可以开工", () => {
    expect(canWorkToday("2026-08-01", 3, "2026-08-02")).toBe(true);
    expect(ordersLeftToday("2026-08-01", 3, "2026-08-02")).toBe(
      ORDERS_PER_SHIFT
    );
  });

  it("今天还没做满 → 可以继续", () => {
    expect(canWorkToday("2026-08-02", 1, "2026-08-02")).toBe(true);
    expect(ordersLeftToday("2026-08-02", 1, "2026-08-02")).toBe(2);
  });

  it("今天做满 3 张 → 打烊，再点也不发", () => {
    expect(canWorkToday("2026-08-02", 3, "2026-08-02")).toBe(false);
    expect(ordersLeftToday("2026-08-02", 3, "2026-08-02")).toBe(0);
  });

  it("超额也不会算出负数", () => {
    expect(ordersLeftToday("2026-08-02", 99, "2026-08-02")).toBe(0);
  });
});

describe("breakdownReport —— 只给家长看板", () => {
  it("卡在 K8 且正在补 F1 时如实报告", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const r = breakdownReport(many("K8", 1, 10), mastered);
    expect(r.trunkNode).toBe("K8");
    expect(r.trunkStuck).toBe(true);
    expect(r.remediating).toBe("F1");
    expect(r.path.map((p) => p.skill)).toEqual(["F1", "F3", "F4", "F5", "F6"]);
  });

  it("主干没卡住时不报补漏", () => {
    const r = breakdownReport(many("K8", 9, 10), [
      "K1",
      "K2",
      "K3",
      "K4",
      "K5",
      "K6",
      "K7",
    ]);
    expect(r.trunkStuck).toBe(false);
    expect(r.remediating).toBeNull();
  });

  it("补漏路径按由浅到深排序", () => {
    const mastered = ["K1", "K2", "K3", "K4", "K5", "K6", "K7"];
    const r = breakdownReport(many("K8", 0, 10), mastered);
    const idx = r.path.map((p) =>
      ["F1", "F2", "F3", "F4", "F5", "F6", "F7"].indexOf(p.skill)
    );
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
});
