import { create } from "zustand";
import { EXCHANGE_RATE } from "../data/gameConfig";
import type {
  View,
  RareShell,
  SneakAttack,
  AnswerRecord,
  GameScore,
  Redemption,
} from "../types";

interface AppState {
  currentView: View;

  fragments: number;
  pearls: number;
  rareShells: RareShell[];

  currentNodeId: string;
  masteredNodes: string[];
  answerRecords: AnswerRecord[];

  sneakAttacks: SneakAttack[];
  gameScores: GameScore[];
  redemptions: Redemption[];

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

  setSneakAttacks: (attacks: SneakAttack[]) => void;
  updateSneakAttack: (attack: SneakAttack) => void;
  removeSneakAttack: (nodeId: string) => void;

  addGameScore: (score: GameScore) => void;
  addRedemption: (r: Redemption) => void;

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
  currentView: "cafe",

  fragments: 0,
  pearls: 0,
  rareShells: [],

  currentNodeId: "K1",
  masteredNodes: [],
  answerRecords: [],

  sneakAttacks: [],
  gameScores: [],
  redemptions: [],

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
      todayAdventureCount: Math.min(2, s.todayAdventureCount + 1),
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

  setSneakAttacks: (attacks) => set({ sneakAttacks: attacks }),
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
