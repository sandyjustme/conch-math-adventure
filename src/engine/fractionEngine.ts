// 分数练习的判定、奖励与断点推断（纯函数，全部可单测）。
//
// 奖励曲线是这个文件最重要的部分。原来的规则是「答错 5 次 → 碎片、珍珠、
// 游戏次数全部归零」——越差越什么都没有。拿给一个数学 8 分的孩子用，
// 结果就是"做了很多题却不过关也没有珍珠，非常没有成就感"，然后跑去
// 规则怪谈刷分：那是整个产品里唯一会正向回应她的地方。
//
// 这里的规则改成：做了就有，做对更多，绝不归零。

import {
  SKILL_ORDER,
  type Fraction,
  type FractionSkill,
  type FractionTask,
} from "../data/fractionTasks";
import type { AnswerRecord } from "../types";

/* ── 分数基本运算 ── */

export function toValue(f: Fraction): number {
  return f.n / f.d;
}

/** 等值即正确：3/6 和 1/2 是同一个位置，不能判错 */
export function isEquivalent(a: Fraction, b: Fraction): boolean {
  return a.n * b.d === b.n * a.d;
}

export interface FractionJudge {
  correct: boolean;
  /** 答错时告诉她往哪边偏了，不给答案 */
  direction: "left" | "right" | null;
}

/** 判定她拖到的格数。picked 是「第几格」，配合题目的 ticks 还原成分数 */
export function judgeDrop(
  task: FractionTask,
  pickedTick: number
): FractionJudge {
  const picked: Fraction = { n: pickedTick, d: task.ticks };
  if (isEquivalent(picked, task.answer)) {
    return { correct: true, direction: null };
  }
  return {
    correct: false,
    direction: toValue(picked) < toValue(task.answer) ? "right" : "left",
  };
}

/* ── 奖励：做了就有，做对更多，绝不归零 ── */

export interface RoundReward {
  fragments: number;
  pearls: number;
  playTokens: number;
}

/**
 * 一轮结束时的产出。
 *
 * 保底：只要做完这一轮，至少 1 珍珠 + 2 碎片 + 1 次游戏。
 * 全错也拿得到 —— 一个尝试了十题的孩子，结束时必须比什么都没做更好。
 *
 * 增量：每答对一题多 1 碎片；对满一半再加 1 珍珠；全对再加 1 次游戏。
 */
export function computeRoundReward(
  correctCount: number,
  totalCount: number
): RoundReward {
  const done = Math.max(0, totalCount);
  if (done === 0) return { fragments: 0, pearls: 0, playTokens: 0 };

  const right = Math.max(0, Math.min(correctCount, done));
  return {
    fragments: 2 + right,
    pearls: 1 + (right * 2 >= done ? 1 : 0),
    playTokens: 1 + (right === done ? 1 : 0),
  };
}

/* ── 隐形诊断：断点从答题记录里自己浮现 ── */

export interface SkillStat {
  skill: FractionSkill;
  correct: number;
  total: number;
  accuracy: number;
}

/** 把一轮作答按技能层汇总 */
export function summarizeBySkill(
  results: { task: FractionTask; correct: boolean }[]
): SkillStat[] {
  const map = new Map<FractionSkill, { correct: number; total: number }>();
  for (const r of results) {
    const e = map.get(r.task.skill) ?? { correct: 0, total: 0 };
    e.total++;
    if (r.correct) e.correct++;
    map.set(r.task.skill, e);
  }
  return SKILL_ORDER.filter((s) => map.has(s)).map((skill) => {
    const e = map.get(skill)!;
    return {
      skill,
      correct: e.correct,
      total: e.total,
      accuracy: e.total > 0 ? e.correct / e.total : 0,
    };
  });
}

/**
 * 断点 = 由浅入深第一个正确率低于阈值的层。
 * 找不到（各层都还行）返回 null —— 说明分数不是她的瓶颈。
 */
export function findBreakpoint(
  stats: SkillStat[],
  threshold = 0.6
): FractionSkill | null {
  for (const skill of SKILL_ORDER) {
    const s = stats.find((x) => x.skill === skill);
    if (s && s.total > 0 && s.accuracy < threshold) return skill;
  }
  return null;
}

/** 从持久化的答题记录里还原分数各层表现（nodeId 存的是 "F1".."F7"） */
export function statsFromRecords(records: AnswerRecord[]): SkillStat[] {
  const map = new Map<FractionSkill, { correct: number; total: number }>();
  for (const r of records) {
    if (!SKILL_ORDER.includes(r.nodeId as FractionSkill)) continue;
    const skill = r.nodeId as FractionSkill;
    const e = map.get(skill) ?? { correct: 0, total: 0 };
    e.total++;
    if (r.correct) e.correct++;
    map.set(skill, e);
  }
  return SKILL_ORDER.filter((s) => map.has(s)).map((skill) => {
    const e = map.get(skill)!;
    return {
      skill,
      correct: e.correct,
      total: e.total,
      accuracy: e.total > 0 ? e.correct / e.total : 0,
    };
  });
}
