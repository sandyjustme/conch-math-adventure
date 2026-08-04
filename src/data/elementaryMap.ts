/**
 * 初一节点 → 小学技能层的映射表。
 *
 * 为什么需要这张表：`knowledgeGraph.ts` 里 14/20 个节点声明了
 * `elementaryDeps`，但那是**中文自由文本**（"分数加减法,小数加减法"），
 * 机器没法拿它路由。这张表把文本翻译成可执行的技能层 ID。
 *
 * 这一环是家长原始设计里唯一没实现的部分 ——「初一为主干、卡住的地方
 * 顺带把小学缺的补起来」。图谱声明了依赖，但全项目从不路由，也没有
 * 小学内容可去，于是她走到 K8 加法必然卡死、卡死后无处可去。
 *
 * **映射是部分的，这是诚实状态**：分数乘除还没有题库，所以 K12/K15
 * 不映射；运算律、十进制、四舍五入这些也没有对应内容。没映射到的
 * 节点就不补，照常出主干题 —— 宁可不补，也不能路由到不存在的地方。
 */

import type { FractionSkill } from "./fractionTasks";

/**
 * K 节点卡住时，按顺序补这些小学技能层。
 * 数组是有序的：从最浅的开始补，补通一层再看下一层。
 */
export const ELEMENTARY_MAP: Record<string, FractionSkill[]> = {
  // "整数的认识,分数的意义与分类"
  K2: ["F1"],
  // "分数、小数在数轴上定位"
  K4: ["F1", "F2"],
  // "分数、小数大小比较"
  K7: ["F1", "F3", "F7"],
  // "分数加减法,小数加减法" —— 她已知断得最厉害的地方
  K8: ["F1", "F3", "F4", "F5", "F6"],
  // K10 减法 图谱里没写 elementaryDeps，但减法同样吃分数加减
  K10: ["F4", "F6"],
  // K11 加减混合 同理
  K11: ["F4", "F6"],
};

/**
 * 取某个主干节点对应的小学补漏路径。
 * 没有映射的节点返回空数组 —— 调用方据此决定「不补，留在主干」。
 */
export function elementaryPathFor(nodeId: string): FractionSkill[] {
  return ELEMENTARY_MAP[nodeId] ?? [];
}

/** 这个主干节点卡住时，有没有小学内容可补 */
export function hasElementaryFallback(nodeId: string): boolean {
  return elementaryPathFor(nodeId).length > 0;
}
