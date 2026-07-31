import { create } from "zustand";
import { EXCHANGE_RATE } from "../data/gameConfig";
import type { Episode } from "../data/dramaWorld";
import type {
  View,
  RareShell,
  SneakAttack,
  AnswerRecord,
  GameScore,
  Redemption,
  EpisodeRecord,
} from "../types";

interface AppState {
  currentView: View;

  // ── v3 短剧 ──
  /** 下一集要播的集号，从 1 开始 */
  currentEp: number;
  episodeProgress: EpisodeRecord[];
  /** 已解锁点单权的季号 */
  seasonUnlocks: number[];
  /** AI 生成并通过校验的剧集缓存 */
  generatedEpisodes: Episode[];
  completeEpisode: (record: EpisodeRecord) => void;
  advanceEpisode: () => void;
  unlockSeason: (season: number) => void;
  addGeneratedEpisode: (ep: Episode) => void;

  fragments: number;
  pearls: number;
  rareShells: RareShell[];

  currentNodeId: string;
  masteredNodes: string[];
  answerRecords: AnswerRecord[];

  sneakAttacks: SneakAttack[];
  gameScores: GameScore[];
  redemptions: Redemption[];

  playTokens: number;
  solvedSoups: string[];
  revealedSoups: string[];

  ttsEnabled: boolean;
  sttEnabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;

  lastLoginDate: string;
  consecutiveDays: number;

  messages: { role: "user" | "assistant"; text: string }[];
  loading: boolean;

  diveFocus: string | null;
  setDiveFocus: (f: string | null) => void;

  // 首次诊断完成标志（持久化）
  diagnosticsCompleted: boolean;
  setDiagnosticsCompleted: () => void;

  // AI 跳转追踪（不持久化）
  diveFromAdventure: boolean;
  setDiveFromAdventure: (v: boolean) => void;

  // 今日探险通关数（不持久化，跨天重置）
  todayAdventureCount: number;
  incrementAdventureCount: () => void;
  resetAdventureCount: () => void;

  setView: (view: View) => void;

  addFragments: (n: number) => void;
  addPearls: (n: number) => void;
  spendPearls: (n: number) => void;
  convertFragmentsToPearls: () => void;
  redeemPearls: (code: string) => void;
  addRareShell: (shell: RareShell) => void;

  setCurrentNode: (id: string) => void;
  masterNode: (id: string) => void;
  addAnswerRecord: (record: AnswerRecord) => void;

  setSneakAttacks: (
    attacks: SneakAttack[] | ((prev: SneakAttack[]) => SneakAttack[])
  ) => void;
  updateSneakAttack: (attack: SneakAttack) => void;
  removeSneakAttack: (nodeId: string) => void;

  addGameScore: (score: GameScore) => void;
  addRedemption: (r: Redemption) => void;

  addPlayTokens: (n: number) => void;
  spendPlayTokens: (n: number) => boolean;
  addSolvedSoup: (id: string) => void;
  addRevealedSoup: (id: string) => void;

  toggleTts: () => void;
  toggleStt: () => void;
  toggleBgm: () => void;
  toggleSfx: () => void;

  setMessages: (
    messages: { role: "user" | "assistant"; text: string }[]
  ) => void;
  addMessage: (msg: { role: "user" | "assistant"; text: string }) => void;
  setLoading: (v: boolean) => void;

  setLastLogin: (date: string) => void;
  setConsecutiveDays: (n: number) => void;

  // Toast feedback
  toasts: {
    id: number;
    type: "pearl" | "fragment" | "correct" | "levelup";
    value?: number;
  }[];
  showToast: (
    type: "pearl" | "fragment" | "correct" | "levelup",
    value?: number
  ) => void;
  removeToast: (id: number) => void;
}

let _toastId = 0;

const useStore = create<AppState>((set) => ({
  currentView: "drama",

  // ── v3 短剧 ──
  currentEp: 1,
  episodeProgress: [],
  seasonUnlocks: [],
  generatedEpisodes: [],

  completeEpisode: (record) =>
    set((s) => ({
      episodeProgress: s.episodeProgress.some((r) => r.no === record.no)
        ? s.episodeProgress.map((r) => (r.no === record.no ? record : r))
        : [...s.episodeProgress, record],
    })),
  advanceEpisode: () => set((s) => ({ currentEp: s.currentEp + 1 })),
  unlockSeason: (season) =>
    set((s) => ({
      seasonUnlocks: s.seasonUnlocks.includes(season)
        ? s.seasonUnlocks
        : [...s.seasonUnlocks, season],
    })),
  addGeneratedEpisode: (ep) =>
    set((s) => ({
      generatedEpisodes: s.generatedEpisodes.some((e) => e.no === ep.no)
        ? s.generatedEpisodes
        : [...s.generatedEpisodes, ep],
    })),

  fragments: 0,
  pearls: 0,
  rareShells: [],

  currentNodeId: "K1",
  masteredNodes: [],
  answerRecords: [],

  sneakAttacks: [],
  gameScores: [],
  redemptions: [],

  playTokens: 2,
  solvedSoups: [],
  revealedSoups: [],

  ttsEnabled: true,
  sttEnabled: true,
  bgmEnabled: true,
  sfxEnabled: true,

  lastLoginDate: "",
  consecutiveDays: 0,

  messages: [],
  loading: false,

  diveFocus: null,
  setDiveFocus: (f) => set({ diveFocus: f }),

  diagnosticsCompleted: false,
  setDiagnosticsCompleted: () => set({ diagnosticsCompleted: true }),

  diveFromAdventure: false,
  setDiveFromAdventure: (v) => set({ diveFromAdventure: v }),

  todayAdventureCount: 0,
  incrementAdventureCount: () =>
    set((s) => ({
      todayAdventureCount: s.todayAdventureCount + 1,
    })),
  resetAdventureCount: () => set({ todayAdventureCount: 0 }),

  setView: (view) => set({ currentView: view }),

  addFragments: (n) => set((s) => ({ fragments: s.fragments + n })),
  addPearls: (n) => set((s) => ({ pearls: s.pearls + n })),
  spendPearls: (n) => set((s) => ({ pearls: Math.max(0, s.pearls - n) })),
  convertFragmentsToPearls: () =>
    set((s) => {
      const pearls = Math.floor(s.fragments / 10);
      const leftover = s.fragments % 10;
      if (pearls === 0) return s;
      return { fragments: leftover, pearls: s.pearls + pearls };
    }),
  redeemPearls: (_code) =>
    set((s) => ({ pearls: Math.max(0, s.pearls - EXCHANGE_RATE) })),
  addRareShell: (shell) =>
    set((s) => ({ rareShells: [...s.rareShells, shell] })),

  setCurrentNode: (id) => set({ currentNodeId: id }),
  masterNode: (id) =>
    set((s) => ({
      masteredNodes: s.masteredNodes.includes(id)
        ? s.masteredNodes
        : [...s.masteredNodes, id],
    })),
  addAnswerRecord: (record) =>
    set((s) => {
      const next = [...s.answerRecords, record];
      if (next.length > 500) return { answerRecords: next.slice(-500) };
      return { answerRecords: next };
    }),

  setSneakAttacks: (attacks) =>
    set((s) => ({
      sneakAttacks:
        typeof attacks === "function" ? attacks(s.sneakAttacks) : attacks,
    })),
  updateSneakAttack: (attack) =>
    set((s) => ({
      sneakAttacks: s.sneakAttacks.map((a) =>
        a.nodeId === attack.nodeId ? attack : a
      ),
    })),
  removeSneakAttack: (nodeId) =>
    set((s) => ({
      sneakAttacks: s.sneakAttacks.filter((a) => a.nodeId !== nodeId),
    })),

  addGameScore: (score) =>
    set((s) => ({ gameScores: [...s.gameScores, score] })),
  addRedemption: (r) => set((s) => ({ redemptions: [...s.redemptions, r] })),

  addPlayTokens: (n) =>
    set((s) => ({ playTokens: Math.min(10, s.playTokens + n) })),
  spendPlayTokens: (n) => {
    const state = useStore.getState();
    if (state.playTokens < n) return false;
    set({ playTokens: state.playTokens - n });
    return true;
  },
  addSolvedSoup: (id) =>
    set((s) => ({
      solvedSoups: s.solvedSoups.includes(id)
        ? s.solvedSoups
        : [...s.solvedSoups, id],
    })),
  addRevealedSoup: (id) =>
    set((s) => ({
      revealedSoups: s.revealedSoups.includes(id)
        ? s.revealedSoups
        : [...s.revealedSoups, id],
    })),

  toggleTts: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
  toggleStt: () => set((s) => ({ sttEnabled: !s.sttEnabled })),
  toggleBgm: () => set((s) => ({ bgmEnabled: !s.bgmEnabled })),
  toggleSfx: () => set((s) => ({ sfxEnabled: !s.sfxEnabled })),

  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (v) => set({ loading: v }),

  setLastLogin: (date) => set({ lastLoginDate: date }),
  setConsecutiveDays: (n) => set({ consecutiveDays: n }),

  toasts: [],
  showToast: (type, value) =>
    set((s) => ({
      toasts: [...s.toasts, { id: ++_toastId, type, value }],
    })),
  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));

export default useStore;
