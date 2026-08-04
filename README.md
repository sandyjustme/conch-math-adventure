# 喵喵趣学

面向初一厌学学生的数学学习 PWA。海底探险主题，AI 对话诊断 + 游戏化闯关 + 语音交互。

## 快速开始

```bash
npm install
npm run dev          # 前端（Vite, :5173）
npm run dev:server   # 本地 API 代理（:3456，TTS/DeepSeek）
npm run test         # vitest
npm run typecheck    # tsc --noEmit
npm run build        # 前端构建
npm run build:server # 服务端代理编译（server/api → server/dist）
npm start            # 生产服务器（serve.cjs，自动先跑 build:server）
```

环境变量（只放服务端 `.env`，绝不加 `VITE_` 前缀）：`DEEPSEEK_API_KEY`、`VOLCANO_TTS_APP_ID`、`VOLCANO_TTS_TOKEN`。

## 架构速览

- `src/components/drama/` — **v3 主界面**：短剧播放器，打开 app 唯一看到的东西
- `src/engine/` — 纯函数逻辑层（短剧/诊断/奖励/间隔重复/潜水判定），测试全在这里
- `src/data/` — 世界观与剧本、知识图谱、题库、配置（纯数据）
- `src/store/` — Zustand 单一 store + `persistenceSchema.ts`（持久化字段注册表）
- `src/services/` — AI/TTS/STT/音效（副作用边界）
- `server/api/` — AI/TTS 代理**唯一实现**，dev 与生产（serve.cjs）共用

## 下一步优先级

1. **Step 0 三天观察（2026-08-04 起）**：只看三样——她为换饭开不开工、抱怨的是"烦"还是"又在考我"、看板首试时延是否 >5s。这是 v4 工资框架的证伪实验
2. 通过 → Step 1：心愿单（凤冠拼图上架）、帮手/换单机制、班次结构完善
3. 失败 → 降到 1 张工单/天再试一周；仍拒绝则承认工资框架被证伪，问题在交易的家庭合法性，产品外解决——不做第五次伪装

> v2 的六个玩法（今日探险/潜水算术/海龟汤/古深海遗迹/规则怪谈/游戏角）代码保留但已从主路径移除，
> 只能手输 `#/cafe` 等 hash 进入。**别把它们放回主界面**——里面的刷分口子还在，
> 而且 v2 模型已被真实使用证伪（见 `docs/superpowers/specs/2026-07-31-短剧化改造-设计方案.md` 文末）。

## 加新章节的规矩（第二章之前必读）

1. 知识点写进 `src/data/knowledgeGraph.ts` 的 `NODES`（含 chapter 字段）
2. 支持「聊通转练习」的节点 id 加进同文件的 `PRACTICE_NODES`
3. `DIAGNOSIS_ENTRY` 按章节索引化（目前是单入口 "K19"，扩展时改成 per-chapter）
4. 持久化新字段：`src/store/persistenceSchema.ts` 加一行 + `STATE_VERSION +1` + `migrate()` 补迁移
5. 题库/判定逻辑进 `src/data` / `src/engine`，组件只做渲染

## 部署铁律

本地修改 → 本地测试 → 用户下令 → 提交部署。生产部署在阿里云（PM2 + serve.cjs），更新时代码同步后需 `npm run build:server` 再 `pm2 restart conch`。
