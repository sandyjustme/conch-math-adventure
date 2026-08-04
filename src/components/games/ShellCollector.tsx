import { useEffect, useRef, useState } from "react";
import useStore from "../../store/useStore";
import { makePairCards, type PairCard } from "../../data/pairCards";
import { useAudio } from "../../hooks/useAudio";
import Mascot from "../shared/Mascot";

/**
 * 沉船翻牌 —— 玩法重设计（替代「珍珠雨」）。
 *
 * 旧版是被动接落物 + 颜色泄露答案（绿=正红=负，根本不用算）。
 * 新玩法是记忆配对：12 张牌 6 对，**两张算式的值相等才配对**
 * （3+4 ↔ 9−2）。每翻一张都得算出值才记得住 —— 数学长在玩法里。
 *
 * 为什么是记忆配对：她是耐心型（独立拼完整套彩灯拼图），
 * 翻找、记忆、收齐是拼图的同一种快感；没有时间压力、没有评价，
 * 节奏完全由她掌控。
 *
 * DOM + CSS 3D 翻面，不用 canvas —— 没有动画循环就没有冻结。
 */

interface CardState extends PairCard {
  flipped: boolean;
  matched: boolean;
}

export default function ShellCollector() {
  const spendPlayTokens = useStore((s) => s.spendPlayTokens);
  const playTokens = useStore((s) => s.playTokens);
  const audio = useAudio();

  const [cards, setCards] = useState<CardState[]>([]);
  const [steps, setSteps] = useState(0);
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  /** 翻回等待中锁住点击，防连点错乱 */
  const lock = useRef(false);
  const flipBackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
    },
    []
  );

  const safeAudio = (fn: () => void) => {
    try {
      fn();
    } catch {
      /* 声音失败绝不能影响游戏 */
    }
  };

  const start = () => {
    if (!spendPlayTokens(1)) {
      return; // 次数不足 —— 按钮层已禁用并写明原因，这里只兜底
    }
    setCards(
      makePairCards().map((c) => ({ ...c, flipped: false, matched: false }))
    );
    setSteps(0);
    lock.current = false;
    setPhase("playing");
  };

  const flip = (id: number) => {
    if (lock.current) return;
    setCards((prev) => {
      const card = prev.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return prev;

      const open = prev.filter((c) => c.flipped && !c.matched);
      const next = prev.map((c) => (c.id === id ? { ...c, flipped: true } : c));

      if (open.length === 0) return next; // 第一张，等下一张

      // 第二张：判定
      const first = open[0];
      setSteps((s) => s + 1);

      if (first.value === card.value) {
        safeAudio(() => audio.collect());
        const done = next.map((c) =>
          c.value === card.value ? { ...c, matched: true } : c
        );
        if (done.every((c) => c.matched)) {
          // 全收齐：稍等让最后的金光看完
          setTimeout(() => setPhase("done"), 650);
        }
        return done;
      }

      // 不等：亮一会儿再翻回，让她有时间把两个值记进脑子
      safeAudio(() => audio.error());
      lock.current = true;
      flipBackTimer.current = setTimeout(() => {
        setCards((cur) =>
          cur.map((c) =>
            c.id === first.id || c.id === id ? { ...c, flipped: false } : c
          )
        );
        lock.current = false;
      }, 900);
      return next;
    });
  };

  const matchedPairs = cards.filter((c) => c.matched).length / 2;

  return (
    <div className="flex flex-col items-center p-3">
      <div className="flex items-center justify-between w-full max-w-sm mb-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
        <Mascot size={26} />
        <span className="font-body font-bold text-slate-100">沉船翻牌</span>
        <span className="font-body text-sm text-amber-300 font-bold">
          🐚 {matchedPairs}/6
        </span>
        <span className="font-body text-sm text-slate-400">{steps} 步</span>
      </div>

      <div className="sr-only" aria-live="polite">
        {phase === "done"
          ? `完成！${steps} 步收齐 6 对`
          : `已配对 ${matchedPairs} 对，用了 ${steps} 步`}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 w-full max-w-sm"
        style={{
          background:
            "linear-gradient(180deg, #0B1026 0%, #0D2137 55%, #0F3A42 100%)",
        }}
      >
        {/* 环境光点缀 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(220px 140px at 20% 8%, rgba(79,209,197,0.12), transparent), radial-gradient(260px 180px at 85% 90%, rgba(183,148,244,0.10), transparent)",
          }}
        />

        {phase === "playing" ? (
          <div className="relative grid grid-cols-3 gap-2.5 p-3">
            {cards.map((c) => {
              const open = c.flipped || c.matched;
              return (
                <button
                  key={c.id}
                  onClick={() => flip(c.id)}
                  disabled={open}
                  className="relative aspect-[3/4] rounded-xl"
                  style={{ perspective: "600px" }}
                  aria-label={open ? `算式 ${c.text}` : "背面朝上的牌"}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-300"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: open ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* 背面：贝壳 */}
                    <div
                      className="absolute inset-0 rounded-xl flex items-center justify-center border border-white/15"
                      style={{
                        backfaceVisibility: "hidden",
                        background:
                          "linear-gradient(145deg, #16283C 0%, #0F1D2E 60%, #142E3A 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-2xl opacity-70">🐚</span>
                    </div>
                    {/* 正面：算式 */}
                    <div
                      className={`absolute inset-0 rounded-xl flex items-center justify-center border ${
                        c.matched ? "border-amber-300/70" : "border-teal-200/40"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: c.matched
                          ? "linear-gradient(145deg, rgba(246,193,119,0.28), rgba(246,193,119,0.10))"
                          : "linear-gradient(145deg, rgba(224,242,254,0.95), rgba(186,220,245,0.9))",
                        boxShadow: c.matched
                          ? "0 0 14px rgba(246,193,119,0.45)"
                          : "none",
                      }}
                    >
                      <span
                        className={`font-body font-bold text-lg ${
                          c.matched ? "text-amber-200" : "text-slate-800"
                        }`}
                      >
                        {c.text}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center py-20 px-6">
            {phase === "done" ? (
              <>
                <div className="text-4xl mb-3">🏴‍☠️</div>
                <div className="font-body text-slate-100 font-bold text-xl mb-1">
                  {steps} 步收齐 6 对！
                </div>
                <p className="font-body text-slate-400 text-sm mb-5">
                  步数越少，说明记得越牢
                </p>
                <button
                  onClick={start}
                  disabled={playTokens < 1}
                  className="bg-amber-400 text-slate-900 px-8 py-3 rounded-full font-body font-bold text-lg hover:bg-amber-300 transition shadow-lg active:scale-95 disabled:opacity-40"
                >
                  {playTokens >= 1
                    ? `再翻一局（剩 ${playTokens} 次）`
                    : "游戏次数用完了"}
                </button>
                {playTokens < 1 && (
                  <p className="font-body text-slate-400 text-xs mt-3">
                    去干「今天的活儿」，每张工单 +1 次
                  </p>
                )}
              </>
            ) : (
              <>
                <Mascot size={60} />
                <p className="font-body text-slate-100 mt-4 mb-1 text-base font-bold">
                  沉船里藏着 6 对贝壳
                </p>
                <p className="font-body text-slate-400 mb-1 text-sm text-center">
                  两张牌上的算式，
                  <span className="text-amber-300 font-bold">算出来一样大</span>
                  才是一对
                </p>
                <p className="font-body text-slate-500 mb-5 text-xs">
                  比如 3+4 和 9−2 —— 都是 7
                </p>
                <button
                  onClick={start}
                  disabled={playTokens < 1}
                  className="bg-amber-400 text-slate-900 px-10 py-3 rounded-full font-body font-bold text-lg hover:bg-amber-300 transition shadow-lg active:scale-95 disabled:opacity-40"
                >
                  {playTokens >= 1
                    ? `开始翻（剩 ${playTokens} 次）`
                    : "游戏次数用完了"}
                </button>
                {playTokens < 1 && (
                  <p className="font-body text-slate-400 text-xs mt-3">
                    去干「今天的活儿」，每张工单 +1 次
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <p className="font-body text-xs text-slate-500 mt-2">
        不限时间 —— 慢慢算，慢慢记
      </p>
    </div>
  );
}
