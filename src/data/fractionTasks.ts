/**
 * 分数技能阶梯题库（纯数据，可换皮）。
 *
 * 为什么存在：知识图谱里 14/20 个有理数节点声明了小学分数依赖，
 * 但全项目没有一道分数运算题 —— 她走到 K8 加法就必然卡死，
 * 而卡死之后无处可去。这里补的就是那一环。
 *
 * 诊断是隐形的：不设摸底环节、不显示分数与对错统计。
 * 第一轮 10 题横跨各层，断点从 answerRecords 里自己浮现，她无感知。
 *
 * 交互统一为「数轴上拖到某个位置」—— 她对潜水算术的拖拽没有抱怨过，
 * 抱怨的是题目和奖励。
 */

/** 分数技能层级，由浅入深。断点定位到层，不定位到题。 */
export type FractionSkill =
  | "F1" // 分数的意义：几分之几
  | "F2" // 分数在数轴上的位置
  | "F3" // 等值分数 / 约分
  | "F4" // 同分母加减
  | "F5" // 通分（找公分母）
  | "F6" // 异分母加减
  | "F7"; // 分数大小比较

export const SKILL_NAME: Record<FractionSkill, string> = {
  F1: "几分之几",
  F2: "分数在数轴上",
  F3: "一样大的分数",
  F4: "同分母加减",
  F5: "通分",
  F6: "异分母加减",
  F7: "分数比大小",
};

/** 由浅入深的顺序，断点推断按这个序 */
export const SKILL_ORDER: FractionSkill[] = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
];

export interface Fraction {
  n: number;
  d: number;
}

export interface FractionTask {
  id: string;
  skill: FractionSkill;
  /** 题面。绝不出现「计算」「答案」「第几题」这类考试口吻 */
  prompt: string;
  /** 数轴分成几格（分母刻度） */
  ticks: number;
  /** 数轴右端代表的整数值，通常是 1，加法超过 1 时为 2 */
  max: number;
  /** 起点位置（加减题用），null 表示从 0 开始 */
  from: Fraction | null;
  /** 正确落点 */
  answer: Fraction;
  /** 答错时给的方向或思路提示，不直接给答案 */
  hint: string;
}

const f = (n: number, d: number): Fraction => ({ n, d });

/**
 * 第一轮 10 题：横跨全部 7 层，用于隐形定位断点。
 * 顺序刻意由易到难 —— 她连着做，卡在哪层一目了然，
 * 而她的体验只是「做了十题，拿到东西了」。
 */
export const PROBE_SET: FractionTask[] = [
  {
    id: "p1",
    skill: "F1",
    prompt: "把标记拖到 3/4 的位置",
    ticks: 4,
    max: 1,
    from: null,
    answer: f(3, 4),
    hint: "整条线分成 4 格，走 3 格",
  },
  {
    id: "p2",
    skill: "F2",
    prompt: "把标记拖到 2/5",
    ticks: 5,
    max: 1,
    from: null,
    answer: f(2, 5),
    hint: "分成 5 格，走 2 格",
  },
  {
    id: "p3",
    skill: "F3",
    prompt: "找一个和 1/2 一样大的位置（这条线分成了 6 格）",
    ticks: 6,
    max: 1,
    from: null,
    answer: f(3, 6),
    hint: "一半就是 6 格里的 3 格",
  },
  {
    id: "p4",
    skill: "F4",
    prompt: "从 1/5 往前走 2/5，落在哪？",
    ticks: 5,
    max: 1,
    from: f(1, 5),
    answer: f(3, 5),
    hint: "格子一样大，直接数格子",
  },
  {
    id: "p5",
    skill: "F4",
    prompt: "从 5/6 往回退 2/6，落在哪？",
    ticks: 6,
    max: 1,
    from: f(5, 6),
    answer: f(3, 6),
    hint: "往回数 2 格",
  },
  {
    id: "p6",
    skill: "F3",
    prompt: "找一个和 2/3 一样大的位置（这条线分成了 9 格）",
    ticks: 9,
    max: 1,
    from: null,
    answer: f(6, 9),
    hint: "3 格变 9 格，每格拆成了 3 小格",
  },
  {
    id: "p7",
    skill: "F5",
    prompt: "1/2 和 1/3 都要落在同一条线上，这条线至少分成几格？拖到那个格数",
    ticks: 12,
    max: 1,
    from: null,
    answer: f(6, 12),
    hint: "6 格能同时装下一半和三分之一",
  },
  {
    id: "p8",
    skill: "F6",
    prompt: "从 1/2 往前走 1/4，落在哪？",
    ticks: 4,
    max: 1,
    from: f(2, 4),
    answer: f(3, 4),
    hint: "先把 1/2 看成 2/4",
  },
  {
    id: "p9",
    skill: "F6",
    prompt: "从 2/3 往前走 1/6，落在哪？",
    ticks: 6,
    max: 1,
    from: f(4, 6),
    answer: f(5, 6),
    hint: "2/3 就是 4/6",
  },
  {
    id: "p10",
    skill: "F7",
    prompt: "把标记拖到 3/5 和 4/5 之间那条线上更大的那个",
    ticks: 5,
    max: 1,
    from: null,
    answer: f(4, 5),
    hint: "格子一样大时，走得远的更大",
  },
];

/** 按层分组的练习题，断点定位之后用来针对性补 */
export const PRACTICE_BY_SKILL: Record<FractionSkill, FractionTask[]> = {
  F1: [
    {
      id: "f1-1",
      skill: "F1",
      prompt: "把标记拖到 1/3",
      ticks: 3,
      max: 1,
      from: null,
      answer: f(1, 3),
      hint: "分成 3 格，走 1 格",
    },
    {
      id: "f1-2",
      skill: "F1",
      prompt: "把标记拖到 5/8",
      ticks: 8,
      max: 1,
      from: null,
      answer: f(5, 8),
      hint: "分成 8 格，走 5 格",
    },
    {
      id: "f1-3",
      skill: "F1",
      prompt: "把标记拖到 2/2（也就是一整条）",
      ticks: 2,
      max: 1,
      from: null,
      answer: f(2, 2),
      hint: "分子和分母一样大，就是满的",
    },
  ],
  F2: [
    {
      id: "f2-1",
      skill: "F2",
      prompt: "把标记拖到 7/10",
      ticks: 10,
      max: 1,
      from: null,
      answer: f(7, 10),
      hint: "10 格里的第 7 格",
    },
    {
      id: "f2-2",
      skill: "F2",
      prompt: "把标记拖到 1/8",
      ticks: 8,
      max: 1,
      from: null,
      answer: f(1, 8),
      hint: "8 格里的第 1 格，很靠左",
    },
  ],
  F3: [
    {
      id: "f3-1",
      skill: "F3",
      prompt: "找一个和 1/2 一样大的位置（分成了 8 格）",
      ticks: 8,
      max: 1,
      from: null,
      answer: f(4, 8),
      hint: "一半就是 8 格里的 4 格",
    },
    {
      id: "f3-2",
      skill: "F3",
      prompt: "找一个和 3/4 一样大的位置（分成了 8 格）",
      ticks: 8,
      max: 1,
      from: null,
      answer: f(6, 8),
      hint: "4 格变 8 格，每格拆成了 2 小格",
    },
    {
      id: "f3-3",
      skill: "F3",
      prompt: "找一个和 2/6 一样大的位置（分成了 3 格）",
      ticks: 3,
      max: 1,
      from: null,
      answer: f(1, 3),
      hint: "6 格并成 3 格，两小格并成一格",
    },
  ],
  F4: [
    {
      id: "f4-1",
      skill: "F4",
      prompt: "从 2/7 往前走 3/7，落在哪？",
      ticks: 7,
      max: 1,
      from: f(2, 7),
      answer: f(5, 7),
      hint: "格子一样大，往前数 3 格",
    },
    {
      id: "f4-2",
      skill: "F4",
      prompt: "从 7/8 往回退 3/8，落在哪？",
      ticks: 8,
      max: 1,
      from: f(7, 8),
      answer: f(4, 8),
      hint: "往回数 3 格",
    },
    {
      id: "f4-3",
      skill: "F4",
      prompt: "从 1/4 往前走 2/4，落在哪？",
      ticks: 4,
      max: 1,
      from: f(1, 4),
      answer: f(3, 4),
      hint: "往前数 2 格",
    },
  ],
  F5: [
    {
      id: "f5-1",
      skill: "F5",
      prompt: "1/3 和 1/4 要落在同一条线上，这条线至少分成几格？拖到那个格数",
      ticks: 12,
      max: 1,
      from: null,
      answer: f(12, 12),
      hint: "12 格能同时装下三分之一和四分之一",
    },
    {
      id: "f5-2",
      skill: "F5",
      prompt: "把 1/2 换成用 10 格来数，它在哪？",
      ticks: 10,
      max: 1,
      from: null,
      answer: f(5, 10),
      hint: "10 格的一半是 5 格",
    },
  ],
  F6: [
    {
      id: "f6-1",
      skill: "F6",
      prompt: "从 1/3 往前走 1/6，落在哪？",
      ticks: 6,
      max: 1,
      from: f(2, 6),
      answer: f(3, 6),
      hint: "1/3 就是 2/6",
    },
    {
      id: "f6-2",
      skill: "F6",
      prompt: "从 3/4 往回退 1/8，落在哪？",
      ticks: 8,
      max: 1,
      from: f(6, 8),
      answer: f(5, 8),
      hint: "3/4 就是 6/8",
    },
    {
      id: "f6-3",
      skill: "F6",
      prompt: "从 1/2 往前走 1/6，落在哪？",
      ticks: 6,
      max: 1,
      from: f(3, 6),
      answer: f(4, 6),
      hint: "1/2 就是 3/6",
    },
  ],
  F7: [
    {
      id: "f7-1",
      skill: "F7",
      prompt: "2/7 和 5/7，把标记拖到大的那个",
      ticks: 7,
      max: 1,
      from: null,
      answer: f(5, 7),
      hint: "格子一样大，走得远的更大",
    },
    {
      id: "f7-2",
      skill: "F7",
      prompt: "1/2 和 1/5，把标记拖到大的那个（线分成了 10 格）",
      ticks: 10,
      max: 1,
      from: null,
      answer: f(5, 10),
      hint: "分的份数越多，每一份反而越小",
    },
  ],
};

/** 一轮闭环多少题 —— 十题做完当场结束，不留「下次接着」 */
export const TASKS_PER_ROUND = 10;
