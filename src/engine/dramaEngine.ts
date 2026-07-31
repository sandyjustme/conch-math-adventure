// 短剧主循环的纯逻辑（从 EpisodePlayer 下沉，可单测）。
// 组件只负责播放与渲染；取集、判定、季进度、解锁、防重听发奖都以这里为准。

import {
  EPISODES_PER_SEASON,
  PREWRITTEN_EPISODES,
  type Episode,
} from "../data/dramaWorld";
import { NODES } from "../data/knowledgeGraph";
import type { EpisodeRecord } from "../types";

export type { EpisodeRecord };

/** 第几季（集号从 1 开始） */
export function seasonOf(no: number): number {
  return Math.ceil(no / EPISODES_PER_SEASON);
}

/** 是不是季末那一集 */
export function isSeasonFinale(no: number): boolean {
  return no > 0 && no % EPISODES_PER_SEASON === 0;
}

/** 在本季里是第几集（1..EPISODES_PER_SEASON） */
export function indexInSeason(no: number): number {
  return ((no - 1) % EPISODES_PER_SEASON) + 1;
}

/**
 * 取某一集。先找 AI 生成缓存，再回落预写集。
 * 两边都没有 → null（播放器显示"明天再来"）。
 */
export function getEpisode(
  no: number,
  generated: Episode[] = []
): Episode | null {
  return (
    generated.find((e) => e.no === no) ??
    PREWRITTEN_EPISODES.find((e) => e.no === no) ??
    null
  );
}

/** 还有没有下一集可放 */
export function hasEpisode(no: number, generated: Episode[] = []): boolean {
  return getEpisode(no, generated) !== null;
}

/**
 * 是不是第一次听完这一集。
 * 重听不发奖 —— 这是 v3 唯一需要守的防刷点（内容稀缺本身就是防刷）。
 */
export function isFirstCompletion(
  no: number,
  progress: EpisodeRecord[]
): boolean {
  return !progress.some((r) => r.no === no);
}

/**
 * 听完这一集后该不该解锁一次点单权。
 * 条件：是季末集 + 该季所有集都听过 + 这一季还没解锁过。
 */
export function pendingSeasonUnlock(
  no: number,
  progress: EpisodeRecord[],
  unlockedSeasons: number[]
): number | null {
  if (!isSeasonFinale(no)) return null;
  const season = seasonOf(no);
  if (unlockedSeasons.includes(season)) return null;

  const first = (season - 1) * EPISODES_PER_SEASON + 1;
  const heard = new Set(progress.map((r) => r.no));
  for (let n = first; n <= no; n++) {
    if (!heard.has(n)) return null;
  }
  return season;
}

/** 判定她的选择 */
export function judgeChoice(
  episode: Episode,
  picked: "A" | "B"
): { correct: boolean; text: string } {
  if (!episode.choice) return { correct: true, text: "" };
  const correct = picked === episode.choice.correct;
  return {
    correct,
    text: correct ? episode.branchRight : episode.branchWrong,
  };
}

/**
 * 下一集该考哪个知识点（喂给 AI 生成器）。
 * 规则：优先回炉——有答错且之后没再考过的知识点先重来一次（换情境）；
 * 否则按知识图谱顺序取下一个还没考过的。
 */
export function nextNodeToTeach(
  progress: EpisodeRecord[],
  generated: Episode[] = []
): string {
  const byNo = new Map<number, Episode>();
  for (const e of [...PREWRITTEN_EPISODES, ...generated]) byNo.set(e.no, e);

  const ordered = [...progress].sort((a, b) => a.no - b.no);
  const wrongPending = new Set<string>();
  const covered = new Set<string>();

  for (const r of ordered) {
    const nodeId = byNo.get(r.no)?.nodeId;
    if (!nodeId) continue;
    covered.add(nodeId);
    if (r.correct === false) wrongPending.add(nodeId);
    else if (r.correct === true) wrongPending.delete(nodeId);
  }

  const revisit = [...wrongPending][0];
  if (revisit) return revisit;

  const fresh = NODES.find((n) => !covered.has(n.id));
  return fresh ? fresh.id : NODES[NODES.length - 1].id;
}

/**
 * 按空行把一段正文拆成若干「节拍」。
 *
 * 为什么必须拆：整段送 TTS 会合成出几十秒的单个音频，
 * 而且要整包下载完才开始播 —— 屏幕不动、也没声音，看起来像卡死。
 * 短剧的节奏是几秒一跳，拆开之后首句出声快，画面也跟着走。
 */
export function splitBeats(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 播放器要用的节拍序列：开场 → 推进 →（选择）→ 分支 → 钩子 */
export function segmentsBefore(episode: Episode): string[] {
  return [episode.openText, episode.bodyText].flatMap(splitBeats);
}

export function segmentsAfter(episode: Episode, branchText: string): string[] {
  return [branchText, episode.hookText].flatMap(splitBeats);
}
