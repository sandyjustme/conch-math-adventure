/**
 * 主干（有理数）题的情境变式库。
 *
 * 为什么存在：原来每个知识点只有**一个模板**——K1 永远是「水下 N 米」、
 * K8 永远是「从 a 走 b」，换的只有数字。一张工单 4 题连着同一个句式，
 * 她的原话是「我一直在做一样的题」。原始设计的「变式训练」（同一概念
 * 换 4-6 种场景反复练）在题目层面从没兑现 —— 这里补上。
 *
 * 每个变式都是纯文案函数：怎么把「拖到数值 v / 从 a 到 target」说成
 * 一件事。数值的生成与合法性仍由 lineTasks 统一负责，这里只管说法。
 * 同一张工单内轮换变式，保证 4 题句式不重样。
 */

/** 「拖到指定数值 v」类题目的说法 */
export interface PlaceVariant {
  prompt: (v: number) => string;
  hint: string;
}

/** 「从 a 出发走到 target」类题目的说法 */
export interface MoveVariant {
  prompt: (a: number, delta: number) => string;
  fromLabel: (a: number) => string;
  hint: (delta: number) => string;
}

/* ── K1 正负数：认位置 ── */
export const K1_VARIANTS: PlaceVariant[] = [
  {
    prompt: (v) =>
      v < 0 ? `把标记拖到「水下 ${-v} 米」` : `把标记拖到「水上 ${v} 米」`,
    hint: "潜下去是负数，浮上来是正数",
  },
  {
    prompt: (v) =>
      v < 0 ? `电梯到「地下 ${-v} 层」，标出来` : `电梯到「${v} 楼」，标出来`,
    hint: "地面是 0，往下是负的",
  },
  {
    prompt: (v) =>
      v < 0
        ? `今天气温零下 ${-v} 度，在线上标出来`
        : `今天气温 ${v} 度，在线上标出来`,
    hint: "零下就是比 0 小",
  },
  {
    prompt: (v) =>
      v < 0
        ? `欠了 ${-v} 块钱，在账本线上标出来`
        : `攒了 ${v} 块钱，在账本线上标出来`,
    hint: "欠的记成负数",
  },
];

/* ── K3/K4 数轴：直接认数 ── */
export const K3_VARIANTS: PlaceVariant[] = [
  { prompt: (v) => `把标记拖到 ${v}`, hint: "0 右边是正，左边是负" },
  {
    prompt: (v) => `${v} 住在线上的哪个位置？`,
    hint: "先找 0，再数格子",
  },
  {
    prompt: (v) => `找到 ${v > 0 ? `+${v}` : v} 的家`,
    hint: "带负号的都在 0 左边",
  },
];

/* ── K5 相反数 ── */
export const K5_VARIANTS: PlaceVariant[] = [
  { prompt: (v) => `${-v} 的相反数在哪？`, hint: "离 0 一样远，方向相反" },
  {
    prompt: (v) => `${-v} 照镜子，镜子里的数在哪？（镜子立在 0 上）`,
    hint: "镜子两边离 0 一样远",
  },
  {
    prompt: (v) => `谁和 ${-v} 加起来正好是 0？`,
    hint: "一正一负，一样大才抵消",
  },
];

/* ── K6 绝对值 ── */
export const K6_VARIANTS: PlaceVariant[] = [
  {
    prompt: (v) => `${-v} 离 0 有多远？把标记拖到那个距离上`,
    hint: "距离不分正负",
  },
  {
    prompt: (v) => `潜水员在水下 ${v} 米，要浮回海面得游几米？标出来`,
    hint: "问的是路程，路程没有负的",
  },
];

/* ── K7 比大小 ── */
export const K7_VARIANTS: {
  prompt: (a: number, b: number) => string;
  hint: string;
}[] = [
  {
    prompt: (a, b) => `${a} 和 ${b}，把标记拖到大的那个`,
    hint: "0 右边越远越大",
  },
  {
    prompt: (a, b) => `气温从 ${a} 度变到 ${b} 度，标出更暖和的那个`,
    hint: "越靠右越暖",
  },
  {
    prompt: (a, b) => `${a} 层和 ${b} 层，标出离天空更近的那层`,
    hint: "楼层越高数越大",
  },
];

/* ── K8 加法（也是未配模板节点的兜底）── */
export const K8_VARIANTS: MoveVariant[] = [
  {
    prompt: (a, d) => `从 ${a} 走 ${d > 0 ? `+${d}` : d}，落在哪？`,
    fromLabel: (a) => `从 ${a} 出发`,
    hint: (d) => (d > 0 ? "正数往右走" : "负数往左走"),
  },
  {
    prompt: (a, d) =>
      d > 0
        ? `潜水员在 ${a} 米，上浮 ${d} 米后在哪？`
        : `潜水员在 ${a} 米，下潜 ${-d} 米后在哪？`,
    fromLabel: (a) => `现在在 ${a} 米`,
    hint: (d) => (d > 0 ? "上浮是加" : "下潜是减"),
  },
  {
    prompt: (a, d) =>
      d > 0
        ? `账上有 ${a} 块，又赚了 ${d} 块，现在多少？`
        : `账上有 ${a} 块，又花了 ${-d} 块，现在多少？`,
    fromLabel: (a) => `账上 ${a} 块`,
    hint: (d) => (d > 0 ? "赚了往右" : "花了往左"),
  },
  {
    prompt: (a, d) =>
      d > 0
        ? `电梯在 ${a} 层，上了 ${d} 层，到几层？`
        : `电梯在 ${a} 层，下了 ${-d} 层，到几层？`,
    fromLabel: (a) => `电梯在 ${a} 层`,
    hint: (d) => (d > 0 ? "上楼是加" : "下楼是减"),
  },
];

/* ── K10/K11 减法 ── */
export const K10_VARIANTS: MoveVariant[] = [
  {
    prompt: (a, d) => `从 ${a} 往回退 ${-d}，落在哪？`,
    fromLabel: (a) => `从 ${a} 出发`,
    hint: () => "往回退就是往左走",
  },
  {
    prompt: (a, d) => `温度是 ${a} 度，降了 ${-d} 度，现在几度？`,
    fromLabel: (a) => `现在 ${a} 度`,
    hint: () => "降温往左数",
  },
  {
    prompt: (a, d) => `有 ${a} 块钱，还了 ${-d} 块债，剩下的标出来`,
    fromLabel: (a) => `手里 ${a} 块`,
    hint: () => "还债就是往下减",
  },
];
