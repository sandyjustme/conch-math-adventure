import type { KnowledgeNode } from "../types";

export const EXCHANGE_RATE = 5;
export const FRAGMENTS_PER_PEARL = 10;

export const NODES: KnowledgeNode[] = [
  {
    id: "K1",
    name: "正负数",
    chapter: "有理数",
    description: "用负数表示相反意义的量",
    dependencies: [],
    elementaryDeps: ["数的意义与生活情境中量的表示"],
    breakpointRisk: false,
    hooks: ["数轴像大海，海面以上是正数，以下是负数"],
    emotionalAnchors: ["海小螺第一次潜到水下，发现了一个倒过来的世界"],
    variants: [
      { type: "情境变式", template: "温度从0℃下降了{a}度" },
      { type: "情境变式", template: "海拔{a}米（低于海平面）" },
      { type: "表述变式", template: "比0小{a}的数是？" },
    ],
  },
  {
    id: "K2",
    name: "有理数分类",
    chapter: "有理数",
    description: "整数、分数统一归为有理数",
    dependencies: ["K1"],
    elementaryDeps: ["整数的认识", "分数的意义与分类"],
    breakpointRisk: false,
    hooks: ["海里的生物可以按深度分类，数字也一样"],
    emotionalAnchors: ["海小螺开了一个海底图书馆，把所有数字分门别类放好"],
    variants: [
      { type: "情境变式", template: "把{a}、{b}、{c}分到正确的数字家族里" },
      { type: "表述变式", template: "{a}是有理数吗？为什么？" },
    ],
  },
  {
    id: "K3",
    name: "数轴",
    chapter: "有理数",
    description: "原点、正方向、单位长度三要素",
    dependencies: ["K1"],
    elementaryDeps: ["数轴初步（小学）"],
    breakpointRisk: false,
    hooks: ["数轴就是一条海底隧道，每个数字都有自己的房间"],
    emotionalAnchors: ["海小螺在海底隧道里安了家，每个数字都是邻居"],
    variants: [
      { type: "情境变式", template: "在数轴上标出{a}、{b}、{c}的位置" },
      {
        type: "表述变式",
        template: "如果把数轴比作一把尺子，0就是尺子的哪里？",
      },
    ],
  },
  {
    id: "K4",
    name: "数轴表示",
    chapter: "有理数",
    description: "数与数轴上点的对应",
    dependencies: ["K3"],
    elementaryDeps: ["分数、小数在数轴上定位"],
    breakpointRisk: false,
    hooks: ["每个数字在海底隧道里都有一个专属位置"],
    emotionalAnchors: ["帮迷路的数字找到它在隧道里的家"],
    variants: [
      { type: "情境变式", template: "{a}在数轴上大概在什么位置？" },
      { type: "逆向变式", template: "这个点的位置大概是什么数？" },
    ],
  },
  {
    id: "K5",
    name: "相反数",
    chapter: "有理数",
    description: "数轴上关于原点对称",
    dependencies: ["K3", "K4"],
    elementaryDeps: [],
    breakpointRisk: false,
    hooks: ["海小螺照镜子，镜子里是倒过来的自己——这就是相反数"],
    emotionalAnchors: ["海小螺发现海底有一面魔镜，里面的世界左右颠倒"],
    variants: [
      { type: "情境变式", template: "{a}的相反数是多少？" },
      { type: "逆向变式", template: "一个数和它的相反数之和是多少？" },
      { type: "干扰变式", template: "-(-{a})等于多少？" },
    ],
  },
  {
    id: "K6",
    name: "绝对值",
    chapter: "有理数",
    description: "数轴上到原点的距离",
    dependencies: ["K3", "K4", "K5"],
    elementaryDeps: [],
    breakpointRisk: true,
    hooks: ['绝对值就是"离家多远"——不管你在海面上还是海面下，距离只看多远'],
    emotionalAnchors: ["海小螺变成了一条只能往前的射线，拉直了量距离"],
    variants: [
      { type: "情境变式", template: "|-{a}| = ?" },
      { type: "表述变式", template: "海小螺从0游到{a}，游了多远？" },
      { type: "干扰变式", template: "|{a}|和|-{a}|一样吗？为什么？" },
    ],
  },
  {
    id: "K7",
    name: "比大小",
    chapter: "有理数",
    description: "利用数轴比较大小，右边的数大",
    dependencies: ["K3", "K4", "K6"],
    elementaryDeps: ["分数、小数大小比较"],
    breakpointRisk: true,
    hooks: [
      "在海底隧道里，越往右走数字越大——和潜水深度是反的！潜得越深数字反而越小",
    ],
    emotionalAnchors: [
      '海小螺搞了个大乌龙："-5比-3大吧？因为5比3大啊！"让孩子来纠正它',
    ],
    variants: [
      { type: "情境变式", template: "{a}和{b}哪个大？" },
      { type: "情境变式", template: "把{a}、{b}、{c}从小到大排一排" },
      { type: "干扰变式", template: "|-{a}|和-{b}哪个大？为什么？" },
    ],
  },
  {
    id: "K8",
    name: "加法",
    chapter: "有理数",
    description: "有理数加法法则：同号相加、异号相加",
    dependencies: ["K6", "K7"],
    elementaryDeps: ["分数加减法", "小数加减法"],
    breakpointRisk: true,
    hooks: ["潜水+下潜=潜更深（同号），潜水+上浮=看谁力气大（异号）"],
    emotionalAnchors: [
      "海小螺在海底走迷宫，每次加法就是移动一步——同方向越走越远，反方向会抵消",
    ],
    variants: [
      { type: "情境变式", template: "潜到水下{a}米，又下潜{b}米，现在在哪？" },
      { type: "情境变式", template: "温度从-{a}℃上升了{b}℃" },
      {
        type: "逆向变式",
        template: "现在在{a}米，刚才下潜了{b}米，原来在哪？",
      },
      { type: "缺项变式", template: "从{a}出发，到了{b}，是上浮还是下潜？" },
    ],
  },
  {
    id: "K9",
    name: "加法运算律",
    chapter: "有理数",
    description: "交换律、结合律在有理数范围的应用",
    dependencies: ["K8"],
    elementaryDeps: ["加法交换律、结合律（小学）"],
    breakpointRisk: false,
    hooks: [
      "加法的顺序可以换，就像先游到东边再游到西边，还是先西后东，最后到的位置一样",
    ],
    emotionalAnchors: [
      "海小螺发现无论先去看珊瑚还是先去看沉船，一天下来游的总距离都一样",
    ],
    variants: [
      { type: "情境变式", template: "(-{a})+{b}+(-{c}) 怎么算最方便？" },
      { type: "表述变式", template: "交换律在负数里也成立吗？试试看" },
    ],
  },
  {
    id: "K10",
    name: "减法",
    chapter: "有理数",
    description: "减去一个数等于加上它的相反数",
    dependencies: ["K5", "K8"],
    elementaryDeps: [],
    breakpointRisk: true,
    hooks: ['减法就是"转过身去加"——减去下潜，就是加上上浮'],
    emotionalAnchors: [
      "海小螺学会了一种魔法：所有的减法都能变成加法，只要把后面的数字翻个面",
    ],
    variants: [
      { type: "情境变式", template: "在水下{a}米，想浮到{b}米，要怎么算？" },
      { type: "表述变式", template: "{a}-(-{b}) = ?" },
      { type: "逆向变式", template: "{a}-?={b}，空格里应该填什么？" },
    ],
  },
  {
    id: "K11",
    name: "加减混合",
    chapter: "有理数",
    description: "统一为加法的省略加号写法",
    dependencies: ["K8", "K9", "K10"],
    elementaryDeps: [],
    breakpointRisk: false,
    hooks: ['把所有减法变成加法，就像把所有的"回头"都变成"向前"'],
    emotionalAnchors: [
      "海小螺发明了一种简写：省略加号，数轴上只用箭头表示方向",
    ],
    variants: [
      { type: "情境变式", template: "{a}-{b}+{c}-{d} 先统一成加法" },
      {
        type: "表述变式",
        template: "把{a}、{-b}、{c}、{-d}用省略加号的形式写出来",
      },
    ],
  },
  {
    id: "K12",
    name: "乘法",
    chapter: "有理数",
    description: "同号得正、异号得负、绝对值相乘",
    dependencies: ["K1", "K7"],
    elementaryDeps: ["分数乘法", "小数乘法"],
    breakpointRisk: true,
    hooks: ['"同号得正，异号得负"——记住：朋友的朋友是朋友，敌人的朋友是敌人'],
    emotionalAnchors: [
      "海小螺发现：潜到水下，再倒着走，等于往上走——负负得正的秘密",
    ],
    variants: [
      {
        type: "情境变式",
        template: "每天下降{a}米，{b}天后相比现在变化了多少？",
      },
      { type: "干扰变式", template: "(-{a})×(-{b}) 和 {a}×{b} 有什么关系？" },
      { type: "逆向变式", template: "一个数乘以{a}后等于{b}，这个数是多少？" },
    ],
  },
  {
    id: "K13",
    name: "乘法运算律",
    chapter: "有理数",
    description: "交换律、结合律、分配律",
    dependencies: ["K12"],
    elementaryDeps: ["乘法分配律（小学）"],
    breakpointRisk: false,
    hooks: ["乘法的交换、结合、分配律在负数世界也通用，规则没变"],
    emotionalAnchors: ["海小螺验证了乘法的三条定律在海底也成立，高兴地转圈"],
    variants: [
      { type: "情境变式", template: "用分配律算 {a}×({b}+{c})" },
      { type: "表述变式", template: "(-{a})×{b}+{a}×{c} 能提取公因数吗？" },
    ],
  },
  {
    id: "K14",
    name: "除法",
    chapter: "有理数",
    description: "除以一个数等于乘以它的倒数",
    dependencies: ["K12", "K15"],
    elementaryDeps: [],
    breakpointRisk: false,
    hooks: ["除法变乘法的秘诀：把除数倒过来。和减法变加法是一个套路！"],
    emotionalAnchors: [
      "海小螺发现减法和除法的秘密是一样的——都变成了相反的运算",
    ],
    variants: [
      { type: "情境变式", template: "{a}÷(-{b}) = ?" },
      { type: "表述变式", template: "除以一个负数，结果的符号会怎样？" },
    ],
  },
  {
    id: "K15",
    name: "倒数",
    chapter: "有理数",
    description: "乘积为1的两个数",
    dependencies: ["K12"],
    elementaryDeps: ["分数倒数的概念（小学）"],
    breakpointRisk: false,
    hooks: ['倒数就是"翻过来"——分子分母换个位置'],
    emotionalAnchors: ["海小螺把分数翻了个跟头，就变成了倒数"],
    variants: [
      { type: "情境变式", template: "{a}的倒数是多少？" },
      { type: "干扰变式", template: "0有倒数吗？为什么？" },
    ],
  },
  {
    id: "K16",
    name: "乘除混合",
    chapter: "有理数",
    description: "统一为乘法运算",
    dependencies: ["K12", "K14", "K15"],
    elementaryDeps: [],
    breakpointRisk: false,
    hooks: ["乘除混合：先统一成乘法，再算。和加减混合一样，先统一"],
    emotionalAnchors: [
      "海小螺总结：加减小技巧——统一成加法；乘除小技巧——统一成乘法",
    ],
    variants: [
      { type: "情境变式", template: "{a}÷{b}×{c} 先统一成乘法" },
      { type: "表述变式", template: "(-{a})÷(-{b})×(-{c}) = ?" },
    ],
  },
  {
    id: "K17",
    name: "乘方",
    chapter: "有理数",
    description: "正数、负数的乘方规律（奇负偶正）",
    dependencies: ["K12"],
    elementaryDeps: ["乘法的意义"],
    breakpointRisk: false,
    hooks: [
      "乘方就是自己乘以自己，重复几次。负数的乘方：奇数次还是负的，偶数次变成正的",
    ],
    emotionalAnchors: [
      "海小螺玩叠叠乐：每次翻倍，很快就叠得超级高——这就是乘方的力量",
    ],
    variants: [
      { type: "情境变式", template: "(-{a})^{b次方} 结果是正还是负？" },
      { type: "干扰变式", template: "-{a}²和(-{a})²一样吗？" },
    ],
  },
  {
    id: "K18",
    name: "科学记数法",
    chapter: "有理数",
    description: "a×10ⁿ 表示形式",
    dependencies: ["K17"],
    elementaryDeps: ["十进制、位值概念"],
    breakpointRisk: false,
    hooks: ['科学记数法就是把很大或很小的数写成"一个数×10的几次方"'],
    emotionalAnchors: ["海小螺要数清海底有多少粒沙子，发明了科学记数法"],
    variants: [
      { type: "情境变式", template: "把{a}写成科学记数法" },
      { type: "逆向变式", template: "{a}×10^{b次方} 写成普通数字是多少？" },
    ],
  },
  {
    id: "K19",
    name: "综合闯关",
    chapter: "有理数",
    description: "运算顺序：先乘方，再乘除，后加减",
    dependencies: ["K11", "K16", "K17"],
    elementaryDeps: ["四则运算顺序规则"],
    breakpointRisk: true,
    hooks: [
      "综合运算就像做菜：先准备食材（乘方），再切配（乘除），最后下锅（加减）",
    ],
    emotionalAnchors: [
      "海小螺开了海底餐厅，每道菜（每道题）都要按照正确的顺序来做",
    ],
    variants: [
      { type: "情境变式", template: "先算什么？{a}×{b}²-{c}÷{d}" },
      { type: "干扰变式", template: "(-{a})²×{b}-{c}÷(-{d}) 一步一步算" },
      { type: "缺项变式", template: "?×{a}-{b}={c}，问号处填什么？" },
    ],
  },
  {
    id: "K20",
    name: "近似数",
    chapter: "有理数",
    description: "精确度的表达",
    dependencies: ["K18"],
    elementaryDeps: ["四舍五入"],
    breakpointRisk: false,
    hooks: ["生活中不需要超级精确的数字，知道大概就够了——这就是近似数"],
    emotionalAnchors: [
      '海小螺估算海底宝藏的数量，"大概300颗珍珠"比"287颗"更实用',
    ],
    variants: [
      { type: "情境变式", template: "把{a}精确到十分位" },
      { type: "表述变式", template: "什么情况下用近似数比精确数更好？" },
    ],
  },
];

export const NODE_MAP = new Map(NODES.map((n) => [n.id, n]));

export const CHAPTER_ORDER = [
  "有理数",
  "整式的加减",
  "一元一次方程",
  "几何图形初步",
];

export const DIAGNOSIS_ENTRY = "K19";
