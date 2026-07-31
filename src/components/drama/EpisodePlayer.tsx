import { useEffect, useRef, useState } from "react";
import useStore from "../../store/useStore";
import { EPISODES_PER_SEASON } from "../../data/dramaWorld";
import {
  getEpisode,
  isFirstCompletion,
  pendingSeasonUnlock,
  judgeChoice,
  seasonOf,
  indexInSeason,
  segmentsBefore,
  segmentsAfter,
} from "../../engine/dramaEngine";
import { speakSegment, stopSegment } from "../../services/tts";
import { flushPersistence } from "../../hooks/usePersistence";

type Phase = "cover" | "before" | "choice" | "after" | "end";

export default function EpisodePlayer() {
  const setView = useStore((s) => s.setView);
  const currentEp = useStore((s) => s.currentEp);
  const episodeProgress = useStore((s) => s.episodeProgress);
  const seasonUnlocks = useStore((s) => s.seasonUnlocks);
  const generatedEpisodes = useStore((s) => s.generatedEpisodes);
  const completeEpisode = useStore((s) => s.completeEpisode);
  const advanceEpisode = useStore((s) => s.advanceEpisode);
  const unlockSeason = useStore((s) => s.unlockSeason);
  const addPearls = useStore((s) => s.addPearls);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const masterNode = useStore((s) => s.masterNode);
  const showToast = useStore((s) => s.showToast);
  const ttsEnabled = useStore((s) => s.ttsEnabled);

  const episode = getEpisode(currentEp, generatedEpisodes);

  const [phase, setPhase] = useState<Phase>("cover");
  const [beatIdx, setBeatIdx] = useState(0);
  const [branchText, setBranchText] = useState("");
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  /** TTS 不可用时改为手动点继续 */
  const [manual, setManual] = useState(false);
  const [unlockedSeason, setUnlockedSeason] = useState<number | null>(null);
  /** 用来作废过期的朗读回调（她跳过或离开时） */
  const runId = useRef(0);
  /** 她这一集选了哪个，结算时写进记录 */
  const lastPicked = useRef<"A" | "B" | null>(null);

  useEffect(() => () => stopSegment(), []);

  const beats =
    phase === "before"
      ? episode
        ? segmentsBefore(episode)
        : []
      : phase === "after"
        ? episode
          ? segmentsAfter(episode, branchText)
          : []
        : [];
  const beatText = beats[beatIdx] ?? "";

  /* ── 结算：只在第一次听完时发奖，重听不发 ── */
  const settle = (correct: boolean | null, picked: "A" | "B" | null) => {
    if (!episode) return;
    const first = isFirstCompletion(episode.no, episodeProgress);

    if (episode.nodeId && correct !== null) {
      addAnswerRecord({
        nodeId: episode.nodeId,
        correct,
        latencyMs: 0,
        timestamp: Date.now(),
      });
      if (correct) masterNode(episode.nodeId);
    }

    if (first) {
      // 珍珠只从「听完一集」来，答对答错都给 —— 她没有可优化的东西
      addPearls(1);
      showToast("pearl", 1);
    }

    // 解锁判定要用「加上这一集之后」的进度，不能用闭包里的旧值
    const nextProgress = [
      ...episodeProgress.filter((r) => r.no !== episode.no),
      { no: episode.no, choice: picked, correct, completedAt: Date.now() },
    ];
    completeEpisode({
      no: episode.no,
      choice: picked,
      correct,
      completedAt: Date.now(),
    });

    const season = pendingSeasonUnlock(episode.no, nextProgress, seasonUnlocks);
    if (season !== null) {
      unlockSeason(season);
      setUnlockedSeason(season);
    }

    advanceEpisode();

    // 立刻落盘：听完一集正是她最可能直接关掉 app 的时刻，
    // 走 500ms 防抖会把这一集的进度和珍珠一起丢掉。
    flushPersistence();
  };

  /* ── 一段结束 → 推进 ── */
  const advanceBeat = () => {
    stopSegment();
    runId.current++;
    setManual(false);

    if (beatIdx < beats.length - 1) {
      setBeatIdx((i) => i + 1);
      return;
    }

    if (phase === "before") {
      if (episode?.choice) {
        setPhase("choice");
      } else {
        setBranchText("");
        setBeatIdx(0);
        setPhase("after");
      }
      return;
    }

    if (phase === "after") {
      settle(wasCorrect, lastPicked.current);
      setPhase("end");
    }
  };

  /* ── 朗读当前段，读完自动推进 ── */
  useEffect(() => {
    if (phase !== "before" && phase !== "after") return;
    if (!beatText) return;

    const myRun = ++runId.current;
    let cancelled = false;

    (async () => {
      if (!ttsEnabled) {
        setManual(true);
        return;
      }
      const spoken = await speakSegment(beatText);
      if (cancelled || myRun !== runId.current) return;
      if (spoken) advanceBeat();
      else setManual(true); // TTS 挂了也要能往下走
    })();

    return () => {
      cancelled = true;
    };
    // advanceBeat 每次渲染都会变，这里只在段落变化时重跑
  }, [beatText, phase, ttsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    setBeatIdx(0);
    setBranchText("");
    setWasCorrect(null);
    setUnlockedSeason(null);
    lastPicked.current = null;
    setPhase("before");
  };

  const pick = (picked: "A" | "B") => {
    if (!episode) return;
    const { correct, text } = judgeChoice(episode, picked);
    lastPicked.current = picked;
    setWasCorrect(correct);
    setBranchText(text);
    setBeatIdx(0);
    setPhase("after"); // 结算在 after 段播完后进行
  };

  const nextEpisode = () => {
    setPhase("cover");
    setBeatIdx(0);
    setUnlockedSeason(null);
  };

  /* ═══════════ 渲染 ═══════════ */

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-screen font-body flex flex-col text-slate-100"
      style={{
        background:
          "linear-gradient(180deg, #07090C 0%, #0E141C 45%, #151D28 100%)",
      }}
    >
      {/* 顶栏：只有进度，和一个给家长的入口 */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-[11px] text-slate-500 tracking-wide">
          {episode
            ? `第 ${episode.no} 集 · 第 ${seasonOf(episode.no)} 季（${indexInSeason(
                episode.no
              )}/${EPISODES_PER_SEASON}）`
            : "地下十三层"}
        </span>
        <button
          onClick={() => setView("dashboard")}
          className="text-slate-600 hover:text-slate-400 text-sm w-8 h-8 rounded-full"
          aria-label="家长看板"
          title="家长看板"
        >
          ⚙
        </button>
      </header>
      {children}
    </div>
  );

  /* ── 结束（必须排在 !episode 之前：结算时 currentEp 已指向下一集，
        季末那一集听完后 episode 会是 null，庆祝页不能被吞掉）── */
  if (phase === "end") {
    const nextExists = getEpisode(currentEp, generatedEpisodes) !== null;
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {unlockedSeason !== null ? (
          <>
            <div className="text-5xl mb-4">🍜</div>
            <h2 className="font-display text-2xl text-amber-300 mb-2">
              第 {unlockedSeason} 季 · 追完了
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs mb-8">
              你解锁了一次 <b className="text-amber-300">点单权</b>
              ——去跟大人说，你要吃什么。
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4 opacity-70">🌊</div>
            <p className="text-sm text-slate-400 mb-8">这一集听完了</p>
          </>
        )}

        {nextExists ? (
          <button
            onClick={nextEpisode}
            className="px-10 py-4 rounded-full bg-amber-400 text-slate-900 text-base font-bold shadow-lg hover:bg-amber-300 transition active:scale-95"
          >
            下一集 →
          </button>
        ) : (
          <p className="text-sm text-slate-500">明天还有新的</p>
        )}
      </div>
    );
  }

  /* ── 没有下一集了 ── */
  if (!episode) {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-5 opacity-60">🌒</div>
        <h2 className="font-display text-2xl text-slate-200 mb-2">
          今天就到这里
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
          第 {currentEp} 集还没送到。
          <br />
          明天再来，故事会接着往下走。
        </p>
        <p className="text-xs text-slate-600 mt-8">
          你已经听完 {episodeProgress.length} 集
        </p>
      </div>
    );
  }

  /* ── 封面：唯一的一个按钮 ── */
  if (phase === "cover") {
    const heard = !isFirstCompletion(episode.no, episodeProgress);
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-xs text-amber-500/70 tracking-[0.3em] mb-3">
          第 {episode.no} 集
        </div>
        <h1 className="font-display text-4xl text-slate-100 mb-10">
          {episode.title}
        </h1>
        <button
          onClick={start}
          className="px-10 py-4 rounded-full bg-amber-400 text-slate-900 text-base font-bold shadow-lg hover:bg-amber-300 transition active:scale-95"
        >
          ▶ {heard ? "再听一次" : "继续听"}
        </button>
        {heard && (
          <p className="text-[11px] text-slate-600 mt-4">
            听过的集数不再给珍珠
          </p>
        )}
      </div>
    );
  }

  /* ── 做选择 ── */
  if (phase === "choice" && episode.choice) {
    return shell(
      <div className="flex-1 flex flex-col justify-center px-6 pb-10">
        <p className="text-lg leading-loose text-slate-200 whitespace-pre-wrap mb-8 text-center">
          {episode.choice.prompt}
        </p>
        <div className="space-y-3 max-w-sm w-full mx-auto">
          {(["A", "B"] as const).map((key) => (
            <button
              key={key}
              onClick={() => pick(key)}
              className="w-full py-5 px-5 rounded-2xl bg-white/8 border border-white/15 text-slate-100 text-lg leading-relaxed hover:bg-white/15 hover:border-amber-400/50 transition active:scale-[0.98]"
            >
              {key === "A" ? episode.choice!.optionA : episode.choice!.optionB}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-600 text-center mt-6">
          选错了故事也会继续，只是会往另一个方向走
        </p>
      </div>
    );
  }

  /* ── 正在播 ── */
  return shell(
    <div
      className="flex-1 flex flex-col justify-center px-6 pb-16 cursor-pointer select-none"
      onClick={advanceBeat}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") advanceBeat();
      }}
      aria-label="点一下继续"
    >
      <p className="text-lg leading-loose text-slate-100 whitespace-pre-wrap max-w-md mx-auto w-full">
        {beatText}
      </p>

      <div className="mt-10 text-center">
        {manual ? (
          <span className="inline-block px-6 py-2.5 rounded-full bg-amber-400/90 text-slate-900 text-sm font-bold">
            点一下继续 →
          </span>
        ) : (
          <span className="text-[11px] text-slate-600">
            念完自动往下 · 点一下可以跳过
          </span>
        )}
      </div>
    </div>
  );
}
