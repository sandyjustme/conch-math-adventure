import type { AnswerRecord, Redemption } from "../types";

/** 六维评分 */
export interface RadarScores {
  mastery: number; // 掌握度
  interest: number; // 兴趣度
  persistence: number; // 坚持度
  autonomy: number; // 自主度
  transfer: number; // 迁移度
  emotion: number; // 情绪度
}

/** 汇总数据 */
export interface Analytics {
  radar: RadarScores;
  totalAnswers: number;
  accuracy: number;
  masteredCount: number;
  totalNodes: number;
  consecutiveDays: number;
  totalDays: number;
  pearls: number;
  fragments: number;
  redemptions: Redemption[];
  weakestNode: string;
  strongestNode: string;
  nodeAccuracy: {
    node: string;
    name: string;
    accuracy: number;
    count: number;
  }[];
  timeline: { date: string; answers: number; correct: number }[];
}

export function computeAnalytics(
  records: AnswerRecord[],
  masteredNodes: string[],
  consecutiveDays: number,
  totalDays: number,
  pearls: number,
  fragments: number,
  redemptions: Redemption[],
  nodeNames: Map<string, string>,
  totalNodes: number
): Analytics {
  const accuracy =
    records.length > 0
      ? records.filter((r) => r.correct).length / records.length
      : 0;

  // 按节点统计
  const nodeMap = new Map<string, { correct: number; total: number }>();
  for (const r of records) {
    const entry = nodeMap.get(r.nodeId) || { correct: 0, total: 0 };
    entry.total++;
    if (r.correct) entry.correct++;
    nodeMap.set(r.nodeId, entry);
  }

  const nodeAccuracy = Array.from(nodeMap.entries())
    .map(([node, v]) => ({
      node,
      name: nodeNames.get(node) || node,
      accuracy: v.total > 0 ? v.correct / v.total : 0,
      count: v.total,
    }))
    .sort((a, b) => b.count - a.count);

  const weakest =
    nodeAccuracy.length > 0
      ? nodeAccuracy.reduce((a, b) => (a.accuracy < b.accuracy ? a : b))
      : { node: "-", name: "-", accuracy: 0, count: 0 };
  const strongest =
    nodeAccuracy.length > 0
      ? nodeAccuracy.reduce((a, b) => (a.accuracy > b.accuracy ? a : b))
      : { node: "-", name: "-", accuracy: 0, count: 0 };

  // 时间线（按天聚合）
  const dayMap = new Map<string, { answers: number; correct: number }>();
  for (const r of records) {
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    const entry = dayMap.get(day) || { answers: 0, correct: 0 };
    entry.answers++;
    if (r.correct) entry.correct++;
    dayMap.set(day, entry);
  }
  const timeline = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 六维计算
  const radar: RadarScores = {
    mastery: Math.min(
      100,
      Math.round((masteredNodes.length / totalNodes) * 50 + accuracy * 50)
    ),
    interest: Math.min(
      100,
      Math.round(
        (totalDays > 0 ? Math.min(1, totalDays / 14) * 40 : 0) +
          (redemptions.length > 0 ? 20 : 0) +
          (records.length > 30 ? 20 : records.length > 10 ? 10 : 0) +
          (pearls > 20 ? 20 : pearls > 5 ? 10 : 0)
      )
    ),
    persistence: Math.min(
      100,
      Math.round(consecutiveDays * 10 + Math.min(totalDays * 3, 20))
    ),
    autonomy: Math.min(
      100,
      Math.round(
        30 +
          (redemptions.length > 0 ? 15 : 0) +
          (records.length > 20 ? 15 : 0) +
          (fragments > 0 ? 10 : 0) +
          (masteredNodes.length > 3 ? 15 : 0) +
          (masteredNodes.length > 10 ? 15 : 0)
      )
    ),
    transfer: Math.min(
      100,
      Math.round(
        accuracy > 0.6
          ? 40 + accuracy * 40
          : accuracy * 50 + (masteredNodes.length > 5 ? 20 : 0)
      )
    ),
    emotion: Math.min(
      100,
      Math.round(
        50 +
          (accuracy > 0.5 ? 20 : accuracy > 0.3 ? 10 : -10) +
          (consecutiveDays > 3 ? 15 : 0) +
          (consecutiveDays > 7 ? 15 : 0)
      )
    ),
  };

  return {
    radar,
    totalAnswers: records.length,
    accuracy: Math.round(accuracy * 100),
    masteredCount: masteredNodes.length,
    totalNodes,
    consecutiveDays,
    totalDays,
    pearls,
    fragments,
    redemptions,
    weakestNode: weakest.name,
    strongestNode: strongest.name,
    nodeAccuracy,
    timeline,
  };
}
