/**
 * 工单的统一题目格式：**一条线，把标记拖到对的位置**。
 *
 * 为什么统一：主干（有理数）和补漏（分数）必须长得一样，否则她一眼就能
 * 看出「又给我降级了」。同一块板、同一个动作，区别只在线怎么刻——
 * 分数题把一格切成 d 份，有理数题一格就是一。这样「顺带补小学」
 * 在她那里只是「今天的活儿换了个味道」。
 *
 * 交互沿用数轴拖拽：这是她唯一没抱怨过的形态（抱怨的是题目和奖励）。
 */

import {
  PROBE_SET,
  PRACTICE_BY_SKILL,
  type FractionSkill,
  type FractionTask,
} from "./fractionTasks";
import {
  K1_VARIANTS,
  K3_VARIANTS,
  K5_VARIANTS,
  K6_VARIANTS,
  K7_VARIANTS,
  K8_VARIANTS,
  K10_VARIANTS,
} from "./lineVariants";

export interface LineTask {
  id: string;
  /** 入库用的标识：分数层 F1..F7 或有理数节点 K1..K20 */
  skill: string;
  prompt: string;
  /** 线的左右端点（以单位计） */
  min: number;
  max: number;
  /** 每个单位切几格。分数题 = 分母，有理数题 = 1 */
  ticks: number;
  /** 起点，以「格」计；null 表示没有起点 */
  fromTick: number | null;
  /** 正确落点，以「格」计 */
  answerTick: number;
  hint: string;
  /** 起点旁边显示的标签，如「从 1/5 出发」 */
  fromLabel?: string;
}

/** 总格数 */
export function totalTicks(t: LineTask): number {
  return (t.max - t.min) * t.ticks;
}

/** 把「第几格」还原成线上的数值 */
export function valueAtTick(t: LineTask, tick: number): number {
  return t.min + tick / t.ticks;
}

/** 落点显示成什么字：分数题显示 n/d，整数题显示数值 */
export function tickLabel(t: LineTask, tick: number): string {
  if (t.ticks === 1) return String(valueAtTick(t, tick));
  // 分数题：线是 0..1 时直接显示 tick/ticks
  if (t.min === 0 && t.max === 1) return `${tick}/${t.ticks}`;
  const v = valueAtTick(t, tick);
  return Number.isInteger(v) ? String(v) : `${tick}/${t.ticks}`;
}

/* ── 分数题：把现有 FractionTask 转成统一格式 ── */

function fromFractionTask(f: FractionTask): LineTask {
  return {
    id: f.id,
    skill: f.skill,
    prompt: f.prompt,
    min: 0,
    max: f.max,
    ticks: f.ticks,
    fromTick: f.from ? Math.round((f.from.n / f.from.d) * f.ticks) : null,
    answerTick: Math.round((f.answer.n / f.answer.d) * f.ticks),
    hint: f.hint,
    fromLabel: f.from ? `从 ${f.from.n}/${f.from.d} 出发` : undefined,
  };
}

/** 某个分数层的题；不够就循环取，题库见底由参数化生成兜底（见 trunkTasks 的做法） */
export function fractionTasksFor(
  skill: FractionSkill,
  count: number
): LineTask[] {
  const pool = [
    ...PRACTICE_BY_SKILL[skill],
    ...PROBE_SET.filter((t) => t.skill === skill),
  ].map(fromFractionTask);
  if (pool.length === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const base = pool[i % pool.length];
    // 循环第二轮起给个新 id，避免 React key 重复
    return i < pool.length
      ? base
      : { ...base, id: `${base.id}-r${Math.floor(i / pool.length)}` };
  });
}

/* ── 主干（有理数）题：参数化生成，不会见底 ── */

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * 有理数题统一画在 −6..6 的整数线上。
 * 范围曾经是 −10..10，但 21 格在手机上挤成一把梳子、不好点，
 * 标记贴到边缘也难看。12 格足够教负数，且每格约 24px 好按。
 */
const R_MIN = -6;
const R_MAX = 6;
const toTick = (v: number) => v - R_MIN;

function base(id: string, node: string, prompt: string, hint: string) {
  return { id, skill: node, prompt, hint, min: R_MIN, max: R_MAX, ticks: 1 };
}

/**
 * 按知识点出一道有理数题。
 *
 * 第 i 题用第 i 个变式（轮换）：同一张工单 4 题句式不重样 ——
 * 她的原话「我一直在做一样的题」，指的就是原来每个节点只有
 * 一个模板、只换数字。随机只负责数字，变式负责说法。
 * 未单独配变式的节点回落到 K8 的移动类变式（宁可出通用题，
 * 也不能因为没模板就把工单开天窗）。
 */
function trunkTask(node: string, i: number): LineTask {
  const id = `${node}-${i}-${randInt(1000, 9999)}`;

  switch (node) {
    case "K1": {
      const v = randInt(1, 6) * (Math.random() < 0.5 ? -1 : 1);
      const va = K1_VARIANTS[i % K1_VARIANTS.length];
      return {
        ...base(id, node, va.prompt(v), va.hint),
        fromTick: null,
        answerTick: toTick(v),
      };
    }
    case "K2":
    case "K3":
    case "K4": {
      const v = randInt(-6, 6) || 3;
      const va = K3_VARIANTS[i % K3_VARIANTS.length];
      return {
        ...base(id, node, va.prompt(v), va.hint),
        fromTick: null,
        answerTick: toTick(v),
      };
    }
    case "K5": {
      const a = randInt(1, 6) * (Math.random() < 0.5 ? -1 : 1);
      const va = K5_VARIANTS[i % K5_VARIANTS.length];
      // 变式文案以 -v 为「题面上的那个数」，答案是它的相反数
      return {
        ...base(id, node, va.prompt(-a), va.hint),
        fromTick: toTick(a),
        answerTick: toTick(-a),
        fromLabel: `${a} 在这里`,
      };
    }
    case "K6": {
      const a = randInt(-6, -1);
      const va = K6_VARIANTS[i % K6_VARIANTS.length];
      return {
        ...base(id, node, va.prompt(-a), va.hint),
        fromTick: toTick(a),
        answerTick: toTick(-a),
        fromLabel: `${a} 在这里`,
      };
    }
    case "K7": {
      const a = randInt(-6, 6);
      let b = randInt(-6, 6);
      if (a === b) b = b === 6 ? b - 1 : b + 1;
      const va = K7_VARIANTS[i % K7_VARIANTS.length];
      return {
        ...base(id, node, va.prompt(a, b), va.hint),
        fromTick: null,
        answerTick: toTick(Math.max(a, b)),
      };
    }
    case "K10":
    case "K11": {
      // 先定落点再反推步长，从根上不可能越界
      const a = randInt(-2, 6);
      const target = randInt(Math.max(R_MIN, a - 5), a - 1);
      const va = K10_VARIANTS[i % K10_VARIANTS.length];
      return {
        ...base(id, node, va.prompt(a, target - a), va.hint(target - a)),
        fromTick: toTick(a),
        answerTick: toTick(target),
        fromLabel: va.fromLabel(a),
      };
    }
    default: {
      // K8 加法及其余节点：先定落点再反推步长（同上，保证落在线内）
      const a = randInt(-5, 5);
      const lo = Math.max(R_MIN, a - 5);
      const hi = Math.min(R_MAX, a + 5);
      let target = randInt(lo, hi);
      if (target === a) target = target < hi ? target + 1 : target - 1;
      const b = target - a;
      const va = K8_VARIANTS[i % K8_VARIANTS.length];
      return {
        ...base(id, node, va.prompt(a, b), va.hint(b)),
        fromTick: toTick(a),
        answerTick: toTick(target),
        fromLabel: va.fromLabel(a),
      };
    }
  }
}

export function trunkTasksFor(node: string, count: number): LineTask[] {
  return Array.from({ length: count }, (_, i) => trunkTask(node, i));
}
