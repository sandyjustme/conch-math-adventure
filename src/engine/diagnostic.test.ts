import { describe, it, expect } from "vitest";
import {
  runDiagnostic,
  getNodeMastery,
  getAllDependencies,
} from "./diagnostic";
import { DIAGNOSIS_ENTRY, NODE_MAP } from "../data/knowledgeGraph";
import type { AnswerRecord } from "../types";

const rec = (
  nodeId: string,
  correct: boolean,
  timestamp: number
): AnswerRecord => ({
  nodeId,
  correct,
  latencyMs: 1000,
  timestamp,
});

describe("runDiagnostic 倒查断点", () => {
  it("无记录时停在入口节点", () => {
    const result = runDiagnostic([]);
    expect(result.nodeId).toBe(DIAGNOSIS_ENTRY);
    expect(result.trace).toEqual([DIAGNOSIS_ENTRY]);
  });

  it("入口连续答错时沿依赖链回溯", () => {
    const records = [
      rec(DIAGNOSIS_ENTRY, false, 1),
      rec(DIAGNOSIS_ENTRY, false, 2),
      rec(DIAGNOSIS_ENTRY, false, 3),
    ];
    const result = runDiagnostic(records);
    expect(result.nodeId).not.toBe(DIAGNOSIS_ENTRY);
    expect(result.trace[0]).toBe(DIAGNOSIS_ENTRY);
    expect(result.trace.length).toBeGreaterThan(1);
    // 回溯到的必须是图里真实存在的节点
    expect(NODE_MAP.has(result.nodeId)).toBe(true);
  });

  it("入口答得好就不回溯", () => {
    const records = [
      rec(DIAGNOSIS_ENTRY, true, 1),
      rec(DIAGNOSIS_ENTRY, true, 2),
    ];
    const result = runDiagnostic(records);
    expect(result.nodeId).toBe(DIAGNOSIS_ENTRY);
    expect(result.confidence).toBe(1);
  });
});

describe("getNodeMastery", () => {
  it("无记录为 0", () => {
    expect(getNodeMastery("K8", [])).toBe(0);
  });

  it("正确率计算", () => {
    const records = [
      rec("K8", true, 1),
      rec("K8", true, 2),
      rec("K8", false, 3),
      rec("K5", true, 4),
    ];
    expect(getNodeMastery("K8", records)).toBeCloseTo(2 / 3);
  });
});

describe("getAllDependencies", () => {
  it("入口节点的依赖闭包非空且无重复", () => {
    const deps = getAllDependencies(DIAGNOSIS_ENTRY);
    expect(deps.length).toBeGreaterThan(0);
    expect(new Set(deps).size).toBe(deps.length);
    expect(deps).not.toContain(DIAGNOSIS_ENTRY);
  });

  it("根节点（K1）无依赖", () => {
    expect(getAllDependencies("K1")).toEqual([]);
  });
});
