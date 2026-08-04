import { useMemo, useRef, useState } from "react";
import useStore from "../../store/useStore";
import {
  nextWorkOrder,
  ordersLeftToday,
  shouldAdvanceTrunk,
  ORDERS_PER_SHIFT,
  TASKS_PER_ORDER,
  WAGE_PER_ORDER,
} from "../../engine/shiftPlanner";
import {
  fractionTasksFor,
  trunkTasksFor,
  totalTicks,
  tickLabel,
  type LineTask,
} from "../../data/lineTasks";
import type { FractionSkill } from "../../data/fractionTasks";
import { flushPersistence } from "../../hooks/usePersistence";

/* 数轴视图参数 */
const VBW = 340;
const VBH = 150;
const PAD_X = 26;
const LINE_Y = 84;
const SPAN = VBW - PAD_X * 2;

/**
 * 本地日期。绝不能用 toISOString（UTC）：北京=UTC+8，早上 8 点前
 * UTC 还是昨天 —— 她早 7 点做满 3 张，8 点后日期翻新、班次重置，
 * 一天能领两份工资。打烊必须按她自己的一天算。
 */
const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/**
 * 只有两个真实状态。打烊**不存 state**，每次渲染由剩余张数实时推导 ——
 * 持久化是异步加载的，挂载那一刻 shiftDoneToday 还是 0，
 * 把打烊冻进 state 会导致刷新后显示「还剩 0 张」却仍给「开工」按钮。
 */
type Phase = "counter" | "working";

export default function ShiftShell({ ready = true }: { ready?: boolean }) {
  const setView = useStore((s) => s.setView);
  const answerRecords = useStore((s) => s.answerRecords);
  const masteredNodes = useStore((s) => s.masteredNodes);
  const shiftDate = useStore((s) => s.shiftDate);
  const shiftDoneToday = useStore((s) => s.shiftDoneToday);
  const completeWorkOrder = useStore((s) => s.completeWorkOrder);
  const masterNode = useStore((s) => s.masterNode);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const addFragments = useStore((s) => s.addFragments);
  const addPearls = useStore((s) => s.addPearls);
  const addPlayTokens = useStore((s) => s.addPlayTokens);
  const showToast = useStore((s) => s.showToast);

  const today = todayStr();
  const left = ordersLeftToday(shiftDate, shiftDoneToday, today);

  const [phase, setPhase] = useState<Phase>("counter");
  /** 干完了就是打烊 —— 由 left 实时推导，不存 state */
  const closed = phase === "counter" && left <= 0;
  const [tasks, setTasks] = useState<LineTask[]>([]);
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [solved, setSolved] = useState(false);
  const [miss, setMiss] = useState<"left" | "right" | null>(null);
  /** 只记第一次作答 —— 诊断靠它，后面允许她试到对 */
  const firstTry = useRef(true);
  const startedAt = useRef(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  /** 这一张工单练什么，由路由器决定；她看不到这层。
      记录或掌握变化就重算 —— order 只在开工那一刻被读取，多算无害 */
  const order = useMemo(
    () => nextWorkOrder(answerRecords, masteredNodes),
    [answerRecords, masteredNodes]
  );

  const task = tasks[idx];

  const startOrder = () => {
    const next =
      order.kind === "elementary"
        ? fractionTasksFor(order.target as FractionSkill, TASKS_PER_ORDER)
        : trunkTasksFor(order.target, TASKS_PER_ORDER);
    // 补漏层没有内容时不能开天窗，回落到主干题
    const list =
      next.length > 0 ? next : trunkTasksFor(order.target, TASKS_PER_ORDER);
    setTasks(list);
    setIdx(0);
    resetTask(list[0]);
    setPhase("working");
  };

  function resetTask(t: LineTask | undefined) {
    setTick(t?.fromTick ?? 0);
    setSolved(false);
    setMiss(null);
    firstTry.current = true;
    startedAt.current = Date.now();
  }

  const xOfTick = (t: number) =>
    PAD_X + (t / Math.max(1, totalTicks(task))) * SPAN;

  const tickFromClientX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !task) return 0;
    const local = ((clientX - rect.left) * VBW) / rect.width;
    const raw = ((local - PAD_X) / SPAN) * totalTicks(task);
    return Math.max(0, Math.min(totalTicks(task), Math.round(raw)));
  };

  const commit = () => {
    if (!task || solved) return;
    const ok = tick === task.answerTick;

    if (firstTry.current) {
      // 隐形诊断：只入库，界面上永不显示任何统计
      addAnswerRecord({
        nodeId: task.skill,
        correct: ok,
        latencyMs: Date.now() - startedAt.current,
        timestamp: Date.now(),
      });
      firstTry.current = false;
    }

    if (ok) {
      setSolved(true);
      setMiss(null);
    } else {
      // 答错不阻断：只给方向，免费重试到对
      setMiss(tick < task.answerTick ? "right" : "left");
    }
  };

  const next = () => {
    if (idx < tasks.length - 1) {
      const n = idx + 1;
      setIdx(n);
      resetTask(tasks[n]);
      return;
    }
    // 完工结算：固定工资，与对错无关 —— 工资浮动等于用钱评价她。
    // 首试对错早已静默入库，只喂路由器和家长看板。
    addFragments(WAGE_PER_ORDER.fragments);
    addPearls(WAGE_PER_ORDER.pearls);
    addPlayTokens(WAGE_PER_ORDER.playTokens);
    showToast("pearl", WAGE_PER_ORDER.pearls);

    // 主干推进：唯一允许写 masterNode 的地方。
    // 最近 4 条首试对 3 条即前进 —— 一张全对的工单就够，快速爬升。
    if (
      order.kind === "trunk" &&
      shouldAdvanceTrunk(useStore.getState().answerRecords, order.target)
    ) {
      masterNode(order.target);
    }

    completeWorkOrder(today);
    flushPersistence();

    setPhase("counter"); // 打烊与否由 left 实时推导
  };

  /* ═══════════ 渲染 ═══════════ */

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-screen font-body flex flex-col text-slate-100"
      style={{
        background:
          "linear-gradient(180deg, #0A0E14 0%, #111A24 50%, #16202C 100%)",
      }}
    >
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-[11px] text-slate-500 tracking-wide">
          {phase === "working" && task
            ? `${idx + 1} / ${tasks.length}`
            : "今天的活儿"}
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

  /* ── 打烊 ── */
  if (closed) {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-5">🌙</div>
        <h1 className="font-display text-3xl text-slate-100 mb-3">
          今天收工了
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-2">
          今天的活儿干完了，工资已经结给你。
        </p>
        <p className="text-xs text-slate-600">明天再来</p>
      </div>
    );
  }

  /* ── 工位（开工前）── */
  if (phase === "counter") {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-5">🧾</div>
        <h1 className="font-display text-3xl text-slate-100 mb-2">
          今天的活儿
        </h1>
        <p className="text-sm text-slate-400 mb-1">
          还剩 {left} 张，每张 {TASKS_PER_ORDER} 个
        </p>
        <p className="text-xs text-slate-600 mb-10">
          干完就收工，做错不扣钱，能重来
        </p>
        <button
          onClick={startOrder}
          disabled={!ready}
          className="px-10 py-4 rounded-full bg-amber-400 text-slate-900 text-base font-bold shadow-lg hover:bg-amber-300 transition active:scale-95 disabled:opacity-40"
        >
          {ready ? "开工" : "准备中…"}
        </button>
        <div className="mt-8 flex gap-1.5">
          {Array.from({ length: ORDERS_PER_SHIFT }, (_, i) => (
            <span
              key={i}
              className={`w-6 h-1 rounded-full ${
                i < ORDERS_PER_SHIFT - left ? "bg-amber-400" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── 干活 ── */
  if (!task) return shell(<div className="flex-1" />);
  const total = totalTicks(task);

  return shell(
    <div className="flex-1 flex flex-col px-4">
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
          <line
            x1={PAD_X}
            y1={LINE_Y}
            x2={xOfTick(tick)}
            y2={LINE_Y}
            stroke={solved ? "#34D399" : "#FBBF24"}
            strokeWidth={3}
            strokeOpacity={0.35}
          />
          <line
            x1={PAD_X}
            y1={LINE_Y}
            x2={VBW - PAD_X}
            y2={LINE_Y}
            stroke="#48596B"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {Array.from({ length: total + 1 }, (_, t) => {
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
          {/* 整刻度标签：整数线上密就每 5 格标一次 */}
          {Array.from(
            { length: Math.floor(total / task.ticks) + 1 },
            (_, w) => {
              const v = task.min + w;
              const dense = total / task.ticks > 8;
              if (dense && v % 2 !== 0) return null;
              return (
                <text
                  key={w}
                  x={xOfTick(w * task.ticks)}
                  y={LINE_Y + 32}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#7A8CA0"
                >
                  {v}
                </text>
              );
            }
          )}

          {task.fromTick !== null && (
            <>
              <circle
                cx={xOfTick(task.fromTick)}
                cy={LINE_Y}
                r={6}
                fill="#111A24"
                stroke="#6F93C4"
                strokeWidth={2}
              />
              {task.fromLabel && (
                <text
                  x={xOfTick(task.fromTick)}
                  y={LINE_Y + 50}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8FB0DC"
                >
                  {task.fromLabel}
                </text>
              )}
            </>
          )}

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
            {tickLabel(task, tick)}
          </text>
        </svg>
      </div>

      <div className="min-h-[3rem] text-center">
        {solved ? (
          <p className="text-sm text-emerald-400">好了</p>
        ) : miss ? (
          <p className="text-sm text-rose-300">
            再往{miss === "left" ? "左" : "右"}一点 · {task.hint}
          </p>
        ) : (
          <p className="text-xs text-slate-600">拖动标记，或直接点线上的位置</p>
        )}
      </div>

      <div className="pb-8 pt-2">
        {solved ? (
          <button
            onClick={next}
            className="w-full py-4 rounded-full bg-amber-400 text-slate-900 text-base font-bold shadow-lg hover:bg-amber-300 transition active:scale-95"
          >
            {idx < tasks.length - 1 ? "下一个 →" : "这张干完了"}
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
