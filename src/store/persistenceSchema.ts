// 持久化 schema 注册表 — 所有 IndexedDB 字段的唯一权威定义。
// 新增持久化字段的规则：
//   1. 在 PersistedSnapshot 加字段
//   2. 在 FIELDS 加一行（含校验器）
//   3. STATE_VERSION +1，并在 migrate() 里补一段旧版本改写逻辑
// 这样老用户数据永远走"读旧 → 迁移 → 校验 → 落 store"的同一条管线。

import type { Episode } from "../data/dramaWorld";
import type {
  RareShell,
  SneakAttack,
  AnswerRecord,
  Redemption,
  EpisodeRecord,
} from "../types";

export const STATE_VERSION = 3;
export const VERSION_KEY = "stateVersion";

export interface PersistedSnapshot {
  fragments: number;
  pearls: number;
  rareShells: RareShell[];
  masteredNodes: string[];
  answerRecords: AnswerRecord[];
  sneakAttacks: SneakAttack[];
  redemptions: Redemption[];
  diagnosticsCompleted: boolean;
  lastLoginDate: string;
  consecutiveDays: number;
  playTokens: number;
  solvedSoups: string[];
  revealedSoups: string[];
  // ── v3 短剧 ──
  currentEp: number;
  episodeProgress: EpisodeRecord[];
  seasonUnlocks: number[];
  generatedEpisodes: Episode[];
}

const isNumber = (v: unknown): v is number => typeof v === "number";
const isString = (v: unknown): v is string => typeof v === "string";
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

interface FieldSpec {
  /** IndexedDB 里的存储 key */
  key: string;
  /** 读到的值类型不对时拒绝（字段保持 store 默认值，不污染状态） */
  validate: (v: unknown) => boolean;
  /** 从 store 快照取出要写入的值 */
  read: (s: PersistedSnapshot) => unknown;
  /** 把读到的值转成 setState 补丁 */
  apply: (v: any) => Partial<PersistedSnapshot>;
}

export const FIELDS: FieldSpec[] = [
  {
    key: "shells",
    validate: isObject,
    read: (s) => ({ fragments: s.fragments, pearls: s.pearls }),
    apply: (v) => ({
      fragments: isNumber(v.fragments) ? v.fragments : 0,
      pearls: isNumber(v.pearls) ? v.pearls : 0,
    }),
  },
  {
    key: "masteredNodes",
    validate: isArray,
    read: (s) => s.masteredNodes,
    apply: (v) => ({ masteredNodes: v }),
  },
  {
    key: "sneakAttacks",
    validate: isArray,
    read: (s) => s.sneakAttacks,
    apply: (v) => ({ sneakAttacks: v }),
  },
  {
    key: "answerRecords",
    validate: isArray,
    read: (s) => s.answerRecords,
    apply: (v) => ({ answerRecords: v }),
  },
  {
    key: "redemptions",
    validate: isArray,
    read: (s) => s.redemptions,
    apply: (v) => ({ redemptions: v }),
  },
  {
    key: "rareShells",
    validate: isArray,
    read: (s) => s.rareShells,
    apply: (v) => ({ rareShells: v }),
  },
  {
    key: "diagnosticsCompleted",
    validate: (v) => typeof v === "boolean",
    read: (s) => s.diagnosticsCompleted,
    apply: (v) => ({ diagnosticsCompleted: v === true }),
  },
  {
    key: "lastLoginDate",
    validate: isString,
    read: (s) => s.lastLoginDate,
    apply: (v) => ({ lastLoginDate: v }),
  },
  {
    key: "consecutiveDays",
    validate: isNumber,
    read: (s) => s.consecutiveDays,
    apply: (v) => ({ consecutiveDays: v }),
  },
  {
    key: "playTokens",
    validate: isNumber,
    read: (s) => s.playTokens,
    apply: (v) => ({ playTokens: v }),
  },
  {
    key: "solvedSoups",
    validate: isArray,
    read: (s) => s.solvedSoups,
    apply: (v) => ({ solvedSoups: v }),
  },
  {
    key: "revealedSoups",
    validate: isArray,
    read: (s) => s.revealedSoups,
    apply: (v) => ({ revealedSoups: v }),
  },
  // ── v3 短剧 ──
  {
    key: "currentEp",
    validate: isNumber,
    read: (s) => s.currentEp,
    apply: (v) => ({ currentEp: v >= 1 ? v : 1 }),
  },
  {
    key: "episodeProgress",
    validate: isArray,
    read: (s) => s.episodeProgress,
    apply: (v) => ({ episodeProgress: v }),
  },
  {
    key: "seasonUnlocks",
    validate: isArray,
    read: (s) => s.seasonUnlocks,
    apply: (v) => ({ seasonUnlocks: v }),
  },
  {
    key: "generatedEpisodes",
    validate: isArray,
    read: (s) => s.generatedEpisodes,
    apply: (v) => ({ generatedEpisodes: v }),
  },
];

/**
 * 版本迁移。
 * v1 → v2：数据结构未变（v2 只是补登 stateVersion）。
 * v2 → v3：只新增短剧字段，v2 的所有字段（珍珠/掌握度/答题记录/兑换）原样保留不丢。
 * 未来改字段结构时在这里按版本逐段改写。
 */
export function migrate(
  fromVersion: number,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const data = { ...raw };
  if (fromVersion < 2) {
    // v1 没有 stateVersion / playTokens / solvedSoups / revealedSoups，
    // 缺失字段由 buildPatch 跳过、store 默认值兜底，无需改写。
  }
  if (fromVersion < 3) {
    // v2 没有短剧字段。currentEp 缺失时由 store 默认值 1 兜底，
    // 老用户升级后从第 1 集开始追，v2 的存档一条都不动。
  }
  return data;
}

/**
 * 读入管线的纯函数部分：逐字段校验并合成 setState 补丁。
 * 缺失或类型不符的字段不进补丁（保留 store 默认值）。
 */
export function buildPatch(
  raw: Record<string, unknown>
): Partial<PersistedSnapshot> {
  let patch: Partial<PersistedSnapshot> = {};
  for (const f of FIELDS) {
    const v = raw[f.key];
    if (v != null && f.validate(v)) {
      patch = { ...patch, ...f.apply(v) };
    }
  }
  return patch;
}
