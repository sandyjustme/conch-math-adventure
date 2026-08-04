import { useEffect, useMemo, useRef, useState } from "react";
import useStore from "../../store/useStore";
import {
  PROBE_SET,
  PRACTICE_BY_SKILL,
  SKILL_NAME,
  TASKS_PER_ROUND,
  type FractionTask,
} from "../../data/fractionTasks";
import {
  judgeDrop,
  computeRoundReward,
  summarizeBySkill,
  findBreakpoint,
  statsFromRecords,
} from "../../engine/fractionEngine";
import { flushPersistence } from "../../hooks/usePersistence";

/* 数轴视图参数。标签分居上下，避免端点 0 和当前位置叠在一起 */
const VBW = 340;
const VBH = 150;
const PAD_X = 26;
const LINE_Y = 84; // 上方留给当前位置的大标签
const SPAN = VBW - PAD_X * 2;

type Phase = "intro" | "playing" | "done";

export default function FractionLine() {
  const setView = useStore((s) => s.setView);
  const answerRecords = useStore((s) => s.answerRecords);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const addPlayTokens = useStore((s) => s.addPlayTokens);

  /**
   * 这一轮练什么：还没摸过底就走 PROBE_SET（横跨各层，隐形定位断点）；
   * 已经知道断在哪一层，就专攻那一层，不够十题再用探针题补齐。
   * 她感觉到的只是「今天这十题」，看不到任何测评。
   */
  const tasks = useMemo<FractionTask[]>(() => {
    const known = findBreakpoint(statsFromRecords(answerRecords));
    if (!known) return PROBE_SET;
    const focused = PRACTICE_BY_SKILL[known];
    const filler = PROBE_SET.filter((t) => t.skill === known);
    const pool = [...focused, ...filler];
    const out: FractionTask[] = [];
    while (out.length < TASKS_PER_ROUND && pool.length > 0) {
      out.push(pool[out.length % pool.length]);
    }
    return out.slice(0, TASKS_PER_ROUND);
    // 只在进场时决定一次，做题过程中不重算
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  /** 本题是否已经答对过（答对才放行下一题） */
  const [solved, setSolved] = useState(false);
  /** 答错后给的方向提示 */
  const [miss, setMiss] = useState<"left" | "right" | null>(null);
  /** 本题第一次作答对不对 —— 诊断只认第一次，后面允许她试到对 */
  const firstTry = useRef(true);
  const [results, setResults] = useState<
    { task: FractionTask; correct: boolean }[]
  >([]);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const task = tasks[idx];
  const totalTicks = task ? task.ticks * task.max : 1;

  // 换题时把标记放回起点
  useEffect(() => {
    if (!task) return;
    const start = task.from
      ? Math.round((task.from.n / task.from.d) * task.ticks)
      : 0;
    setTick(start);
    setSolved(false);
    setMiss(null);
    firstTry.current = true;
  }, [idx, task]);

  const xOfTick = (t: number) => PAD_X + (t / totalTicks) * SPAN;

  const tickFromClientX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const local = ((clientX - rect.left) * VBW) / rect.width;
    const raw = ((local - PAD_X) / SPAN) * totalTicks;
    return Math.max(0, Math.min(totalTicks, Math.round(raw)));
  };

  const commit = () => {
    if (!task || solved) return;
    const verdict = judgeDrop(task, tick);

    if (firstTry.current) {
      // 隐形诊断：nodeId 存技能层，只记第一次
      addAnswerRecord({
        nodeId: task.skill,
        correct: verdict.correct,
        latencyMs: 0,
        timestamp: Date.now(),
      });
      setResults((r) => [...r, { task, correct: verdict.correct }]);
      firstTry.current = false;
    }

    if (verdict.correct) {
      setSolved(true);
      setMiss(null);
    } else {
      // 答错不阻断：给方向，让她接着试，试到对为止
      setMiss(verdict.direction);
    }
  };

  const next = () => {
    if (idx < tasks.length - 1) {
      setIdx((i) => i + 1);
      return;
    }
    // 一轮闭环：当场结算、当场结束
    const correctCount = results.filter((r) => r.correct).length;
    const reward = computeRoundReward(correctCount, results.length);
    /* v4 单水龙头：珍珠与碎片只从「今天的活儿」来，此处停发 */
    addPlayTokens(reward.playTokens);
    flushPersistence();
    setPhase("done");
  };

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-screen font-body flex flex-col text-slate-100"
      style={{
        background:
          "linear-gradient(180deg, #0A0E14 0%, #111A24 50%, #16202C 100%)",
      }}
    >
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={() => setView("drama")}
          className="text-slate-500 hover:text-slate-300 text-sm"
          aria-label="返回"
        >
          ←
        </button>
        <span className="text-[11px] text-slate-500 tracking-wide">
          {phase === "playing" ? `${idx + 1} / ${tasks.length}` : "刻线"}
        </span>
        <span className="w-4" />
      </header>
      {children}
    </div>
  );

  /* ── 开场 ── */
  if (phase === "intro") {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-5">📏</div>
        <h1 className="font-display text-3xl text-slate-100 mb-3">刻线</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-10">
          把标记拖到线上对的位置。
          <br />
          拖错了没关系，会告诉你偏哪边，接着试就行。
          <br />
          <span className="text-slate-500">十次，做完就结束。</span>
        </p>
        <button
          onClick={() => setPhase("playing")}
          className="px-10 py-4 rounded-full bg-amber-400 text-slate-900 text-base font-bold shadow-lg hover:bg-amber-300 transition active:scale-95"
        >
          开始
        </button>
      </div>
    );
  }

  /* ── 结束 ── */
  if (phase === "done") {
    const stats = summarizeBySkill(results);
    const weak = findBreakpoint(stats);
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-display text-2xl text-amber-300 mb-2">
          这十次走完了
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          {weak
            ? `下次从「${SKILL_NAME[weak]}」这儿接着走`
            : "线上的位置你都找得到了"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIdx(0);
              setResults([]);
              setPhase("playing");
            }}
            className="px-7 py-3 rounded-full bg-white/10 border border-white/20 text-slate-200 text-sm font-bold hover:bg-white/15 transition"
          >
            再来十次
          </button>
          <button
            onClick={() => setView("drama")}
            className="px-7 py-3 rounded-full bg-amber-400 text-slate-900 text-sm font-bold hover:bg-amber-300 transition"
          >
            回去
          </button>
        </div>
      </div>
    );
  }

  /* ── 做题 ── */
  if (!task) return shell(<div className="flex-1" />);

  const fromTick = task.from
    ? Math.round((task.from.n / task.from.d) * task.ticks)
    : null;

  return shell(
    <div className="flex-1 flex flex-col px-4">
      {/* 进度点 */}
      <div className="flex justify-center gap-1.5 mb-8">
        {tasks.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i < idx
                ? "w-5 bg-amber-400/70"
                : i === idx
                  ? "w-5 bg-amber-400"
                  : "w-3 bg-white/15"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-lg leading-relaxed text-slate-100 mb-1 min-h-[3.5rem]">
        {task.prompt}
      </p>

      {/* 数轴 */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VBW} ${VBH}`}
          className="w-full max-w-md touch-none select-none"
          onPointerDown={(e) => {
            if (solved) return;
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setTick(tickFromClientX(e.clientX));
          }}
          onPointerMove={(e) => {
            if (!dragging.current || solved) return;
            setTick(tickFromClientX(e.clientX));
          }}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          {/* 已走过的一段：让"走了多远"看得见 */}
          <line
            x1={PAD_X}
            y1={LINE_Y}
            x2={xOfTick(tick)}
            y2={LINE_Y}
            stroke={solved ? "#34D399" : "#FBBF24"}
            strokeWidth={3}
            strokeOpacity={0.35}
          />
          {/* 主线 */}
          <line
            x1={PAD_X}
            y1={LINE_Y}
            x2={VBW - PAD_X}
            y2={LINE_Y}
            stroke="#48596B"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* 刻度：整数刻度更长更亮 */}
          {Array.from({ length: totalTicks + 1 }, (_, t) => {
            const whole = t % task.ticks === 0;
            return (
              <line
                key={t}
                x1={xOfTick(t)}
                y1={LINE_Y - (whole ? 12 : 7)}
                x2={xOfTick(t)}
                y2={LINE_Y + (whole ? 12 : 7)}
                stroke={whole ? "#93A5B8" : "#3B4957"}
                strokeWidth={whole ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
          {/* 端点标签统一在下方 */}
          {Array.from({ length: task.max + 1 }, (_, w) => (
            <text
              key={w}
              x={xOfTick(w * task.ticks)}
              y={LINE_Y + 32}
              textAnchor="middle"
              fontSize="12"
              fill="#7A8CA0"
            >
              {w}
            </text>
          ))}

          {/* 起点（加减题）：空心环 + 下方标签，跟当前位置错开 */}
          {fromTick !== null && (
            <>
              <circle
                cx={xOfTick(fromTick)}
                cy={LINE_Y}
                r={6}
                fill="#111A24"
                stroke="#6F93C4"
                strokeWidth={2}
              />
              <text
                x={xOfTick(fromTick)}
                y={LINE_Y + 48}
                textAnchor="middle"
                fontSize="11"
                fill="#8FB0DC"
              >
                从 {task.from!.n}/{task.from!.d} 出发
              </text>
            </>
          )}

          {/* 她的标记 + 大标签在上方 */}
          <circle
            cx={xOfTick(tick)}
            cy={LINE_Y}
            r={solved ? 13 : 10}
            fill={solved ? "#34D399" : miss ? "#F87171" : "#FBBF24"}
            stroke="#0A0E14"
            strokeWidth={2}
            className="transition-all"
          />
          <text
            x={xOfTick(tick)}
            y={LINE_Y - 26}
            textAnchor="middle"
            fontSize="19"
            fill={solved ? "#34D399" : miss ? "#FCA5A5" : "#FBBF24"}
            fontWeight="bold"
          >
            {tick}/{task.ticks}
          </text>
        </svg>
      </div>

      {/* 反馈 */}
      <div className="min-h-[3rem] text-center">
        {solved ? (
          <p className="text-sm text-emerald-400">对了</p>
        ) : miss ? (
          <p className="text-sm text-rose-300">
            再往{miss === "left" ? "左" : "右"}一点 · {task.hint}
          </p>
        ) : (
          <p className="text-xs text-slate-600">拖动标记，或直接点线上的位置</p>
        )}
      </div>

      {/* 主按钮 */}
      <div className="pb-8 pt-2">
        {solved ? (
          <button
            onClick={next}
            className="w-full py-4 rounded-full bg-amber-400 text-slate-900 text-base font-bold shadow-lg hover:bg-amber-300 transition active:scale-95"
          >
            {idx < tasks.length - 1 ? "下一个 →" : "走完这十次"}
          </button>
        ) : (
          <button
            onClick={commit}
            className="w-full py-4 rounded-full bg-white/10 border border-white/20 text-slate-100 text-base font-bold hover:bg-white/15 transition active:scale-95"
          >
            就放这儿
          </button>
        )}
      </div>
    </div>
  );
}
