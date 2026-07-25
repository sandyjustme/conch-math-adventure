import { useEffect, useMemo, useRef, useState } from "react";
import useStore from "../../store/useStore";
import { getGlobalMultiplier } from "../../engine/rewardEngine";
import {
  ALL_TASKS,
  DIVE_MAX,
  DIVE_MIN,
  NODE_NAME,
  readout,
  signed,
  type NodeId,
} from "../../data/diveTasks";

/**
 * 潜水算术 —— 有理数「内在整合」练习场。
 * 同一片大海、同一只海螺，用 5 种动手玩法覆盖数轴上的知识点：
 *   放位置(K1/K3) · 相反数镜像(K5) · 绝对值深度(K6) · 比大小(K7) · 加减法走格(K8/K10)
 * 规则不是讲出来的，是用手指走出来的。
 * 题库在 src/data/diveTasks.ts，本文件只负责渲染与交互。
 */

// 几何常量（SVG viewBox 内部坐标）
const VBW = 320;
const VBH = 470;
const PAD_TOP = 36;
const PAD_BOTTOM = 36;
const MAX = DIVE_MAX;
const MIN = DIVE_MIN;
const AXIS_X = 176;
const UNIT = (VBH - PAD_TOP - PAD_BOTTOM) / (MAX - MIN);
const valueToY = (v: number) => PAD_TOP + (MAX - v) * UNIT;
const SEA_Y = valueToY(0);

let _ac: AudioContext | null = null;
function beep(freq: number, on: boolean) {
  if (!on) return;
  try {
    _ac =
      _ac ||
      new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext ||
        AudioContext
      )();
    const o = _ac.createOscillator();
    const g = _ac.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(_ac.destination);
    g.gain.setValueAtTime(0.14, _ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _ac.currentTime + 0.25);
    o.start();
    o.stop(_ac.currentTime + 0.25);
  } catch {
    /* Web Audio 静默失败 */
    /* 静默失败 */
  }
}

export default function DiveMath() {
  const setView = useStore((s) => s.setView);
  const addFragments = useStore((s) => s.addFragments);
  const addPearls = useStore((s) => s.addPearls);
  const addPlayTokens = useStore((s) => s.addPlayTokens);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const showToast = useStore((s) => s.showToast);
  const sfxEnabled = useStore((s) => s.sfxEnabled);
  const diveFocus = useStore((s) => s.diveFocus);
  const diveFromAdventure = useStore((s) => s.diveFromAdventure);
  const todayAdventureCount = useStore((s) => s.todayAdventureCount);

  const tasks = useMemo(
    () =>
      diveFocus ? ALL_TASKS.filter((t) => t.node === diveFocus) : ALL_TASKS,
    [diveFocus]
  );
  const focusLabel = diveFocus ? NODE_NAME[diveFocus as NodeId] : "全程";

  const [levelIdx, setLevelIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [current, setCurrent] = useState(() => tasks[0]?.startAt ?? 0);
  const [trail, setTrail] = useState<
    { from: number; to: number; label: string }[]
  >([]);
  const [hint, setHint] = useState<{ dir: "up" | "down" } | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem("diveIntroSeen") !== "1";
    } catch {
      return true;
    }
  });
  const dismissIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem("diveIntroSeen", "1");
    } catch {
      /* 忽略 */
    }
  };

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);

  const task = tasks[Math.min(levelIdx, Math.max(0, tasks.length - 1))];
  const steps = task?.steps;
  const step = steps?.[stepIdx];
  const beginLevel = (idx: number) => {
    setLevelIdx(idx);
    setStepIdx(0);
    setCurrent(tasks[idx].startAt);
    setTrail([]);
    setHint(null);
    setWrongCount(0);
    setPhase("playing");
  };

  // diveFocus 变化（换了知识点进来）时回到第 1 关
  useEffect(() => {
    setLevelIdx(0);
    setStepIdx(0);
    setCurrent(tasks[0]?.startAt ?? 0);
    setTrail([]);
    setHint(null);
    setPhase("playing");
  }, [diveFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  const yToValue = (clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const localY = (clientY - rect.top) * (VBH / rect.height);
    let v = MAX - (localY - PAD_TOP) / UNIT;
    v = Math.round(v);
    return Math.max(MIN, Math.min(MAX, v));
  };

  const evaluate = (v: number) => {
    if (v === step.to) {
      beep(880, sfxEnabled);
      setTrail((t) => [
        ...t,
        { from: step.from, to: step.to, label: step.main },
      ]);
      setHint(null);
      if (stepIdx === steps.length - 1) {
        setPhase("done");
        // 答错倒扣 + 倍率计算
        const base = Math.max(0, 1 - wrongCount * 0.2);
        const fromAdventure = diveFromAdventure ? 1.5 : 1.0;
        const globalMult = getGlobalMultiplier(todayAdventureCount);
        const final = Math.floor(base * fromAdventure * globalMult);
        if (final > 0) {
          addFragments(final);
          addPearls(1);
          addPlayTokens(2);
          showToast("fragment", final);
        }
        addAnswerRecord({
          nodeId: task.node,
          correct: true,
          latencyMs: 0,
          timestamp: Date.now(),
        });
      } else {
        setCurrent(step.to);
        setStepIdx((i) => i + 1);
      }
    } else {
      beep(220, sfxEnabled);
      // 只显示方向，不暴露精确终点
      setHint({ dir: step.to > step.from ? "up" : "down" });
      setWrongCount((c) => c + 1);
      setCurrent(step.from);
    }
  };

  const onDown = (e: React.PointerEvent<SVGGElement>) => {
    if (phase !== "playing") return;
    dragging.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    setCurrent(yToValue(e.clientY));
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    svgRef.current?.releasePointerCapture(e.pointerId);
    evaluate(yToValue(e.clientY));
  };

  const ticks: number[] = [];
  for (let i = MIN; i <= MAX; i++) ticks.push(i);

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ocean-shimmer px-6 text-center">
        <div className="text-5xl mb-4">🐚</div>
        <h2 className="font-display text-2xl text-stone-600 mb-2">
          这片海域还没有题目
        </h2>
        <button
          onClick={() => setView("cafe")}
          className="px-6 py-3 rounded-full bg-teal-500 text-white font-bold text-sm"
        >
          回咖啡馆
        </button>
      </div>
    );
  }
  if (!steps || steps.length === 0 || !step) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ocean-shimmer px-6 text-center">
        <div className="text-5xl mb-4">🐚</div>
        <h2 className="font-display text-2xl text-stone-600 mb-2">
          这道题还没有步骤
        </h2>
        <button
          onClick={() => setView("cafe")}
          className="px-6 py-3 rounded-full bg-teal-500 text-white font-bold text-sm"
        >
          回咖啡馆
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-body bg-ocean-shimmer">
      <div className="max-w-md md:max-w-lg mx-auto px-4 py-4">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setView("cafe")}
            className="text-ocean-surface text-sm font-bold px-3 py-1 rounded-full bg-white/70 hover:bg-white"
          >
            ← 回咖啡馆
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {focusLabel} · 第 {levelIdx + 1}/{tasks.length} 关
            </span>
            <button
              onClick={() => setShowIntro(true)}
              className="text-ocean-surface text-sm font-bold w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center"
              aria-label="怎么玩"
            >
              ?
            </button>
          </div>
        </div>

        {/* 题目 */}
        <div className="text-center mb-2">
          <div className="font-display text-2xl text-ocean-deep tracking-wide">
            {task.title}
          </div>
          <div className="text-xs text-slate-500 mt-1">{task.tip}</div>
        </div>

        {/* 当前指令 / 完成提示 */}
        {phase === "playing" ? (
          <div className="bg-white/80 rounded-2xl p-3 mb-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < stepIdx
                      ? "bg-shell-DEFAULT"
                      : i === stepIdx
                        ? "bg-ocean-surface"
                        : "bg-slate-200"
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 ml-1.5">
                走对 {steps.length} 步就过关
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-0.5">
              {steps.length > 1
                ? `第 ${stepIdx + 1} 步 · ${step.why}`
                : step.why}
            </div>
            <div className="text-lg font-bold text-ocean-surface">
              {step.dir === "up" ? "↑ " : "↓ "}
              {step.main}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              拖着 🐚 游到对的位置
            </div>
          </div>
        ) : (
          <div className="bg-cafe-warm rounded-2xl p-3 mb-3 text-center shadow-sm">
            <div className="text-lg font-bold text-shell-dark">🎉 走对了！</div>
            <div className="text-sm text-slate-600 mt-1">{task.recap}</div>
          </div>
        )}

        {/* 海洋数轴 */}
        <div className="rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            width="100%"
            className="select-none touch-none block"
            onPointerMove={onMove}
            onPointerUp={onUp}
          >
            <defs>
              <linearGradient id="dm-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DFF4FF" />
                <stop offset="100%" stopColor="#F2FCFF" />
              </linearGradient>
              <linearGradient id="dm-sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B7FA8" />
                <stop offset="100%" stopColor="#052A44" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={VBW} height={SEA_Y} fill="url(#dm-sky)" />
            <rect
              x="0"
              y={SEA_Y}
              width={VBW}
              height={VBH - SEA_Y}
              fill="url(#dm-sea)"
            />
            <line
              x1="0"
              y1={SEA_Y}
              x2={VBW}
              y2={SEA_Y}
              stroke="#0B4D6E"
              strokeWidth="2"
            />
            <text x="10" y={SEA_Y - 6} fontSize="12" fill="#0B4D6E">
              海面 0
            </text>

            {/* 刻度 */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={AXIS_X - 7}
                  y1={valueToY(t)}
                  x2={AXIS_X + 7}
                  y2={valueToY(t)}
                  stroke={t < 0 ? "#9FD6EC" : "#7FB8CE"}
                  strokeWidth="1.5"
                />
                <text
                  x={AXIS_X - 14}
                  y={valueToY(t) + 4}
                  fontSize="11"
                  textAnchor="end"
                  fill={t < 0 ? "#CDEBF7" : "#4A7A8E"}
                >
                  {t > 0 ? `+${t}` : t}
                </text>
              </g>
            ))}

            {/* 竖轴 */}
            <line
              x1={AXIS_X}
              y1={PAD_TOP}
              x2={AXIS_X}
              y2={VBH - PAD_BOTTOM}
              stroke="#ffffff66"
              strokeWidth="2"
            />

            {/* 参考标记（幽灵）*/}
            {task.ghosts.map((g, i) => (
              <g key={i}>
                <circle
                  cx={AXIS_X}
                  cy={valueToY(g.v)}
                  r="13"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  opacity="0.9"
                />
                <text
                  x={AXIS_X + 20}
                  y={valueToY(g.v) + 4}
                  fontSize="11"
                  fill={g.v < 0 ? "#DCF4FF" : "#0B4D6E"}
                >
                  {g.label}
                </text>
              </g>
            ))}

            {/* 已走过的轨迹 */}
            {trail.map((seg, i) => (
              <g key={i}>
                <line
                  x1={AXIS_X}
                  y1={valueToY(seg.from)}
                  x2={AXIS_X}
                  y2={valueToY(seg.to)}
                  stroke="#F5A623"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <text
                  x={AXIS_X + 16}
                  y={(valueToY(seg.from) + valueToY(seg.to)) / 2 + 4}
                  fontSize="11"
                  fill="#B36A00"
                >
                  {seg.label}
                </text>
              </g>
            ))}

            {/* 出错时的方向提示 */}
            {hint &&
              (() => {
                const arrowEnd =
                  hint.dir === "up"
                    ? Math.min(DIVE_MAX, step.from + 4)
                    : Math.max(DIVE_MIN, step.from - 4);
                return (
                  <g>
                    <line
                      x1={AXIS_X}
                      y1={valueToY(step.from)}
                      x2={AXIS_X}
                      y2={valueToY(arrowEnd)}
                      stroke="#F87171"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                    <text
                      x={AXIS_X + 16}
                      y={valueToY(arrowEnd) + 4}
                      fontSize="11"
                      fill="#EF4444"
                    >
                      往{hint.dir === "up" ? "上浮 ↑" : "下潜 ↓"}
                    </text>
                  </g>
                );
              })()}

            {/* 海螺（可拖动） */}
            <g
              transform={`translate(${AXIS_X}, ${valueToY(current)})`}
              onPointerDown={onDown}
              style={{ cursor: phase === "playing" ? "grab" : "default" }}
            >
              <circle r="18" fill="#ffffff" opacity="0.95" />
              <circle r="18" fill="none" stroke="#F5A623" strokeWidth="2" />
              <text y="7" fontSize="22" textAnchor="middle">
                🐚
              </text>
            </g>

            {/* 当前深度读数 */}
            <g transform={`translate(${AXIS_X + 30}, ${valueToY(current)})`}>
              <rect
                x="0"
                y="-13"
                width="118"
                height="26"
                rx="13"
                fill="#ffffffdd"
              />
              <text x="10" y="5" fontSize="12" fill="#0B4D6E" fontWeight="bold">
                {readout(current)}（{signed(current)}）
              </text>
            </g>
          </svg>
        </div>

        {/* 底部操作 */}
        <div className="mt-4 flex gap-3">
          {phase === "playing" ? (
            <button
              onClick={() => beginLevel(levelIdx)}
              className="flex-1 py-3 rounded-full bg-white/80 text-slate-500 text-sm font-bold hover:bg-white"
              aria-label="重新尝试这一关"
            >
              这一关重走
            </button>
          ) : levelIdx < tasks.length - 1 ? (
            <button
              onClick={() => beginLevel(levelIdx + 1)}
              className="flex-1 py-3 rounded-full bg-ocean-surface text-white text-sm font-bold hover:bg-ocean-surface/90"
              aria-label="进入下一关"
            >
              下一关 →
            </button>
          ) : (
            <button
              onClick={() => setView("cafe")}
              className="flex-1 py-3 rounded-full bg-shell-DEFAULT text-white text-sm font-bold hover:bg-shell-dark"
              aria-label="全部通关，返回咖啡馆"
            >
              全部通关，回咖啡馆 🎉
            </button>
          )}
        </div>
      </div>

      {showIntro && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-ocean-deep/60 p-4"
          onClick={dismissIntro}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-3">
              <div className="text-3xl">🐚</div>
              <h2 className="font-display text-2xl text-ocean-deep mt-1">
                怎么玩
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                看上面的题，用海螺在大海里「走」出答案
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 bg-sky-50 rounded-2xl p-3">
                <div className="text-2xl leading-none">👀</div>
                <div className="text-sm text-slate-600">
                  <b className="text-ocean-surface">看指令</b>
                  ：屏幕会告诉你这一步要做什么。
                </div>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-3">
                <div className="text-2xl leading-none">🫳</div>
                <div className="text-sm text-slate-600">
                  <b className="text-shell-dark">拖海螺</b>：把 🐚
                  拖到对的位置。走对「叮」一声，留下金色轨迹。
                </div>
              </div>
              <div className="flex items-start gap-3 bg-rose-50 rounded-2xl p-3">
                <div className="text-2xl leading-none">↩️</div>
                <div className="text-sm text-slate-600">
                  <b className="text-rose-500">走错了</b>
                  ：海螺会自己弹回来，红色虚线告诉你该往哪走，再试一次。
                </div>
              </div>
              <div className="flex items-start gap-3 bg-teal-50 rounded-2xl p-3">
                <div className="text-2xl leading-none">🏁</div>
                <div className="text-sm text-slate-600">
                  <b className="text-teal-600">怎样算过关</b>
                  ：把指令都走对，海螺停在终点、跳出答案 = 通关！
                </div>
              </div>
            </div>
            <button
              onClick={dismissIntro}
              className="mt-4 w-full py-3 rounded-full bg-ocean-surface text-white font-bold hover:bg-ocean-surface/90"
            >
              开始探险 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
