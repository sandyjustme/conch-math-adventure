# MVP 实现计划

> 目标：有理数章节完整可用
> 起点：math-diagnostic-demo-v3.tsx
> 预计阶段：5 个

---

## 阶段一：项目骨架搭建

### 1.1 初始化项目

- 用 Vite + React + TypeScript 创建项目
- 安装依赖：Tailwind CSS、ZCOOL KuaiLe + Noto Sans SC 字体
- 配置 tsconfig、eslint、prettier

### 1.2 目录结构

```
src/
├── App.tsx                    # 路由 + 全局状态
├── main.tsx
├── components/
│   ├── cafe/                  # 咖啡馆大厅
│   │   ├── CafeHall.tsx       # 大厅主组件
│   │   ├── Greeting.tsx       # 海小螺打招呼
│   │   └── NavCards.tsx       # 四大入口卡片
│   ├── adventure/             # 探险对话
│   │   ├── AdventureChat.tsx  # 对话主组件（复用 v3 逻辑）
│   │   ├── OceanLine.tsx      # 海洋数轴（从 v3 提取）
│   │   ├── ChatBubble.tsx     # 聊天气泡
│   │   └── LevelBar.tsx       # 知识点进度条
│   ├── games/                 # 游戏角
│   │   ├── GameCorner.tsx     # 游戏角主界面
│   │   ├── BubbleJump.tsx     # 海底跳跃
│   │   └── ShellCollector.tsx # 贝壳收集（入门游戏）
│   ├── collection/            # 贝壳图鉴
│   │   └── ShellAlbum.tsx     # 收藏册
│   ├── redeem/                # 兑换吧台
│   │   └── RedeemBar.tsx      # 兑换面板（复用 v3 ShellPanel）
│   ├── map/                   # 藏宝图
│   │   └── TreasureMap.tsx    # 知识地图（迷雾+已解锁岛屿）
│   └── shared/                # 共享组件
│       ├── ShellCounter.tsx   # 贝壳计数器
│       └── SoundToggle.tsx    # 声音开关
├── engine/                    # 学习引擎（纯逻辑）
│   ├── diagnostic.ts          # 诊断引擎：沿知识图谱回溯
│   ├── knowledgeGraph.ts      # 知识图谱数据结构 + 有理数数据
│   ├── spacedRepetition.ts    # 间隔偷袭调度器
│   ├── levelManager.ts        # 关卡解锁逻辑
│   └── rewardEngine.ts        # 奖励判定（珍珠 vs 碎片）
├── services/
│   ├── ai.ts                  # Claude API 调用封装
│   ├── tts.ts                 # 火山引擎 TTS 封装
│   ├── stt.ts                 # Web Speech API 封装
│   └── audio.ts               # 音效 + 背景音管理
├── store/
│   └── useStore.ts            # Zustand 全局状态
├── data/
│   ├── knowledgeGraph.json    # 有理数知识图谱数据
│   └── gameConfig.ts          # 游戏配置（兑换比例等）
├── hooks/
│   ├── useShells.ts           # 贝壳持久化 hook
│   ├── useAudio.ts            # 音频 hook
│   └── useDiagnostic.ts       # 诊断状态 hook
└── types/
    └── index.ts               # 类型定义
```

### 1.3 全局状态设计（Zustand）

```typescript
interface AppState {
  // 用户
  currentView: "cafe" | "adventure" | "games" | "album" | "redeem" | "map";

  // 贝壳经济
  fragments: number; // 贝壳碎片
  pearls: number; // 珍珠
  rareShells: RareShell[]; // 稀有贝壳

  // 进度
  currentNodeId: string; // 当前知识点
  masteredNodes: string[]; // 已掌握知识点
  unlockedNodes: string[]; // 已解锁（但未必掌握）

  // 间隔偷袭
  偷袭Schedule: SneakAttack[]; // 待触发的偷袭任务

  // 语音
  ttsEnabled: boolean;
  sttEnabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;

  // 签到
  lastLoginDate: string;
  consecutiveDays: number;
}
```

---

## 阶段二：知识图谱 + 诊断引擎

### 2.1 知识图谱数据结构

- 将 `有理数知识图谱 初稿.md` 转为结构化 JSON
- 每个节点包含：id、name、dependencies、elementaryDeps、breakpointRisk、hooks、emotionalAnchors、variants
- 验证依赖链的拓扑正确性（无循环依赖）

### 2.2 诊断引擎

- 输入：当前节点 ID、AI 对话中的答题记录
- 输出：建议回退到的节点 ID + 置信度
- 逻辑：从入口节点出发，答错 ≥2 次 → 沿依赖链回溯一个节点 → 递归
- 前端行为数据（回答延迟、游戏角表现）作为辅助权重

### 2.3 关卡解锁逻辑

- 节点的所有强依赖节点都已掌握 → 节点解锁
- 掌握条件：费曼讲解通过 + 变式练习正确率 ≥ 90%

---

## 阶段三：咖啡馆大厅 + 四大入口

### 3.1 咖啡馆大厅

- 背景：海底咖啡馆插画（CSS/SVG）
- 海小螺打招呼（根据上次登录时间、连续签到天数动态变化）
- 四大入口卡片：今日探险（最大）、游戏角、藏宝图、贝壳图鉴
- 右上角：贝壳计数器 + 声音开关
- 底部角落：兑换吧台入口

### 3.2 藏宝图

- 知识点以岛屿形式展示
- 已解锁岛屿可见（含名称和简短描述）
- 未解锁区域显示为迷雾
- 当前位置高亮（海小螺图标站在当前岛屿上）
- 已掌握岛屿上有旗帜标记

### 3.3 贝壳图鉴

- 碎片、珍珠、稀有贝壳分区展示
- 稀有贝壳每只有名称 + 获得日期 + 获得故事
- 徽章挂在封面区域

### 3.4 兑换吧台

- 从 v3 ShellPanel 提取并改造
- 显示当前珍珠数量、距下次兑换差几颗
- 生成兑换码 + 兑换记录

---

## 阶段四：探险对话（核心）

### 4.1 从 v3 重构

- 提取 OceanLine、ChatBubble、LevelBar 为独立组件
- AI 调用逻辑抽到 `services/ai.ts`
- 贝壳奖励逻辑抽到 `engine/rewardEngine.ts`
- 知识点定位标记 `<!--LEVEL:Kx-->` 与诊断引擎联动

### 4.2 四层引擎集成

- 诊断层：对话开始时确定起点知识点
- 学习层：AI prompt 引导 CPA 路径（通过 system prompt 规则保证）
- 练习层：同知识点内自动换变式（AI 根据 knowledgeGraph 中的 variants 模板出题）
- 检验层：费曼讲解触发（AI prompt 检测到稳定正确时自动发起"你教教我"）

### 4.3 与诊断引擎联动

- 每次 AI 回复后，前端解析 `<!--LEVEL:Kx-->` 和 `<!--REWARD:n-->`
- 答题记录（正确/错误/延迟）写入本地
- 诊断引擎根据累计记录决定是否回退/前进

### 4.4 LevelBar 改造

- v3 的 10 节点水平进度条 → 改为只显示已完成 + 当前 + 下一关（最多 3 个），避免压迫感
- 当前节点有呼吸光效

---

## 阶段五：语音层

### 5.1 TTS（火山引擎）

- 封装火山引擎 TTS API（流式合成）
- 实现首句快速播放 + 后续排队缓冲
- 缓存已合成语音（相同文本不重复请求）
- 语音播放时聊天框有"播放中"指示器

### 5.2 STT（Web Speech API）

- 按住 🎤 按钮开始录音 → 松开发送
- 录音中按钮有动画反馈
- 浏览器不支持时降级为纯文本输入

### 5.3 音效 + 背景音

- 音效：答对叮、贝壳收集、珍珠获得、升级庆典、错误提醒
- 背景音：咖啡馆（轻音乐）、海底探险（气泡水声）、游戏角（活泼节奏）
- 音量独立控制（TTS、音效、BGM 三个滑块）
- 使用 Web Audio API，本地音频文件

---

## 阶段六：游戏角

### 6.1 海底跳跃

- Canvas 实现
- 气泡从底部冒出，带数字
- 海小螺角色左右移动（键盘 ← → 或触屏滑动）
- 跳到正确气泡 = 贝壳碎片 +1 + 音效
- 跳到错误气泡 = 气泡破裂 + 轻微震动
- 一局 10 个气泡，右上角倒计时 30 秒
- 结束显示得分 + 获得碎片数

### 6.2 贝壳收集（入门游戏）

- 更简单的入门游戏，门槛极低
- 海底场景，贝壳随机飘落
- 点击贝壳收集，每个贝壳上写一个数字
- 只收集正数（或只收集负数），训练正负数直觉
- 30 秒，无失败条件，只计收集数

---

## 阶段七：记忆锚定引擎

### 7.1 间隔偷袭调度器

- 每个知识点存储：首次掌握时间、最后一次成功提取时间、偷袭间隔级别
- 间隔梯度：[10min, 1d, 3d, 7d, 15d, 30d]
- 每次登录时检查是否有到期的偷袭任务
- 偷袭触发方式：
  - 进咖啡馆时海小螺顺口问（轻量弹窗）
  - 游戏角悄悄调高相关气泡概率
  - 探险对话中混入（由 AI prompt 控制）

### 7.2 遗忘预警

- 超过 30 天未成功提取 → 标记为"待悄悄补救"
- 下次相关探险任务自动调整起点
- 不在 UI 上显示任何"你忘了"的提示

---

## 阶段八：集成 + 本地部署

### 8.1 后端 API 代理

- Vercel Serverless Function 或 Cloudflare Worker
- 端点：
  - `POST /api/chat` — 代理 Claude API
  - `POST /api/tts` — 代理火山引擎 TTS

### 8.2 环境变量

- `CLAUDE_API_KEY`
- `VOLCANO_TTS_APP_ID`
- `VOLCANO_TTS_TOKEN`

### 8.3 本地运行验证

- 前端 `npm run dev` 本地可跑
- API 代理本地或部署到 Vercel 可调通
- 所有功能端到端走通

---

## 执行的依赖关系

```
阶段一（骨架）
  ↓
阶段二（图谱+诊断）──→ 阶段三（大厅+入口）
  ↓                          ↓
阶段四（探险对话）←───────────┘
  ↓
阶段五（语音）  阶段六（游戏角）
  ↓              ↓
阶段七（记忆锚定）
  ↓
阶段八（集成部署）
```

阶段五和阶段六可并行开发。

---

## 预估工时（单人开发）

| 阶段              | 预估天数       |
| ----------------- | -------------- |
| 一、项目骨架      | 1 天           |
| 二、知识图谱+诊断 | 1.5 天         |
| 三、咖啡馆大厅    | 2 天           |
| 四、探险对话      | 2 天           |
| 五、语音层        | 1.5 天         |
| 六、游戏角        | 2 天           |
| 七、记忆锚定      | 1.5 天         |
| 八、集成部署      | 1 天           |
| **合计**          | **约 12.5 天** |
