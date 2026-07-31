# 喵喵趣学 — 项目指引

## 项目概述

面向初一厌学学生的数学学习产品。海底探险主题，AI 对话诊断 + 游戏化闯关 + 语音交互。

## 技术栈

- **前端**: React (TypeScript), Canvas 小游戏, Web Speech API (STT), 火山引擎 TTS
- **后端**: 轻量 API 代理层（Claude API + TTS 代理），可用 Vercel Functions / Cloudflare Workers
- **AI**: DeepSeek API (deepseek-chat) 驱动诊断对话
- **存储**: IndexedDB（本地），后期加后端同步

## 核心设计

详见 `docs/superpowers/specs/2026-07-08-海螺喵数学探险-设计文档.md`

### 四层引擎

1. 诊断定位层 — 倒着测，沿知识图谱依赖链回溯找断点
2. 脚手架学习层 — CPA 路径（具体→图示→抽象）重建概念
3. 变式练习层 — 同一概念换 4-6 种场景反复练
4. 迁移检验层 — 费曼讲解 + 新情境应用

### 记忆锚定引擎

间隔偷袭、情感钉、知识钩子、多感官编码、遗忘预警

### 融合理论

最近发展区、掌握学习、CPA、变式训练、间隔重复、费曼学习法、自我决定论、成长型思维、认知负荷、双编码、情绪增强记忆

## MVP 范围

仅**有理数**一章（20 个知识点），包含：

- 咖啡馆大厅 + 探险对话 + 2 个小游戏 + 贝壳图鉴 + 兑换 + 语音

## 项目结构

```
src/
├── App.tsx                         # 视图路由（默认视图 = drama）
├── components/
│   ├── drama/EpisodePlayer.tsx     # 【v3 主界面】短剧播放器，唯一入口
│   ├── cafe/                     # 〔v2 已冻结〕CafeHall 大厅 + CafeDecor/RulesBoard/GuideModal/SneakAttackBanner
│   ├── adventure/
│   │   ├── AdventureChat.tsx       # AI 探险对话（四层引擎集成 + PRACTICE 兜底）
│   │   └── OceanLine.tsx           # 海洋数轴可视化
│   ├── games/
│   │   ├── GameCorner.tsx          # 游戏角入口
│   │   ├── BubbleJump.tsx          # 海底跳跃（Canvas）
│   │   └── ShellCollector.tsx      # 贝壳收集（Canvas）
│   ├── map/TreasureMap.tsx         # 藏宝图（知识岛屿）
│   ├── collection/ShellAlbum.tsx   # 贝壳图鉴（收藏册）
│   ├── redeem/RedeemBar.tsx        # 兑换吧台
│   └── shared/                     # 贝壳计数器 + 声音开关
├── engine/
│   ├── dramaEngine.ts              # 【v3】取集/判定/季进度/解锁/防重听发奖（纯函数）
│   ├── validateDrama.ts            # 【v3】剧集五条设计铁律校验（构建期 + AI 生成二次校验）
│   ├── speechText.ts               # 【v3】朗读前文本规整：−7 显示不变、读成「负7」而非「减七」
│   ├── diagnostic.ts               # 〔v2 已冻结〕诊断引擎
│   ├── spacedRepetition.ts         # 间隔偷袭调度器
│   ├── levelManager.ts             # 关卡解锁逻辑
│   ├── rewardEngine.ts             # 奖励判定
│   ├── diveMathEngine.ts           # 潜水算术判定与过关结算（纯函数）
│   ├── validateGraph.ts            # 知识图谱验证（构建期检查）
│   └── validateDiveTasks.ts        # 题库数据验证（构建期检查）
├── services/
│   ├── ai.ts                       # AI API 调用（Key 由代理注入，前端不接触）
│   ├── tts.ts                      # TTS 调用（走 /api/tts 代理）
│   ├── stt.ts                      # Web Speech API STT
│   └── audio.ts                    # Web Audio API 音效
├── store/
│   ├── useStore.ts                 # Zustand 全局状态
│   └── persistenceSchema.ts        # 持久化字段注册表 + 版本迁移（STATE_VERSION）
├── data/
│   ├── dramaWorld.ts               # 【v3】世界观设定 + 第一季 5 集预写剧本（顶部有五条设计铁律）
│   ├── knowledgeGraph.ts           # 有理数 20 知识点图谱 + PRACTICE_NODES
│   ├── diveTasks.ts                # 潜水算术 39 题题库（纯数据）
│   └── gameConfig.ts               # 兑换比例、间隔梯度等配置
├── hooks/                          # usePersistence, useHashRouting, useAudio, useGreeting, useLoginCheck, useSneakAttacks
└── types/index.ts                  # TypeScript 类型定义

server/
├── api/chat.ts                     # DeepSeek 代理（唯一实现，dev/prod 共用）
├── api/tts.ts                      # TTS API 代理（唯一实现）
├── dev.ts                          # 本地开发服务器
└── dist/                           # build:server 产物（serve.cjs 运行时加载，勿提交）
```

## 当前状态

- [x] 有理数知识图谱初稿（20 知识点 + 依赖链 + 情感钉 + 钩子话术）
- [x] Demo v3（单页 AI 对话 + 数轴交互 + 贝壳系统）
- [x] 完整设计文档（spec）
- [x] 实现计划
- [x] MVP 脚手架搭建（33 源文件，TS 零错误，Vite build 通过）
- [x] 四层引擎全部实现（诊断、脚手架、变式、迁移）
- [x] 记忆锚定引擎（间隔偷袭调度器 + 遗忘预警）
- [x] 语音层集成（TTS 朗读 + STT 语音输入 + 音效系统）
- [x] 游戏角（2 个 Canvas 小游戏）
- [x] 后端 API 代理（Claude + TTS）
- [x] 持久化（IndexedDB）
- [x] 签到系统 + 连续登录奖励
- [x] 安全加固 <2026-07-16>：前端 Key 清除（VITE_ → DEEPSEEK_）、TTS 走代理、serve.cjs 限流
- [x] 测试基建 <2026-07-16>：vitest + 6 测试文件（37 测试）+ 构建期题库校验
- [x] Hash 路由 <2026-07-16>：手机返回键可用
- [x] 数据备份 <2026-07-16>：Dashboard 导出/导入 JSON
- [x] 首次真实用户测试漏洞修复 <2026-07-18>：3 核心漏洞 + CafeHall 入口锁 + DiveMath 答错机制
- [x] 奖励系统重构 <2026-07-25>：游戏币流转 + 防白嫖 + 数学嵌入游戏 + 题目动态生成
- [x] 项目改名喵喵趣学 <2026-07-25>
- [x] TTS 统一火山引擎 + 音效重做 + CelebrationOverlay 庆祝动画
- [x] 规则怪谈防白嫖 + AI 去强制放行 + 题目极简 + 默认朗读
- [x] 藏宝图每知识点 +2 珍珠 + 海龟汤防偷看汤底
- [x] **v3 短剧化改造 <2026-07-31>（本地完成，待真人测试）**：v2 奖励驱动模型经 3 周真实使用被证伪（孩子刷规则怪谈漏洞换食物、两条核心学习路径视而不见、20 点只亮 6 个）。改为「把数学做成她要追的下一集」——单按钮播放器（取消大厅即取消套利）、题嵌进剧情当主角的决定、答错不阻断走另一条分支、珍珠只从「听完一集」来、追完一季解锁点单权。设计见 `docs/superpowers/specs/2026-07-31-短剧化改造-设计方案.md`
- [x] 架构迭代 P0-P4 <2026-07-30>：持久化版本迁移（persistenceSchema）+ 代理层三合一（server/api 唯一实现，删 Vercel 函数）+ 组件拆分（CafeHall 四拆、DiveMath 逻辑下沉 diveMathEngine）+ PRACTICE 兜底（8 轮未放行温和提示）+ PRACTICE_NODES 下沉 data 层
- [ ] **v3 真人测试**：让她自己听第一季 5 集，看第 2 集钩子处会不会问"然后呢"、会不会连着往下听。不通过则方案作废，别继续加内容

## 部署铁律

遵守全局 CLAUDE.md 的部署铁律：**本地修改 → 本地测试 → 用户下令 → 提交部署**
