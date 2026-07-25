import { useEffect, useRef, useState } from "react";
import useStore from "../../store/useStore";
import { getGlobalMultiplier } from "../../engine/rewardEngine";
import { speak } from "../../services/tts";

/**
 * 分数珍珠 —— 古深海遗迹的第一个试点原型。
 * 上古石碑分成N格，孩子把M颗珍珠拖进格子里，
 * 在动手中发现"分数 = 整体分成几份、取了其中几份"。
 * 同一个咖啡世界的交互基因（拖拽即数学），只是沉到了更深的海域。
 */

interface Level {
  denom: number; // 石碑分几格（分母）
  numer: number; // 放几颗珍珠（分子）
  story: string; // 遗迹叙事的开场白
  recap: string; // 过关后的发现
}

const LEVELS: Level[] = [
  {
    denom: 2,
    numer: 1,
    story: "石碑分成了2格，旁边躺着1颗珍珠。古人留下了什么记号？",
    recap:
      "你把1颗珍珠放进了2格中的1格——古人管这个叫「二分之一」，写作 1/2。上面是放进去的珍珠，下面是总共的格子。",
  },
  {
    denom: 3,
    numer: 2,
    story: "这块石碑分成了3格，2颗珍珠在等你。",
    recap:
      "3格中放了2颗珍珠 → 2/3。这就是「三分之二」——一个整体切成3份，取了其中2份。",
  },
  {
    denom: 4,
    numer: 3,
    story: "石碑分成了4格，3颗珍珠——这次格子更多了。",
    recap:
      "4格中放了3颗 → 3/4，「四分之三」。格子越多，每一格就越小——古人用这个办法把任何东西切成一样大的份。",
  },
  {
    denom: 3,
    numer: 1,
    story: "同样是3格，但这次只有1颗珍珠。跟刚才的2/3有什么不一样？",
    recap:
      "3格中只放了1颗 → 1/3。同样是3格，珍珠少了，分到的份就少了——上面的数（分子）告诉你取了几份。",
  },
  {
    denom: 4,
    numer: 2,
    story: "4格、2颗珍珠。你有没有觉得这个和第一块石碑有点像？",
    recap:
      "4格中放2颗 → 2/4。这和1/2——2格中放1颗——其实一模一样！不同的写法，可以表示同样大的份。这个秘密，以后在深渊更深处还会见到。",
  },
  // 分数在哪儿（位置感）
  {
    denom: 5,
    numer: 2,
    story: "这块石碑分成了5格、2颗珍珠。2在5格的哪里？",
    recap:
      '5格中放2颗 → 2/5。分数不只是"切几份取几份"，它在石板上有一个确切的位置——在第2格和第3格之间。',
  },
  {
    denom: 6,
    numer: 1,
    story: "6格的石碑、只有1颗珍珠。这个分数好小。",
    recap:
      "6格中放1颗 → 1/6。分母越大，每一格越小，分数就越靠近石板的起点。古人用这个来量很细的东西。",
  },
  {
    denom: 8,
    numer: 5,
    story: "8格、5颗珍珠。石板一大半都亮了。",
    recap:
      "8格中放5颗 → 5/8。超过一半了。分数可以比一半大、比一半小——你放珍珠的时候一眼就能看出来。",
  },
  // 等值分数
  {
    denom: 6,
    numer: 3,
    story: "6格的石碑、3颗珍珠。你有没有想起前面某块石碑？",
    recap:
      "6格中放3颗 → 3/6。这和1/2（2格放1颗）、2/4（4格放2颗）完全一样大！1/2 = 2/4 = 3/6——这就是等值分数。不同的写法，同样的大小。",
  },
  {
    denom: 8,
    numer: 4,
    story: "最后一块石碑：8格、4颗珍珠。这是第几种跟1/2一样大的写法了？",
    recap:
      "8格中放4颗 → 4/8。四块石碑了：1/2、2/4、3/6、4/8——全都一样大！你把分子分母同时乘2、乘3、乘4，大小不变。上古石碑的秘密，你已经全部破译了。",
  },
];

// SVG 布局常量
const VBW = 360;
const VBH = 380;
const TABLET_X = 40;
const TABLET_Y = 60;
const TABLET_W = 280;
const TABLET_H = 80;
const SLOT_GAP = 4; // 格子之间的缝
const PEARL_R = 18;
const TRAY_Y = 210;

export default function FractionPearls() {
  const setView = useStore((s) => s.setView);
  const addFragments = useStore((s) => s.addFragments);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const showToast = useStore((s) => s.showToast);
  const todayAdventureCount = useStore((s) => s.todayAdventureCount);

  const [levelIdx, setLevelIdx] = useState(0);
  const lv = LEVELS[levelIdx];
  const slotW = (TABLET_W - SLOT_GAP * (lv.denom - 1)) / lv.denom;

  const [slots, setSlots] = useState<(number | null)[]>(() =>
    new Array(lv.denom).fill(null)
  );
  const [tray, setTray] = useState<number[]>(() =>
    Array.from({ length: lv.numer }, (_, i) => i)
  );
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [, setTick] = useState(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ pearl: number; from: "tray" | number } | null>(null);
  const dragging = dragRef.current;
  const placedCount = slots.filter((s) => s !== null).length;

  const setDragging = (v: { pearl: number; from: "tray" | number } | null) => {
    dragRef.current = v;
    setTick((n) => n + 1);
    if (!v) setDragPos(null);
  };

  // 切换关卡时强制重置
  useEffect(() => {
    const l = LEVELS[levelIdx];
    setSlots(new Array(l.denom).fill(null));
    setTray(Array.from({ length: l.numer }, (_, i) => i));
    setDragging(null);
    setDragPos(null);
    setPhase("playing");
  }, [levelIdx]);

  // 格子到实际 SVG 坐标
  const slotBox = (i: number) => ({
    x: TABLET_X + i * (slotW + SLOT_GAP),
    y: TABLET_Y,
    w: slotW,
    h: TABLET_H,
  });

  const beginLevel = (idx: number) => {
    const l = LEVELS[idx];
    setLevelIdx(idx);
    setSlots(new Array(l.denom).fill(null));
    setTray(Array.from({ length: l.numer }, (_, i) => i));
    setDragging(null);
    setDragPos(null);
    setPhase("playing");
  };

  // 把屏幕坐标转成 SVG viewBox 坐标
  const toSVG = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left) * (VBW / rect.width),
      y: (clientY - rect.top) * (VBH / rect.height),
    };
  };

  const hitSlot = (svx: number, svy: number): number | null => {
    for (let i = 0; i < lv.denom; i++) {
      const b = slotBox(i);
      if (svx >= b.x && svx <= b.x + b.w && svy >= b.y && svy <= b.y + b.h)
        return i;
    }
    return null;
  };

  // 放下珍珠
  const drop = (slotIdx: number) => {
    const d = dragRef.current;
    if (!d || slots[slotIdx] !== null) return;
    const newSlots = [...slots];
    newSlots[slotIdx] = d.pearl;
    // 从别的格子拖过来的 → 清空原来的格子；从托盘来的 → 托盘已经移走了，不动
    if (d.from !== "tray") newSlots[d.from] = null;
    setSlots(newSlots);
    // tray 不变：从托盘来的已移除，从格子来的不影响托盘
    dragRef.current = null;
    setDragPos(null);
    setTick((n) => n + 1);
    if (newSlots.filter((s) => s !== null).length === lv.numer) {
      setPhase("done");
      const mult = getGlobalMultiplier(todayAdventureCount);
      const earned = Math.floor(1 * mult);
      if (earned > 0) {
        addFragments(earned);
        showToast("fragment", earned);
      }
      // TTS 朗读过关小结
      setTtsPlaying(true);
      speak(lv.recap).finally(() => setTtsPlaying(false));
      addAnswerRecord({
        nodeId: "K1",
        correct: true,
        latencyMs: 0,
        timestamp: Date.now(),
      });
      showToast("fragment", 1);
    }
  };

  // 从格子里拖出来
  const pickFromSlot = (slotIdx: number) => {
    if (phase !== "playing" || slots[slotIdx] === null) return;
    const pearl = slots[slotIdx]!;
    const newSlots = [...slots];
    newSlots[slotIdx] = null;
    setSlots(newSlots);
    setTray([...tray, pearl]);
    dragRef.current = { pearl, from: slotIdx };
    setTick((n) => n + 1);
  };

  // 珍珠在托盘里的位置
  const trayPearlX = (i: number) => TABLET_X + 60 + i * 44;
  const trayPearlY = TRAY_Y;

  const resetLevel = () => beginLevel(levelIdx);

  return (
    <div
      className="min-h-screen w-full font-body flex flex-col"
      style={{
        background:
          "linear-gradient(180deg,#06121A 0%,#0B1F2E 40%,#0B2B3A 100%)",
      }}
    >
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setView("cafe")}
          className="text-white/70 text-sm font-bold px-3 py-1 rounded-full bg-white/8 hover:bg-white/15"
        >
          ← 浮回海面
        </button>
        <span className="text-xs text-white/40">
          古深海遗迹 · 第 {levelIdx + 1}/{LEVELS.length} 碑
        </span>
        <div className="w-8" />
      </div>

      {/* 标题 + 故事叙事 */}
      <div className="px-5 text-center mb-2">
        <div className="text-2xl mb-1">🪦✨</div>
        <h1 className="font-display text-xl text-amber-200/90">上古石碑</h1>
        <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
          {lv.story}
        </p>
      </div>

      {/* SVG 交互区 */}
      <div className="flex-1 flex items-center justify-center px-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VBW} ${VBH}`}
          width="100%"
          className="select-none touch-none max-w-md"
          style={{ maxHeight: "50vh" }}
          onPointerMove={(e) => {
            const d = dragRef.current;
            if (!d) return;
            const p = toSVG(e.clientX, e.clientY);
            setDragPos(p);
          }}
          onPointerUp={(e) => {
            const d = dragRef.current;
            if (!d) return;
            const p = toSVG(e.clientX, e.clientY);
            const hit = hitSlot(p.x, p.y);
            if (hit !== null) drop(hit);
            else {
              if (d.from === "tray") {
                setTray([...tray, d.pearl]);
              } else {
                const newSlots = [...slots];
                newSlots[d.from as number] = d.pearl;
                setSlots(newSlots);
              }
              dragRef.current = null;
              setDragPos(null);
              setTick((n) => n + 1);
            }
          }}
        >
          <defs>
            {/* 珍珠发光滤镜 */}
            <filter id="pearlGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* 石碑纹理 */}
            <filter id="stoneTex">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.04"
                numOctaves="3"
                result="noise"
              />
              <feDiffuseLighting
                in="noise"
                lightingColor="#3a5068"
                surfaceScale="2"
              >
                <feDistantLight azimuth="45" elevation="55" />
              </feDiffuseLighting>
            </filter>
          </defs>

          {/* 石碑主体 */}
          <rect
            x={TABLET_X - 8}
            y={TABLET_Y - 8}
            width={TABLET_W + 16}
            height={TABLET_H + 16}
            rx="8"
            fill="#1a2a3a"
            stroke="#3a5a7a"
            strokeWidth="2"
          />

          {/* 格子 */}
          {Array.from({ length: lv.denom }, (_, i) => {
            const b = slotBox(i);
            const filled = slots[i] !== null;
            return (
              <g key={i}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="4"
                  fill={filled ? "#1a3025" : "#0f1a22"}
                  stroke={filled ? "#4a8a5a" : "#2a3a4a"}
                  strokeWidth="1.5"
                />
                {/* 已有珍珠 */}
                {filled && (
                  <circle
                    cx={b.x + b.w / 2}
                    cy={b.y + b.h / 2}
                    r={PEARL_R - 2}
                    fill="#F5E6D3"
                    stroke="#C9A96E"
                    strokeWidth="1.5"
                    filter="url(#pearlGlow)"
                    style={{ cursor: phase === "playing" ? "grab" : "default" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      pickFromSlot(i);
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* 格子分隔线 */}
          {Array.from({ length: lv.denom - 1 }, (_, i) => {
            const x = TABLET_X + (i + 1) * slotW + i * SLOT_GAP;
            return (
              <line
                key={i}
                x1={x}
                y1={TABLET_Y}
                x2={x}
                y2={TABLET_Y + TABLET_H}
                stroke="#3a5a7a"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            );
          })}

          {/* 托盘里的珍珠 */}
          {tray.map((pIdx) => (
            <g
              key={`tray-${pIdx}`}
              style={{ cursor: phase === "playing" ? "grab" : "default" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (phase !== "playing") return;
                dragRef.current = { pearl: pIdx, from: "tray" };
                setTray(tray.filter((x) => x !== pIdx));
                setTick((n) => n + 1);
                const p = toSVG(e.clientX, e.clientY);
                setDragPos(p);
              }}
            >
              <circle
                cx={trayPearlX(pIdx)}
                cy={trayPearlY}
                r={PEARL_R}
                fill="#F5E6D3"
                stroke="#C9A96E"
                strokeWidth="2"
                filter="url(#pearlGlow)"
              />
              <text
                x={trayPearlX(pIdx)}
                y={trayPearlY + 5}
                textAnchor="middle"
                fontSize="14"
                fill="#8B7355"
                style={{ pointerEvents: "none" }}
              >
                {pIdx + 1}
              </text>
            </g>
          ))}

          {/* 正在拖拽的珍珠 */}
          {dragRef.current && dragPos && (
            <circle
              cx={dragPos.x}
              cy={dragPos.y}
              r={PEARL_R}
              fill="#F5E6D3"
              stroke="#C9A96E"
              strokeWidth="2"
              filter="url(#pearlGlow)"
              opacity="0.9"
            />
          )}

          {/* 提示文字 */}
          <text
            x={VBW / 2}
            y={TABLET_Y + TABLET_H + 36}
            textAnchor="middle"
            fontSize="12"
            fill="#ffffff50"
          >
            {phase === "playing"
              ? `把 ${lv.numer} 颗珍珠拖进石碑的格子里（已放 ${placedCount}/${lv.numer}）`
              : ""}
          </text>
        </svg>
      </div>

      {/* 过关揭示 */}
      {phase === "done" && (
        <div className="px-4 pb-2">
          <div className="bg-amber-900/40 border border-amber-600/30 rounded-2xl p-4 text-center max-w-md md:max-w-lg mx-auto">
            <div className="text-lg font-bold text-amber-200 mb-2">
              🔮 石碑显灵了
            </div>
            <p className="text-sm text-amber-100/80 leading-relaxed">
              {lv.recap}
            </p>
          </div>
        </div>
      )}

      {/* 底部操作 */}
      <div className="p-4 flex gap-3 max-w-md md:max-w-lg mx-auto w-full">
        {phase === "playing" ? (
          <button
            onClick={resetLevel}
            disabled={ttsPlaying}
            className="flex-1 py-3 rounded-full bg-white/8 text-white/50 text-sm font-bold hover:bg-white/15 disabled:opacity-30"
          >
            重摆这一碑
          </button>
        ) : levelIdx < LEVELS.length - 1 ? (
          <button
            onClick={() => beginLevel(levelIdx + 1)}
            disabled={ttsPlaying}
            className="flex-1 py-3 rounded-full bg-amber-600/80 text-white text-sm font-bold hover:bg-amber-500/80 disabled:opacity-40"
          >
            {ttsPlaying ? "听海小喵说完…" : "→ 下一块碑"}
          </button>
        ) : (
          <button
            onClick={() => setView("cafe")}
            disabled={ttsPlaying}
            className="flex-1 py-3 rounded-full bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 disabled:opacity-40"
          >
            {ttsPlaying ? "听海小喵说完…" : "全部破译，浮回海面 🎉"}
          </button>
        )}
      </div>
    </div>
  );
}
