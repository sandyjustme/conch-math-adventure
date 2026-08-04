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
 * 过关结算：保底 + 表现加成。
 *
 * 原规则是「碎片算出来 ≤0 就三样全不发」，于是出现两种反向激励：
 *   · 答错 5 次 → 通关了也一无所获
 *   · 一次没错，但今天还没去聊过天（倍率 0.5）→ 同样一无所获
 * 拿给一个数学 8 分的孩子用，结果就是「做了很多题却没有任何产出」，
 * 然后跑去规则怪谈刷分 —— 那是全产品唯一会正向回应她的地方。
 *
 * 现在改成：**通关就一定有产出**，答得好拿更多。
 */
export function computeLevelReward(
  wrongCount: number,
  diveFromAdventure: boolean,
  todayAdventureCount: number
): LevelReward {
  const fromAdventure = diveFromAdventure ? 1.5 : 1.0;
  const globalMult = getGlobalMultiplier(todayAdventureCount);
  const bonus = Math.floor(
    baseFragments(wrongCount) * fromAdventure * globalMult
  );
  // 保底 1 碎片 1 珍珠 1 次游戏：通关本身就值这些
  return {
    fragments: 1 + Math.max(0, bonus),
    pearls: 1 + (wrongCount === 0 ? 1 : 0),
    playTokens: 1 + (wrongCount <= 1 ? 1 : 0),
  };
}

/** 按知识点聚焦筛选题目；无聚焦返回全部 */
export function getDiveTasks(diveFocus: string | null): Task[] {
  return diveFocus ? ALL_TASKS.filter((t) => t.node === diveFocus) : ALL_TASKS;
}
