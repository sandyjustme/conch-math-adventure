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
├── App.tsx                         # 视图路由
├── components/
│   ├── cafe/CafeHall.tsx           # 咖啡馆大厅（主页）
│   ├── adventure/
│   │   ├── AdventureChat.tsx       # AI 探险对话（四层引擎集成）
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
│   ├── diagnostic.ts               # 诊断引擎
│   ├── spacedRepetition.ts         # 间隔偷袭调度器
│   ├── levelManager.ts             # 关卡解锁逻辑
│   ├── rewardEngine.ts             # 奖励判定
│   ├── validateGraph.ts            # 知识图谱验证（构建期检查）
│   └── validateDiveTasks.ts        # 题库数据验证（构建期检查）
├── services/
│   ├── ai.ts                       # AI API 调用（Key 由代理注入，前端不接触）
│   ├── tts.ts                      # TTS 调用（走 /api/tts 代理）
│   ├── stt.ts                      # Web Speech API STT
│   └── audio.ts                    # Web Audio API 音效
├── store/useStore.ts               # Zustand 全局状态
├── data/
│   ├── knowledgeGraph.ts           # 有理数 20 知识点图谱
│   ├── diveTasks.ts                # 潜水算术 39 题题库（纯数据）
│   └── gameConfig.ts               # 兑换比例、间隔梯度等配置
├── hooks/                          # usePersistence, useHashRouting, useAudio, useGreeting, useLoginCheck, useSneakAttacks
└── types/index.ts                  # TypeScript 类型定义

server/
├── api/chat.ts                     # AI API 代理
├── api/tts.ts                      # TTS API 代理
└── dev.ts                          # 本地开发服务器
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
- [ ] 配置 API Key 后本地跑通端到端
- [ ] 真实学生试用 + 反馈迭代

## 部署铁律

遵守全局 CLAUDE.md 的部署铁律：**本地修改 → 本地测试 → 用户下令 → 提交部署**
