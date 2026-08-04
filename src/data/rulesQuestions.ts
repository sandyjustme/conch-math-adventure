/**
 * 午夜班守则的题目生成器。
 *
 * 替换掉原来的 expressionGenerator —— 那个只有三个模板、全是「谁更大」，
 * 而且难度分档是按知识点编号硬切的，跟她真实进度无关。她的原话是
 * 「题目确实简单得不太像话，也不跟学习进度保持一致」。
 *
 * 现在题目从她**真实的作答记录**里长出来：
 *   · 分数还断着 → 出断掉那一层和它上面一层的题
 *   · 分数过关了 → 出有理数的题，跟着她当前节点走
 *
 * 题面裹在守则/情境里，不是裸算式；但内容是真的要算，不再是送分。
 */

import { findBreakpoint, statsFromRecords } from "../engine/fractionEngine";
import { SKILL_ORDER, type FractionSkill } from "./fractionTasks";
import type { AnswerRecord } from "../types";

export interface RuleQuestion {
  /** 题面，裹在守则情境里 */
  story: string;
  /** 选项，长度不定；正确项由 correct 下标指定 */
  choices: string[];
  correct: number;
  /** 答错时给的思路，不给答案 */
  hint: string;
  /** 记录用：分数层 F1..F7 或有理数节点 K1..K20 */
  nodeId: string;
}

/* ── 工具 ── */

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * 把正确答案和干扰项打乱，返回选项与正确下标。
 *
 * 干扰项会去重：某些取值下（比如挪 0 层时 a+b 和 a−b 相等）会算出跟
 * 正确答案一样的干扰项，出现两个一模一样的选项 —— 那样点哪个都对，
 * 题就废了。宁可只剩两个选项，也不能有重复。
 */
function shuffleWithAnswer(
  answer: string,
  distractors: string[]
): { choices: string[]; correct: number } {
  const all = [answer];
  for (const d of distractors) {
    if (!all.includes(d)) all.push(d);
  }
  // 兜底：极端取值下干扰项可能全部塌成正确答案，只剩一个选项 ——
  // 那样这题根本没法作答。从答案本身派生一个必然不同的选项补上。
  if (all.length < 2) all.push(nudge(answer));

  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { choices: all, correct: all.indexOf(answer) };
}

/** 从答案派生一个必定不相等的选项，分数改分子、整数加一 */
function nudge(answer: string): string {
  const frac = answer.match(/^(-?\d+)\/(\d+)$/);
  if (frac) return `${Number(frac[1]) + 1}/${frac[2]}`;
  const num = Number(answer);
  return Number.isFinite(num) ? String(num + 1) : `${answer} `;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/* ── 分数题：按技能层出 ── */

function fractionQuestion(skill: FractionSkill): RuleQuestion {
  switch (skill) {
    case "F1":
    case "F2": {
      const d = randInt(4, 9);
      const n = randInt(1, d - 1);
      const { choices, correct } = shuffleWithAnswer(`${n}/${d}`, [
        `${d}/${n}`,
        `${n}/${d + 1}`,
      ]);
      return {
        story: `守则第 ${randInt(2, 9)} 条：把整条走廊分成 ${d} 段，你只能停在第 ${n} 段的位置。那是哪个记号？`,
        choices,
        correct,
        hint: `分成几段就是分母，走到第几段就是分子`,
        nodeId: skill,
      };
    }
    case "F3": {
      const base = pick([2, 3, 4]);
      const k = pick([2, 3]);
      const n = randInt(1, base - 1);
      const { choices, correct } = shuffleWithAnswer(`${n * k}/${base * k}`, [
        `${n + k}/${base + k}`,
        `${n}/${base * k}`,
      ]);
      return {
        story: `守则：走廊被重新划成了 ${base * k} 段。你原来站在 ${n}/${base}，现在该站哪个记号才是同一个地方？`,
        choices,
        correct,
        hint: `每一段被拆成了 ${k} 小段，上下都要跟着乘 ${k}`,
        nodeId: "F3",
      };
    }
    case "F4": {
      const d = randInt(5, 9);
      const a = randInt(1, d - 2);
      const b = randInt(1, d - a);
      const { choices, correct } = shuffleWithAnswer(`${a + b}/${d}`, [
        `${a + b}/${d + d}`,
        `${a * b}/${d}`,
      ]);
      return {
        story: `守则：你在 ${a}/${d}，广播让你再往前挪 ${b}/${d}。挪完停在哪？`,
        choices,
        correct,
        hint: `段数一样大，分子直接加，分母不动`,
        nodeId: "F4",
      };
    }
    case "F5": {
      const [x, y] = pick([
        [2, 3],
        [3, 4],
        [2, 5],
        [4, 6],
      ]);
      const l = (x * y) / gcd(x, y);
      const { choices, correct } = shuffleWithAnswer(String(l), [
        String(x + y),
        String(x * y * 2),
      ]);
      return {
        story: `守则：1/${x} 和 1/${y} 两个记号必须同时画在同一条走廊上。这条走廊至少要分成几段？`,
        choices,
        correct,
        hint: `要找一个 ${x} 和 ${y} 都能整除的段数`,
        nodeId: "F5",
      };
    }
    case "F6": {
      const d1 = pick([2, 3, 4]);
      const k = pick([2, 3]);
      const d2 = d1 * k;
      const a = randInt(1, d1 - 1);
      const b = randInt(1, d2 - a * k);
      const { choices, correct } = shuffleWithAnswer(`${a * k + b}/${d2}`, [
        `${a + b}/${d2}`,
        `${a + b}/${d1 + d2}`,
      ]);
      return {
        story: `守则：你在 ${a}/${d1}，广播让你再往前挪 ${b}/${d2}。挪完停在哪？`,
        choices,
        correct,
        hint: `先把 ${a}/${d1} 换成用 ${d2} 段来数`,
        nodeId: "F6",
      };
    }
    case "F7": {
      const d1 = pick([3, 4, 5]);
      const d2 = pick([6, 8, 10]);
      const a = randInt(1, d1 - 1);
      const b = randInt(1, d2 - 1);
      const bigger = a / d1 > b / d2 ? `${a}/${d1}` : `${b}/${d2}`;
      const smaller = a / d1 > b / d2 ? `${b}/${d2}` : `${a}/${d1}`;
      if (a / d1 === b / d2) return fractionQuestion("F4");
      const { choices, correct } = shuffleWithAnswer(bigger, [smaller]);
      return {
        story: `守则：两扇门，一扇标着 ${a}/${d1}，一扇标着 ${b}/${d2}。只能推开更靠里的那扇。`,
        choices,
        correct,
        hint: `换成同样的段数再比`,
        nodeId: "F7",
      };
    }
  }
}

/* ── 有理数题：分数过关之后才出 ── */

function rationalQuestion(nodeId: string): RuleQuestion {
  const kind = pick(["compare", "add", "abs", "opposite"] as const);
  switch (kind) {
    case "compare": {
      const a = randInt(-12, 12);
      let b = randInt(-12, 12);
      if (a === b) b = b + 1;
      const bigger = String(Math.max(a, b));
      const { choices, correct } = shuffleWithAnswer(bigger, [
        String(Math.min(a, b)),
      ]);
      return {
        story: `守则：地下 ${a} 层和地下 ${b} 层，只有离地面近的那层的门会开。`,
        choices,
        correct,
        hint: `离地面越近的越大`,
        nodeId,
      };
    }
    case "add": {
      const a = randInt(-9, 9);
      const b = randInt(-9, 9) || 4; // 走 0 层不成题，也会让干扰项撞车
      const { choices, correct } = shuffleWithAnswer(String(a + b), [
        String(a - b),
        String(Math.abs(a) + Math.abs(b)),
      ]);
      return {
        story: `守则：你在 ${a} 层，电梯又走了 ${b} 层。现在是几层？`,
        choices,
        correct,
        hint: `往上是加，往下是减`,
        nodeId,
      };
    }
    case "abs": {
      const a = randInt(-12, -1);
      const { choices, correct } = shuffleWithAnswer(String(Math.abs(a)), [
        String(a),
        String(a * 2),
      ]);
      return {
        story: `守则：你在 ${a} 层。要爬回地面，得走过几层？`,
        choices,
        correct,
        hint: `问的是距离，不分上下`,
        nodeId,
      };
    }
    case "opposite": {
      const a = randInt(-9, 9) || 3;
      const { choices, correct } = shuffleWithAnswer(String(-a), [
        String(a),
        String(Math.abs(a) + 1),
      ]);
      return {
        story: `守则：${a} 层的镜子里那一层，编号是多少？`,
        choices,
        correct,
        hint: `离地面一样远，方向相反`,
        nodeId,
      };
    }
  }
}

/**
 * 出一轮题。
 * 分数还断着就练分数（断点层 + 上面一层交替），过关了才上有理数。
 */
export function generateRuleQuestions(
  records: AnswerRecord[],
  currentNodeId: string,
  count = 5
): RuleQuestion[] {
  const breakpoint = findBreakpoint(statsFromRecords(records));
  const out: RuleQuestion[] = [];

  for (let i = 0; i < count; i++) {
    if (breakpoint) {
      // 三题练断点层，两题练它上面一层 —— 巩固为主，够一点点前进
      const idx = SKILL_ORDER.indexOf(breakpoint);
      const nextSkill = SKILL_ORDER[Math.min(idx + 1, SKILL_ORDER.length - 1)];
      out.push(fractionQuestion(i % 5 < 3 ? breakpoint : nextSkill));
    } else {
      out.push(rationalQuestion(currentNodeId));
    }
  }
  return out;
}
