/**
 * 通用题目生成器 — 按知识图谱位置动态生成算式和文字题参数。
 * 30/50/20 原则：30% 已掌握（承压）、50% 当前（练习）、20% 前瞻（好奇心）。
 */
import { NODES } from "./knowledgeGraph";

export interface Expression {
  text: string; // e.g. "-3+5"
  value: number; // e.g. 2
}

export interface TextQuestion {
  nodeId: string;
  type: "compare" | "opposite" | "absolute" | "fraction_compare";
  a: number;
  b: number;
  question: string; // e.g. "{a} 和 {b}，谁更大？"
  hint: string; // e.g. "💡离海面越近越大"
  answer: string; // expected answer label
}

const DIFFICULTY_SIMPLE = ["K1", "K2", "K3", "K4"];
const DIFFICULTY_MEDIUM = ["K5", "K6", "K7", "K8", "K9", "K10"];
const DIFFICULTY_HARD = [
  "K11",
  "K12",
  "K13",
  "K14",
  "K15",
  "K16",
  "K17",
  "K18",
  "K19",
  "K20",
];

function getDifficulty(nodeId: string): "simple" | "medium" | "hard" {
  if (DIFFICULTY_SIMPLE.includes(nodeId)) return "simple";
  if (DIFFICULTY_MEDIUM.includes(nodeId)) return "medium";
  return "hard";
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 从节点池按比例随机抽 N 个节点 */
function sampleNodes(
  currentNodeId: string,
  masteredNodes: string[],
  count: number
): string[] {
  const simplePool = masteredNodes.filter((id) =>
    DIFFICULTY_SIMPLE.includes(id)
  );
  const mediumPool = masteredNodes.filter((id) =>
    DIFFICULTY_MEDIUM.includes(id)
  );
  const hardPool = masteredNodes.filter((id) => DIFFICULTY_HARD.includes(id));

  // 当前节点 + 已掌握的当前级别节点 → 50% 练习区
  const currDiff = getDifficulty(currentNodeId);
  const practicePool = [
    currentNodeId,
    ...masteredNodes.filter((id) => getDifficulty(id) === currDiff),
  ];

  // 前瞻节点：知识图谱中的下一个未掌握节点
  const allIds = NODES.map((n) => n.id);
  const nextIdx = allIds.indexOf(currentNodeId) + 1;
  const nextNode = nextIdx < allIds.length ? allIds[nextIdx] : currentNodeId;

  const results: string[] = [];

  // 30% 承压（已掌握）
  const comfortCount = Math.round(count * 0.3);
  const comfortPool = [...simplePool, ...mediumPool, ...hardPool];
  for (let i = 0; i < comfortCount; i++) {
    results.push(comfortPool.length > 0 ? pick(comfortPool) : currentNodeId);
  }

  // 50% 练习（当前难度）
  const practiceCount = Math.round(count * 0.5);
  for (let i = 0; i < practiceCount; i++) {
    results.push(practicePool.length > 0 ? pick(practicePool) : currentNodeId);
  }

  // 20% 前瞻
  const foresightCount = count - comfortCount - practiceCount;
  for (let i = 0; i < foresightCount; i++) {
    results.push(nextNode);
  }

  // 打乱顺序
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }

  return results;
}

/** 根据难度生成单个算式 */
function genExpression(nodeId: string): Expression {
  const diff = getDifficulty(nodeId);
  switch (diff) {
    case "simple": {
      const a = randInt(1, 12);
      const b = randInt(1, 12);
      const op = pick(["+", "-"]);
      const value = op === "+" ? a + b : a - b;
      return { text: `${a}${op}${b}`, value };
    }
    case "medium": {
      const a = randInt(-10, 10);
      const b = randInt(-10, 10);
      const op = pick(["+", "-"]);
      const value = op === "+" ? a + b : a - b;
      const aStr = a < 0 ? `(${a})` : `${a}`;
      const bStr = b < 0 ? `(${b})` : `${b}`;
      return { text: `${aStr}${op}${bStr}`, value };
    }
    case "hard": {
      // 分数或混合运算
      const denom = randInt(2, 8);
      const numer1 = randInt(1, denom * 2);
      const numer2 = randInt(1, denom);
      const value = (numer1 + numer2) / denom;
      return { text: `${numer1}/${denom}+${numer2}/${denom}`, value };
    }
  }
}

/** 生成算式数组（游戏角用） */
export function generateExpressions(
  currentNodeId: string,
  masteredNodes: string[],
  count: number
): Expression[] {
  const nodes = sampleNodes(currentNodeId, masteredNodes, count);
  return nodes.map((id) => genExpression(id));
}

/** 生成文字题（规则怪谈用） */
export function generateTextQuestions(
  currentNodeId: string,
  masteredNodes: string[],
  count: number
): TextQuestion[] {
  const nodes = sampleNodes(currentNodeId, masteredNodes, count);
  const questions: TextQuestion[] = [];

  for (const nodeId of nodes) {
    const diff = getDifficulty(nodeId);
    if (diff === "simple") {
      const a = randInt(1, 50);
      const b = randInt(1, 50);
      const answer = a > b ? String(a) : String(b);
      questions.push({
        nodeId,
        type: "compare",
        a,
        b,
        question: `${a} 和 ${b}，谁更大？`,
        hint: "💡 数大的更大",
        answer,
      });
    } else if (diff === "medium") {
      const a = randInt(-15, 15);
      let b = randInt(-15, 15);
      if (a === b) b = b + 1;
      const answer = a > b ? String(a) : String(b);
      questions.push({
        nodeId,
        type: "compare",
        a,
        b,
        question: `${a} 和 ${b}，谁更大？`,
        hint: "💡 离海面越近的越大",
        answer,
      });
    } else {
      const denom = randInt(2, 8);
      const a = randInt(1, denom * 3);
      const b = randInt(1, denom * 3);
      questions.push({
        nodeId,
        type: "fraction_compare",
        a,
        b,
        question: `${a}/${denom} 和 ${b}/${denom}，谁更大？`,
        hint: "💡 分母一样时，分子大的更大",
        answer: a > b ? `${a}/${denom}` : `${b}/${denom}`,
      });
    }
  }

  return questions;
}

/** 难度 → 标签（UI 展示用） */
export function getDifficultyLabel(nodeId: string): string {
  const diff = getDifficulty(nodeId);
  if (diff === "simple") return "🌱";
  if (diff === "medium") return "🌿";
  return "🌳";
}
