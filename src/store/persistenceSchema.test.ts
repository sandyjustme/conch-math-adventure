import { describe, it, expect } from "vitest";
import {
  FIELDS,
  STATE_VERSION,
  buildPatch,
  migrate,
} from "./persistenceSchema";

describe("persistenceSchema", () => {
  it("FIELDS 的 key 不重复", () => {
    const keys = FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("v1 旧数据（缺 playTokens/soups/stateVersion）迁移后字段由默认值兜底", () => {
    // 模拟 v1 时代存下的数据：没有 playTokens、solvedSoups、revealedSoups
    const v1Raw: Record<string, unknown> = {
      shells: { fragments: 12.5, pearls: 3 },
      masteredNodes: ["K1", "K3"],
      sneakAttacks: [],
      answerRecords: [],
      redemptions: [],
      rareShells: [],
      diagnosticsCompleted: true,
      lastLoginDate: "2026-07-29",
      consecutiveDays: 4,
    };
    const patch = buildPatch(migrate(1, v1Raw));
    expect(patch.fragments).toBe(12.5);
    expect(patch.pearls).toBe(3);
    expect(patch.masteredNodes).toEqual(["K1", "K3"]);
    expect(patch.diagnosticsCompleted).toBe(true);
    expect(patch.consecutiveDays).toBe(4);
    // 缺失字段不进补丁 → store 默认值（0 / []）保留
    expect(patch.playTokens).toBeUndefined();
    expect(patch.solvedSoups).toBeUndefined();
    expect(patch.revealedSoups).toBeUndefined();
  });

  it("v2 → v3：老存档一条不丢，短剧字段由默认值兜底", () => {
    const v2Raw: Record<string, unknown> = {
      shells: { fragments: 8, pearls: 23 },
      masteredNodes: ["K1", "K3", "K5", "K6", "K7", "K8"],
      answerRecords: [
        { nodeId: "K7", correct: true, latencyMs: 0, timestamp: 1 },
      ],
      redemptions: [{ code: "a-1", time: "2026-07-28" }],
      playTokens: 6,
      solvedSoups: ["soup-1"],
      revealedSoups: [],
      sneakAttacks: [],
      rareShells: [],
      diagnosticsCompleted: true,
      lastLoginDate: "2026-07-30",
      consecutiveDays: 9,
    };
    const patch = buildPatch(migrate(2, v2Raw));
    // v2 的东西全在
    expect(patch.pearls).toBe(23);
    expect(patch.masteredNodes).toHaveLength(6);
    expect(patch.answerRecords).toHaveLength(1);
    expect(patch.redemptions).toHaveLength(1);
    expect(patch.playTokens).toBe(6);
    // v3 新字段不进补丁 → store 默认值（currentEp=1，从第 1 集开始追）
    expect(patch.currentEp).toBeUndefined();
    expect(patch.episodeProgress).toBeUndefined();
    expect(patch.seasonUnlocks).toBeUndefined();
  });

  it("currentEp 为 0 或负数时纠正为 1", () => {
    expect(buildPatch({ currentEp: 0 }).currentEp).toBe(1);
    expect(buildPatch({ currentEp: -5 }).currentEp).toBe(1);
    expect(buildPatch({ currentEp: 7 }).currentEp).toBe(7);
  });

  it("类型不符的值被拒绝，不污染状态", () => {
    const raw: Record<string, unknown> = {
      playTokens: "abc",
      consecutiveDays: [1, 2],
      masteredNodes: "K1",
      solvedSoups: { id: 1 },
    };
    const patch = buildPatch(migrate(STATE_VERSION, raw));
    expect(patch.playTokens).toBeUndefined();
    expect(patch.consecutiveDays).toBeUndefined();
    expect(patch.masteredNodes).toBeUndefined();
    expect(patch.solvedSoups).toBeUndefined();
  });

  it("shells 缺子字段时按 0 兜底", () => {
    const patch = buildPatch({ shells: { pearls: 7 } });
    expect(patch.fragments).toBe(0);
    expect(patch.pearls).toBe(7);
  });

  it("migrate 不修改入参对象", () => {
    const raw = { shells: { fragments: 1, pearls: 1 } };
    migrate(1, raw);
    expect(raw).toEqual({ shells: { fragments: 1, pearls: 1 } });
  });

  it("每个字段 read/apply 往返一致", () => {
    const snapshot = {
      fragments: 9,
      pearls: 2,
      rareShells: [],
      masteredNodes: ["K8"],
      answerRecords: [],
      sneakAttacks: [],
      redemptions: [],
      diagnosticsCompleted: true,
      lastLoginDate: "2026-07-30",
      consecutiveDays: 1,
      playTokens: 5,
      solvedSoups: ["soup-1"],
      revealedSoups: [],
      currentEp: 3,
      episodeProgress: [{ no: 1, choice: null, correct: null, completedAt: 1 }],
      seasonUnlocks: [1],
      generatedEpisodes: [],
    };
    for (const f of FIELDS) {
      const stored = f.read(snapshot);
      const patch = buildPatch({ [f.key]: stored });
      expect(Object.keys(patch).length).toBeGreaterThan(0);
    }
  });
});
