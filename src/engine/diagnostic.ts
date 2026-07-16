import type { AnswerRecord } from "../types";
import { NODES, NODE_MAP, DIAGNOSIS_ENTRY } from "../data/knowledgeGraph";
import { MAX_CONSECUTIVE_FAILURES } from "../data/gameConfig";

export interface DiagnosticResult {
  nodeId: string;
  confidence: number;
  trace: string[];
}

export function runDiagnostic(
  records: AnswerRecord[],
  entryNodeId: string = DIAGNOSIS_ENTRY
): DiagnosticResult {
  const trace: string[] = [];
  let currentId = entryNodeId;
  let confidence = 1.0;

  while (true) {
    trace.push(currentId);
    const nodeRecords = records.filter((r) => r.nodeId === currentId);

    if (nodeRecords.length === 0) {
      break;
    }

    const recentFailures = countRecentFailures(nodeRecords, 3);

    if (recentFailures >= MAX_CONSECUTIVE_FAILURES) {
      const node = NODE_MAP.get(currentId);
      if (!node || node.dependencies.length === 0) {
        confidence = 0.5;
        break;
      }

      const weakestDep = findWeakestDependency(node.dependencies, records);
      if (!weakestDep) {
        confidence = 0.4;
        break;
      }

      currentId = weakestDep;
      confidence = Math.max(0.3, confidence - 0.2);
    } else {
      break;
    }
  }

  return { nodeId: currentId, confidence: Math.min(1, confidence), trace };
}

function countRecentFailures(records: AnswerRecord[], count: number): number {
  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);
  let failures = 0;
  for (let i = 0; i < Math.min(count, sorted.length); i++) {
    if (!sorted[i].correct) failures++;
  }
  return failures;
}

function findWeakestDependency(
  depIds: string[],
  records: AnswerRecord[]
): string | null {
  let weakest: string | null = null;
  let lowestAccuracy = Infinity;

  for (const depId of depIds) {
    const depRecords = records.filter((r) => r.nodeId === depId);
    if (depRecords.length === 0) {
      return depId;
    }
    const accuracy =
      depRecords.filter((r) => r.correct).length / depRecords.length;
    if (accuracy < lowestAccuracy) {
      lowestAccuracy = accuracy;
      weakest = depId;
    }
  }

  if (lowestAccuracy < 0.7 && weakest) return weakest;

  const node = NODE_MAP.get(depIds[0]);
  if (node && node.elementaryDeps.length > 0 && lowestAccuracy < 0.8) {
    return weakest;
  }

  return lowestAccuracy < 0.6 ? weakest : null;
}

export function getNodeMastery(
  nodeId: string,
  records: AnswerRecord[]
): number {
  const nodeRecords = records.filter((r) => r.nodeId === nodeId);
  if (nodeRecords.length === 0) return 0;
  return nodeRecords.filter((r) => r.correct).length / nodeRecords.length;
}

export function getAllDependencies(nodeId: string): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = NODE_MAP.get(id);
    if (!node) return;
    for (const dep of node.dependencies) {
      result.push(dep);
      walk(dep);
    }
  }

  walk(nodeId);
  return [...new Set(result)];
}

export function getDependentNodes(nodeId: string): string[] {
  return NODES.filter((n) => n.dependencies.includes(nodeId)).map((n) => n.id);
}
