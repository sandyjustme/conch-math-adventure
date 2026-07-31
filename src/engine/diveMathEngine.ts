// 潜水算术的判定与奖励纯逻辑（从 DiveMath.tsx 下沉，可单测）。
// 组件只负责拖拽交互与渲染；答对/答错/过关结算都以这里为准。

import { ALL_TASKS, type Step, type Task } from "../data/diveTasks";
import { getGlobalMultiplier } from "./rewardEngine";

export interface StepJudge {
  correct: boolean;
  /** 答错时给的方向提示（不暴露精确终点） */
  hintDir: "up" | "down" | null;
}

/** 判定一步拖拽：落点等于目标值算对；答错只透露方向 */
export function judgeStep(
  step: Pick<Step, "from" | "to">,
  value: number
): StepJudge {
  if (value === step.to) return { correct: true, hintDir: null };
  return { correct: false, hintDir: step.to > step.from ? "up" : "down" };
}

export interface LevelReward {
  fragments: number;
  pearls: number;
  playTokens: number;
}

/** 每答错 1 次扣 20% 基础碎片，扣到 0 为止 */
export function baseFragments(wrongCount: number): number {
  return Math.max(0, 1 - wrongCount * 0.2);
}

/**
 * 过关结算：基础碎片 × 探险跳转加成(×1.5) × 全局倍率，向下取整。
 * 碎片为 0（答错 ≥5 次）时珍珠和游戏次数也不发。
 */
export function computeLevelReward(
  wrongCount: number,
  diveFromAdventure: boolean,
  todayAdventureCount: number
): LevelReward {
  const fromAdventure = diveFromAdventure ? 1.5 : 1.0;
  const globalMult = getGlobalMultiplier(todayAdventureCount);
  const final = Math.floor(
    baseFragments(wrongCount) * fromAdventure * globalMult
  );
  if (final <= 0) return { fragments: 0, pearls: 0, playTokens: 0 };
  return { fragments: final, pearls: 1, playTokens: 2 };
}

/** 按知识点聚焦筛选题目；无聚焦返回全部 */
export function getDiveTasks(diveFocus: string | null): Task[] {
  return diveFocus ? ALL_TASKS.filter((t) => t.node === diveFocus) : ALL_TASKS;
}
