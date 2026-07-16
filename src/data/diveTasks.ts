// 潜水算术题库 —— 纯数据与工具函数，与渲染无关（可被测试直接 import）

export type NodeId =
  | "K1"
  | "K3"
  | "K5"
  | "K6"
  | "K7"
  | "K8"
  | "K9"
  | "K10"
  | "K11"
  | "K12"
  | "K13"
  | "K14"
  | "K16"
  | "K17"
  | "K19"
  | "K20";

export const NODE_NAME: Record<NodeId, string> = {
  K1: "正负数",
  K3: "数轴",
  K5: "相反数",
  K6: "绝对值",
  K7: "比大小",
  K8: "加法",
  K9: "加法运算律",
  K10: "减法",
  K11: "加减混合",
  K12: "乘法",
  K14: "除法",
  K13: "乘法运算律",
  K16: "乘除混合",
  K17: "乘方",
  K19: "综合闯关",
  K20: "近似数",
};

// 数轴范围：所有题目的位置都必须落在这个区间内（validateDiveTasks 会校验）
export const DIVE_MAX = 8;
export const DIVE_MIN = -8;

export function signed(n: number) {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}
export function moveLabel(dir: "up" | "down", dist: number) {
  return dir === "up" ? `上浮 ${dist} 米` : `下潜 ${dist} 米`;
}
export function readout(v: number) {
  if (v > 0) return `水面上 ${v} 米`;
  if (v < 0) return `水下 ${Math.abs(v)} 米`;
  return "正好在海面";
}

export interface Step {
  from: number;
  to: number;
  dir: "up" | "down";
  dist: number;
  main: string;
  why: string;
}

export interface Task {
  node: NodeId;
  title: string; // 顶部大字（算式或问题）
  tip: string; // 小灰字提示
  startAt: number; // 海螺初始位置
  ghosts: { v: number; label: string }[]; // 参考标记（比大小的两个选项 / 绝对值的给定点）
  steps: Step[];
  recap: string; // 过关后的小结
}

// 单步任务（放位置 / 相反数 / 绝对值 / 比大小）
function single(
  node: NodeId,
  title: string,
  tip: string,
  startAt: number,
  target: number,
  main: string,
  why: string,
  recap: string,
  ghosts: { v: number; label: string }[] = []
): Task {
  const dir: "up" | "down" = target >= startAt ? "up" : "down";
  return {
    node,
    title,
    tip,
    startAt,
    ghosts,
    steps: [
      {
        from: startAt,
        to: target,
        dir,
        dist: Math.abs(target - startAt),
        main,
        why,
      },
    ],
    recap,
  };
}

// 加减法走格（两步）
function walk(a: number, op: "+" | "-", b: number, tip: string): Task {
  const node: NodeId = op === "+" ? "K8" : "K10";
  const step1Dir: "up" | "down" = a >= 0 ? "up" : "down";
  const delta = op === "+" ? b : -b;
  const answer = a + delta;
  const step2Dir: "up" | "down" = delta >= 0 ? "up" : "down";
  const why =
    op === "+"
      ? b >= 0
        ? "加正数 → 上浮"
        : "加负数 → 往下潜"
      : b >= 0
        ? "减正数 → 掉头下潜"
        : "减负数 → 掉两次头，上浮";
  const title = `(${signed(a)}) ${op} (${signed(b)})`;
  return {
    node,
    title,
    tip,
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: a,
        dir: step1Dir,
        dist: Math.abs(a),
        main: moveLabel(step1Dir, Math.abs(a)),
        why: "先到起点",
      },
      {
        from: a,
        to: answer,
        dir: step2Dir,
        dist: Math.abs(delta),
        main: moveLabel(step2Dir, Math.abs(delta)),
        why,
      },
    ],
    recap: `从海面出发，先${moveLabel(step1Dir, Math.abs(a))}、再${moveLabel(step2Dir, Math.abs(delta))}，停在${readout(answer)}。所以 ${title} = ${answer}`,
  };
}

export const ALL_TASKS: Task[] = [
  // K1 正负数：把海螺放到情境说的位置
  single(
    "K1",
    "把小海螺放到「水下 3 米」",
    "潜下去是负数，浮上来是正数",
    0,
    -3,
    "游到「水下 3 米」",
    "潜 = 负数",
    "水下 3 米就是 −3"
  ),
  single(
    "K1",
    "把小海螺放到「水上 2 米」",
    "潜下去是负数，浮上来是正数",
    0,
    2,
    "游到「水上 2 米」",
    "浮 = 正数",
    "水上 2 米就是 +2"
  ),
  single(
    "K1",
    "把小海螺放到「水下 6 米」",
    "数字越大，潜得越深",
    0,
    -6,
    "游到「水下 6 米」",
    "潜 = 负数",
    "水下 6 米就是 −6"
  ),
  // K3 数轴：直接游到指定的数
  single(
    "K3",
    "把海螺游到 +5",
    "上为正，下为负",
    0,
    5,
    "游到 +5",
    "正数在海面上方",
    "+5 在海面上方第 5 格"
  ),
  single(
    "K3",
    "把海螺游到 −4",
    "上为正，下为负",
    0,
    -4,
    "游到 −4",
    "负数在海面下方",
    "−4 在海面下方第 4 格"
  ),
  single(
    "K3",
    "把海螺游到 −7",
    "上为正，下为负",
    0,
    -7,
    "游到 −7",
    "负数在海面下方",
    "−7 在海面下方第 7 格"
  ),
  // K5 相反数：从给定位置翻到对称的另一侧
  single(
    "K5",
    "找出 −3 的相反数",
    "相反数：数字一样，符号相反",
    -3,
    3,
    "把海螺翻到对称的位置",
    "−3 的相反数是 +3",
    "−3 ↔ +3，海面就是那面镜子"
  ),
  single(
    "K5",
    "找出 +5 的相反数",
    "相反数：数字一样，符号相反",
    5,
    -5,
    "把海螺翻到对称的位置",
    "+5 的相反数是 −5",
    "+5 ↔ −5，离海面一样远，方向相反"
  ),
  single(
    "K5",
    "找出 −6 的相反数",
    "相反数：数字一样，符号相反",
    -6,
    6,
    "把海螺翻到对称的位置",
    "−6 的相反数是 +6",
    "−6 ↔ +6"
  ),
  // K6 绝对值：给定点在下方（幽灵），游到代表「离海面距离」的数
  single(
    "K6",
    "−5 离海面多远？",
    "绝对值：只看离海面多远，不看上下",
    0,
    5,
    "游到代表这个距离的数",
    "距离不分方向，都取正",
    "|−5| = 5",
    [{ v: -5, label: "−5 在这" }]
  ),
  single(
    "K6",
    "+4 离海面多远？",
    "绝对值：只看离海面多远，不看上下",
    0,
    4,
    "游到代表这个距离的数",
    "距离不分方向，都取正",
    "|+4| = 4",
    [{ v: 4, label: "+4 在这" }]
  ),
  single(
    "K6",
    "−8 离海面多远？",
    "绝对值：只看离海面多远，不看上下",
    0,
    8,
    "游到代表这个距离的数",
    "距离不分方向，都取正",
    "|−8| = 8",
    [{ v: -8, label: "−8 在这" }]
  ),
  // K7 比大小：两个选项（幽灵），游到更大的那个
  single(
    "K7",
    "−2 和 −5，谁更大？",
    "越往上越大；负数潜得越深反而越小",
    0,
    -2,
    "游到更大的那个数",
    "−2 比 −5 浅，所以更大",
    "−2 > −5",
    [
      { v: -2, label: "−2" },
      { v: -5, label: "−5" },
    ]
  ),
  single(
    "K7",
    "+3 和 −4，谁更大？",
    "正数一定比负数大",
    0,
    3,
    "游到更大的那个数",
    "+3 在海面上，比 −4 大",
    "+3 > −4",
    [
      { v: 3, label: "+3" },
      { v: -4, label: "−4" },
    ]
  ),
  single(
    "K7",
    "−6 和 −1，谁更大？",
    "越往上越大；负数潜得越深反而越小",
    0,
    -1,
    "游到更大的那个数",
    "−1 比 −6 浅，所以更大",
    "−1 > −6",
    [
      { v: -1, label: "−1" },
      { v: -6, label: "−6" },
    ]
  ),
  // K8 加法：走格
  walk(2, "+", 3, "两次都往上浮，先热个身。"),
  walk(3, "+", -5, "加一个负数，就是往下潜！"),
  walk(-4, "+", 6, "从水里往上浮，会冲出海面。"),
  // K10 减法：走格
  walk(-2, "-", 3, "减法要掉头——减正数就是往下潜。"),
  walk(1, "-", -4, "减一个负数，掉两次头，反而往上浮！"),
  // K9 加法运算律：交换律——a+b 和 b+a 终点一样
  {
    node: "K9" as NodeId,
    title: "(−3) + 5",
    tip: "先往下再往上，终点在哪？",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: -3,
        dir: "down" as const,
        dist: 3,
        main: moveLabel("down", 3),
        why: "先走 −3",
      },
      {
        from: -3,
        to: 2,
        dir: "up" as const,
        dist: 5,
        main: moveLabel("up", 5),
        why: "再走 +5",
      },
    ],
    recap:
      "从海面出发，下潜 3 米、再上浮 5 米，停在 水面上 2 米。所以 (−3)+5 = 2",
  },
  {
    node: "K9" as NodeId,
    title: "5 + (−3)",
    tip: "上一关倒过来走——先上浮再下潜",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: 5,
        dir: "up" as const,
        dist: 5,
        main: moveLabel("up", 5),
        why: "先走 +5",
      },
      {
        from: 5,
        to: 2,
        dir: "down" as const,
        dist: 3,
        main: moveLabel("down", 3),
        why: "再走 −3",
      },
    ],
    recap:
      "先上浮 5、再下潜 3，还是停在 水面上 2 米！和 (−3)+5 答案一样 —— 这就是加法交换律：顺序可以换，终点不会变。",
  },
  // K11 加减混合：三步走
  {
    node: "K11" as NodeId,
    title: "2 − 3 + 5",
    tip: "加减混在一起，一步一步来",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: 2,
        dir: "up" as const,
        dist: 2,
        main: moveLabel("up", 2),
        why: "先到 +2",
      },
      {
        from: 2,
        to: -1,
        dir: "down" as const,
        dist: 3,
        main: moveLabel("down", 3),
        why: "−3 往下潜",
      },
      {
        from: -1,
        to: 4,
        dir: "up" as const,
        dist: 5,
        main: moveLabel("up", 5),
        why: "+5 往上浮",
      },
    ],
    recap:
      "2 → 下潜 3 → −1 → 上浮 5 → 4。所以 2−3+5 = 4。混合运算就是一步接一步走，不着急。",
  },
  {
    node: "K11" as NodeId,
    title: "(−1) + 4 − 6",
    tip: "加减混合，注意每次的方向",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: -1,
        dir: "down" as const,
        dist: 1,
        main: moveLabel("down", 1),
        why: "先到 −1",
      },
      {
        from: -1,
        to: 3,
        dir: "up" as const,
        dist: 4,
        main: moveLabel("up", 4),
        why: "+4 往上浮",
      },
      {
        from: 3,
        to: -3,
        dir: "down" as const,
        dist: 6,
        main: moveLabel("down", 6),
        why: "−6 往下潜",
      },
    ],
    recap:
      "−1 → 上浮 4 → 3 → 下潜 6 → −3。所以 (−1)+4−6 = −3。所有减法都可以变成加相反数，然后一步接一步走。",
  },
  // K12 乘法：= 重复走
  {
    node: "K12" as NodeId,
    title: "2 × (−3)",
    tip: "乘法就是重复走——下潜 3 米，走 2 次",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: -3,
        dir: "down" as const,
        dist: 3,
        main: "第 1 次下潜 3 米",
        why: "正 × 负 = 负",
      },
      {
        from: -3,
        to: -6,
        dir: "down" as const,
        dist: 3,
        main: "第 2 次下潜 3 米",
        why: "重复走，方向不变",
      },
    ],
    recap:
      '下潜 3 米、走 2 次 = 水下 6 米。所以 2×(−3) = −6。"正数"次重复负数 → 还是负数。',
  },
  {
    node: "K12" as NodeId,
    title: "(−2) × 3",
    tip: "负的倍数 = 反方向重复走",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: -6,
        dir: "down" as const,
        dist: 6,
        main: "反向！下潜 6 米",
        why: "负号 = 掉头",
      },
    ],
    recap:
      "−2 次上浮 3 = 2 次反向（下潜 3）= 2 次 × 下潜 3 = −6。所以 (−2)×3 = −6",
  },
  {
    node: "K12" as NodeId,
    title: "(−2) × (−3)",
    tip: "两个负号 —— 两次掉头，又回到原方向！",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: 3,
        dir: "up" as const,
        dist: 3,
        main: "第 1 次上浮 3 米",
        why: "负 × 负 = 正！",
      },
      {
        from: 3,
        to: 6,
        dir: "up" as const,
        dist: 3,
        main: "第 2 次上浮 3 米",
        why: "方向翻回来了",
      },
    ],
    recap:
      '两个负号互相抵消，变成正方向——上浮 3 米 × 2 次 = 6。所以 (−2)×(−3) = +6。这就是"负负得正"！',
  },
  // K14 除法：几分之一 / 逆运算
  {
    node: "K14" as NodeId,
    title: "6 ÷ (−2)",
    tip: "除法就是分份——每次下潜 2 米，几次到 0？",
    startAt: 6,
    ghosts: [],
    steps: [
      {
        from: 6,
        to: 4,
        dir: "down" as const,
        dist: 2,
        main: "第 1 次下潜 2 米",
        why: "每次少 2",
      },
      {
        from: 4,
        to: 2,
        dir: "down" as const,
        dist: 2,
        main: "第 2 次下潜 2 米",
        why: "",
      },
      {
        from: 2,
        to: 0,
        dir: "down" as const,
        dist: 2,
        main: "第 3 次下潜 2 米",
        why: "3 次回海面",
      },
    ],
    recap:
      "从 6 开始，每次下潜 2 米，3 次回到海面。所以 6÷(−2) = −3（因为方向是负的）。正 ÷ 负 = 负。",
  },
  {
    node: "K14" as NodeId,
    title: "(−8) ÷ 4",
    tip: "从水下 8 米开始，每次上浮 4 米，几次回海面？",
    startAt: -8,
    ghosts: [],
    steps: [
      {
        from: -8,
        to: -4,
        dir: "up" as const,
        dist: 4,
        main: "第 1 次上浮 4 米",
        why: "每次加 4",
      },
      {
        from: -4,
        to: 0,
        dir: "up" as const,
        dist: 4,
        main: "第 2 次上浮 4 米",
        why: "2 次回海面",
      },
    ],
    recap:
      "从 −8 开始，每次上浮 4 米，2 次回到海面。所以 (−8)÷4 = −2。负 ÷ 正 = 负。",
  },
  // K17 乘方：自己乘自己
  {
    node: "K17" as NodeId,
    title: "(−2)²",
    tip: "乘方就是自己乘自己——(−2)×(−2)",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: 2,
        dir: "up" as const,
        dist: 2,
        main: "第 1 次上浮 2 米",
        why: "负×负=正 → 第1次",
      },
      {
        from: 2,
        to: 4,
        dir: "up" as const,
        dist: 2,
        main: "第 2 次上浮 2 米",
        why: "两个负数，结果为正",
      },
    ],
    recap: "(−2)² = (−2)×(−2) = +4。偶数次乘方，负数变正数！",
  },
  {
    node: "K17" as NodeId,
    title: "(−2)³",
    tip: "三次方——(−2)×(−2)×(−2)",
    startAt: 0,
    ghosts: [{ v: 4, label: "第一步 (−2)×(−2)=+4" }],
    steps: [
      {
        from: 0,
        to: -8,
        dir: "down" as const,
        dist: 8,
        main: "−8 直接到达",
        why: "两个负号抵消变 +4，再乘一个(−2) = −8",
      },
    ],
    recap:
      "(−2)³ = −8。奇数次乘方，负数还是负的！规律：负数的偶次方是正的，奇次方是负的。",
  },
  // K19 综合闯关：混合运算顺序
  {
    node: "K19" as NodeId,
    title: "先乘方再加减：2 − (−3)²",
    tip: "先算乘方，再算减法——顺序很重要",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: 2,
        dir: "up" as const,
        dist: 2,
        main: "先到 2",
        why: "不管乘方",
      },
      {
        from: 2,
        to: -7,
        dir: "down" as const,
        dist: 9,
        main: "(−3)²=9 → 减 9，下潜 9 米",
        why: "乘方优先！",
      },
    ],
    recap: "先算 (−3)² = 9，再算 2−9 = −7。运算顺序：乘方 > 乘除 > 加减。",
  },
  {
    node: "K19" as NodeId,
    title: "括号里的先算：(2−5)×(−2)",
    tip: "括号里的是第一步，算完再乘",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: -3,
        dir: "down" as const,
        dist: 3,
        main: "2−5=−3 → 下潜 3 米",
        why: "括号优先！",
      },
      {
        from: -3,
        to: 6,
        dir: "up" as const,
        dist: 9,
        main: "(−3)×(−2)=6 → 上浮 9 米",
        why: "负负得正",
      },
    ],
    recap:
      "先算括号里的 2−5 = −3，再算 (−3)×(−2) = +6。运算顺序：括号 → 乘除 → 加减。",
  },
  // K13 乘法运算律：分配律
  {
    node: "K13" as NodeId,
    title: "2 × (3+1) = 2×3 + 2×1",
    tip: '分配律——把乘法"分"给括号里的每一项',
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: 6,
        dir: "up" as const,
        dist: 6,
        main: "先算 2×3=6 → 上浮 6 米",
        why: "括号里的 3 先被乘",
      },
      {
        from: 6,
        to: 8,
        dir: "up" as const,
        dist: 2,
        main: "再算 2×1=2 → 上浮 2 米",
        why: "括号里的 1 也被乘",
      },
    ],
    recap:
      '2×(3+1) = 2×3 + 2×1 = 6+2 = 8。乘法分配律：把外面那个数"分"给括号里的每一项，然后加起来。',
  },
  {
    node: "K13" as NodeId,
    title: "(−2) × 3 + (−2) × 1",
    tip: "反过来用——把公因数提出来",
    startAt: 0,
    ghosts: [],
    steps: [
      {
        from: 0,
        to: -6,
        dir: "down" as const,
        dist: 6,
        main: "(−2)×3 = −6 → 下潜 6 米",
        why: "第一项",
      },
      {
        from: -6,
        to: -8,
        dir: "down" as const,
        dist: 2,
        main: "(−2)×1 = −2 → 再下潜 2 米",
        why: "加第二项",
      },
    ],
    recap:
      "(−2)×3 + (−2)×1 = −8。反过来就是 (−2)×(3+1) = (−2)×4 = −8。一样的答案——分配律正反都能用！",
  },
  // K16 乘除混合
  {
    node: "K16" as NodeId,
    title: "6 ÷ 2 × (−3)",
    tip: "乘除混合——从左到右一步一步",
    startAt: 6,
    ghosts: [],
    steps: [
      {
        from: 6,
        to: 3,
        dir: "down" as const,
        dist: 3,
        main: "6÷2=3 → 下潜到 3 米",
        why: "先算除法",
      },
      {
        from: 3,
        to: -6,
        dir: "down" as const,
        dist: 9,
        main: "3×(−3)=−9 → 下潜 9 米",
        why: "再算乘法",
      },
    ],
    recap: "6÷2×(−3) = 3×(−3) = −9。乘除混合从左到右算：先除再乘。",
  },
  {
    node: "K16" as NodeId,
    title: "(−8) ÷ 4 × (−2)",
    tip: "乘除混合——注意符号变化",
    startAt: -8,
    ghosts: [],
    steps: [
      {
        from: -8,
        to: -2,
        dir: "up" as const,
        dist: 6,
        main: "(−8)÷4=−2 → 上浮到 −2",
        why: "负÷正=负",
      },
      {
        from: -2,
        to: 4,
        dir: "up" as const,
        dist: 6,
        main: "(−2)×(−2)=+4 → 上浮到 4",
        why: "负×负=正",
      },
    ],
    recap: "(−8)÷4×(−2) = (−2)×(−2) = +4。符号变化：负÷正=负，负×负=正。",
  },
  // K20 近似数：四舍五入
  {
    node: "K20" as NodeId,
    title: "3.7 近似到最近的整数",
    tip: "四舍五入——看十分位，≥5 就进位",
    startAt: 0,
    ghosts: [{ v: 3.7, label: "3.7 在这" }],
    steps: [
      {
        from: 0,
        to: 4,
        dir: "up" as const,
        dist: 4,
        main: "游到最近的整数 4",
        why: "十分位 7≥5 → 进位",
      },
    ],
    recap: "3.7 → 十分位是 7（≥5），向整数部分进 1，约等于 4。这就是四舍五入。",
  },
  {
    node: "K20" as NodeId,
    title: "−2.3 近似到最近的整数",
    tip: "负数也四舍五入——看数字部分，不看符号",
    startAt: 0,
    ghosts: [{ v: -2.3, label: "−2.3 在这" }],
    steps: [
      {
        from: 0,
        to: -2,
        dir: "down" as const,
        dist: 2,
        main: "游到最近的整数 −2",
        why: "十分位 3<5 → 舍去",
      },
    ],
    recap:
      "−2.3 → 十分位是 3（<5），舍去，约等于 −2。负数也一样：看数字部分四舍五入，符号不变。",
  },
];
