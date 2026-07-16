import type { AnswerRecord, MasteryStatus } from "../types";
import { NODES, NODE_MAP } from "../data/knowledgeGraph";
import { getNodeMastery, getAllDependencies } from "./diagnostic";
import { MASTERY_THRESHOLD } from "../data/gameConfig";

export function getNodeStatus(
  nodeId: string,
  masteredNodes: string[],
  records: AnswerRecord[]
): MasteryStatus {
  if (masteredNodes.includes(nodeId)) return "mastered";

  const node = NODE_MAP.get(nodeId);
  if (!node) return "locked";

  const deps = getAllDependencies(nodeId);
  const allDepsMastered = deps.every((dep) => masteredNodes.includes(dep));

  if (!allDepsMastered && deps.length > 0) return "locked";

  const mastery = getNodeMastery(nodeId, records);
  if (mastery > 0) return "in_progress";

  return "unlocked";
}

export function canUnlock(nodeId: string, masteredNodes: string[]): boolean {
  const node = NODE_MAP.get(nodeId);
  if (!node) return false;
  if (node.dependencies.length === 0) return true;
  return node.dependencies.every((dep) => masteredNodes.includes(dep));
}

export function getUnlockedNodes(masteredNodes: string[]): string[] {
  return NODES.filter((n) => canUnlock(n.id, masteredNodes)).map((n) => n.id);
}

export function isMastered(
  nodeId: string,
  records: AnswerRecord[],
  threshold: number = MASTERY_THRESHOLD
): boolean {
  return getNodeMastery(nodeId, records) >= threshold;
}

export function getNextNode(
  masteredNodes: string[],
  currentNodeId: string
): string | null {
  const currentIndex = NODES.findIndex((n) => n.id === currentNodeId);
  if (currentIndex === -1) return null;

  const allUnlocked = getUnlockedNodes(masteredNodes);
  const nextInOrder = NODES.find(
    (n, i) =>
      i > currentIndex &&
      allUnlocked.includes(n.id) &&
      !masteredNodes.includes(n.id)
  );
  if (nextInOrder) return nextInOrder.id;

  return (
    NODES.find(
      (n) => allUnlocked.includes(n.id) && !masteredNodes.includes(n.id)
    )?.id ?? null
  );
}

export function getChapterProgress(
  chapter: string,
  masteredNodes: string[]
): number {
  const chapterNodes = NODES.filter((n) => n.chapter === chapter);
  if (chapterNodes.length === 0) return 0;
  const mastered = chapterNodes.filter((n) =>
    masteredNodes.includes(n.id)
  ).length;
  return Math.round((mastered / chapterNodes.length) * 100);
}
