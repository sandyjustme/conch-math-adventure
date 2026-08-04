// 班次编排与路由（纯函数，全部可单测）。
//
// 这是家长原始设计「初一为主干、卡住的地方顺带把小学缺的补起来」
// 第一次被真正实现的地方。此前 elementaryDeps 只是图谱里的一句声明，
// 代码从不据此路由，也没有小学内容可去 —— 于是她走到 K8 必然卡死。

import { NODES } from "../data/knowledgeGraph";
import { getUnlockedNodes } from "./levelManager";
import { elementaryPathFor } from "../data/elementaryMap";
import { SKILL_ORDER, type FractionSkill } from "../data/fractionTasks";
import type { AnswerRecord } from "../types";

/** 一天几张工单 —— 硬打烊，做完就结束，不诱导继续 */
export const ORDERS_PER_SHIFT = 3;
/** 一张工单几题 —— 约 10-15 分钟一班，她只对当天能干完的事有持久力 */
export const TASKS_PER_ORDER = 4;

/** 判定「这一层还没过关」的首试正确率阈值 */
const PASS_THRESHOLD = 0.6;
/** 少于这么多条记录时不下结论，先当没数据处理 */
const MIN_SAMPLES = 3;
/**
 * 只看最近这么多条首试。用全量会让历史错误永远压着正确率：
 * 她 K8 先错 10 次、补完分数回来连对 5 次，全量算 5/15 仍判卡住，
 * 要再对 20 次才翻身 —— 补漏就白补了。窗口只反映「现在的她」。
 */
const RECENT_WINDOW = 6;

/**
 * 每张工单的固定工资。
 *
 * 必须固定、与正确率无关 —— 完成制的底线。工资随对错浮动，
 * 她就能从钱数反推出自己对了几个：工资本身变成了评价，
 * 「被考」的感觉就回来了。防蒙混不靠钱，靠答案空间
 * （拖拽题要试到对才能过，瞎点比想一下更慢）和家长看板的时延监控。
 */
export const WAGE_PER_ORDER = {
  fragments: 3,
  pearls: 1,
  playTokens: 1,
} as const;

export type WorkOrderKind = "trunk" | "elementary";

export interface WorkOrder {
  kind: WorkOrderKind;
  /** trunk 时是 K 节点，elementary 时是 F 技能层 */
  target: string;
  /** elementary 时记录是为了哪个主干节点在补 —— 用于补完回主干 */
  forNode?: string;
}

/* ── 记录统计 ── */

function accuracyOf(records: AnswerRecord[], id: string): number | null {
  const hit = records.filter((r) => r.nodeId === id).slice(-RECENT_WINDOW);
  if (hit.length < MIN_SAMPLES) return null; // 样本太少不下结论
  return hit.filter((r) => r.correct).length / hit.length;
}

/** 这一项是否已经过关（样本不足视为未验证，不算过关也不算卡住） */
function isPassing(records: AnswerRecord[], id: string): boolean {
  const acc = accuracyOf(records, id);
  return acc !== null && acc >= PASS_THRESHOLD;
}

/** 这一项是否明确卡住了（有足够样本且正确率低） */
function isStuck(records: AnswerRecord[], id: string): boolean {
  const acc = accuracyOf(records, id);
  return acc !== null && acc < PASS_THRESHOLD;
}

/* ── 主干推进 ── */

/**
 * 主干起点：K5 相反数 —— 初一真正的新内容从这里开始。
 *
 * 不从 K1 起步的原因：对一个初一学生，第一张工单是「水下 3 米」
 * 这种一年级难度，一眼就会被定性为幼稚（真实反馈：「一开始就还是
 * 正负数」）。从 K1 全对爬到 K8 要六七张工单，头两天全耗在她觉得
 * 侮辱智商的内容上 —— 第一印象只有一次。
 *
 * 起点设高是安全的：K5 之后每个节点卡住，elementaryDeps 都会自动
 * 往下补（含 F1 这种最底层）；起点设低却只能靠全对一张张往上爬。
 * 往下有兜底，往上没有 —— 所以宁高勿低。
 */
export const TRUNK_START = "K5";

/**
 * 当前该练的主干节点：**已解锁、未过关**里最靠前的（且不低于起点）。
 *
 * 「已解锁」用图谱的依赖语义（levelManager.getUnlockedNodes：直接依赖
 * 都掌握了才解锁）—— 这样老存档里点亮过的节点被完全尊重，从她的
 * 真实进度接着走，而不是从理论起点重来。
 *
 * 前沿都还锁着时（比如新档案里 K5 的依赖 K3/K4 未标掌握）退回
 * 「K 序第一个未掌握」：起点下限的优先级高于解锁语义 ——
 * 宁可直接从 K5 开工靠补漏兜底，也不能让第一印象是一年级的题。
 */
export function currentTrunkNode(masteredNodes: string[]): string {
  const startIdx = Math.max(
    0,
    NODES.findIndex((n) => n.id === TRUNK_START)
  );
  const unlocked = new Set(getUnlockedNodes(masteredNodes));
  const frontier = NODES.slice(startIdx).find(
    (n) => !masteredNodes.includes(n.id) && unlocked.has(n.id)
  );
  if (frontier) return frontier.id;
  const fallback = NODES.slice(startIdx).find(
    (n) => !masteredNodes.includes(n.id)
  );
  return fallback ? fallback.id : NODES[NODES.length - 1].id;
}

/**
 * 主干节点该不该判定为「掌握、往前走」。
 *
 * 没有这个函数，主干就没有任何推进机制 —— 她永远停在 K1，
 * 「从低起步、快速爬升」的隐形摸底根本不成立。
 * 判据：该节点最近 4 条首试里对了至少 3 条（一张全对的工单就够）。
 * 只有班次结算可以据此调 masterNode；娱乐线与冻结区一律不许写。
 */
export function shouldAdvanceTrunk(
  records: AnswerRecord[],
  nodeId: string
): boolean {
  const recent = records.filter((r) => r.nodeId === nodeId).slice(-4);
  if (recent.length < 4) return false;
  return recent.filter((r) => r.correct).length >= 3;
}

/* ── 路由 ── */

/**
 * 决定下一张工单出什么。
 *
 *   1. 取当前主干节点
 *   2. 主干没卡住（或还没数据）→ 出主干工单
 *   3. 主干卡住了 → 查小学补漏路径，取第一个还没过关的层
 *   4. 补漏路径为空或全部过关 → 只能留在主干（宁可不补，也不路由到不存在的内容）
 */
export function nextWorkOrder(
  records: AnswerRecord[],
  masteredNodes: string[]
): WorkOrder {
  const node = currentTrunkNode(masteredNodes);

  if (!isStuck(records, node)) {
    return { kind: "trunk", target: node };
  }

  const path = elementaryPathFor(node);
  const weak = path.find((skill) => !isPassing(records, skill));
  if (weak) {
    return { kind: "elementary", target: weak, forNode: node };
  }

  // 补漏路径走完了还是卡着 —— 内容层面已无更浅的台阶可下，
  // 继续留在主干（这种情况需要人工看看板决定，不该由代码硬撑）
  return { kind: "trunk", target: node };
}

/** 排一整班的工单序列 */
export function planShift(
  records: AnswerRecord[],
  masteredNodes: string[],
  count = ORDERS_PER_SHIFT
): WorkOrder[] {
  return Array.from({ length: count }, () =>
    nextWorkOrder(records, masteredNodes)
  );
}

/* ── 打烊 ── */

/** 今天还能不能开工（跨天自动重置由调用方比对日期完成） */
export function canWorkToday(
  shiftDate: string,
  shiftDoneToday: number,
  today: string
): boolean {
  if (shiftDate !== today) return true; // 新的一天
  return shiftDoneToday < ORDERS_PER_SHIFT;
}

/** 今天还剩几张工单 */
export function ordersLeftToday(
  shiftDate: string,
  shiftDoneToday: number,
  today: string
): number {
  if (shiftDate !== today) return ORDERS_PER_SHIFT;
  return Math.max(0, ORDERS_PER_SHIFT - shiftDoneToday);
}

/* ── 给家长看板：她断在哪一层 ── */

export interface BreakdownReport {
  trunkNode: string;
  trunkStuck: boolean;
  /** 正在补的小学层，null 表示没在补 */
  remediating: FractionSkill | null;
  /** 补漏路径上各层的过关情况，按由浅到深 */
  path: { skill: FractionSkill; passing: boolean; samples: number }[];
}

export function breakdownReport(
  records: AnswerRecord[],
  masteredNodes: string[]
): BreakdownReport {
  const trunkNode = currentTrunkNode(masteredNodes);
  const order = nextWorkOrder(records, masteredNodes);
  const path = elementaryPathFor(trunkNode);

  return {
    trunkNode,
    trunkStuck: isStuck(records, trunkNode),
    remediating:
      order.kind === "elementary" ? (order.target as FractionSkill) : null,
    path: path
      .slice()
      .sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b))
      .map((skill) => ({
        skill,
        passing: isPassing(records, skill),
        samples: records.filter((r) => r.nodeId === skill).length,
      })),
  };
}
