import { useRef, useEffect, useState, useCallback } from "react";
import useStore from "../../store/useStore";
import { generateExpressions } from "../../data/expressionGenerator";
import { useAudio } from "../../hooks/useAudio";
import Mascot from "../shared/Mascot";

/**
 * 深潜补氧 —— 玩法重设计（第二版）。
 *
 * 旧版「点正数得分」是判断题连发：无张力、无目标、算式的大小毫无意义，
 * 真实反馈是「玩法太无聊」。新玩法把数值本身变成生存资源：
 *   · 氧气一直在掉（每秒 -1）
 *   · 点破泡泡，算式的值就是补的氧：9−3 补 6 秒，2−9 是毒泡，吸走 7 秒
 *   · 撑满 60 秒抵达沉船 —— 挑大的点、避开负的，计算第一次有策略意义
 *
 * 冻结修复（真实反馈「点了一个以后整个画面停住」）：
 *   · rAF id 逐帧记录进 ref，cleanup 真正取消得掉（旧版只记了首帧 id）
 *   · audio 全部 try/catch —— 真机 AudioContext 抛错不再炸掉逻辑
 *   · loop 整体容错：单帧出错跳过该帧继续，绝不死屏
 *
 * 视觉按「神秘的海底」重做：蓝紫深渊渐变、生物荧光水母、金色光尘、
 * 珊瑚剪影 —— 不再是素蓝灰。颜色仍绝不泄露答案。
 */

const W = 400;
const H = 600;
const GOAL_SEC = 60;
const O2_MAX = 30;
const O2_START = 15;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  value: number;
  text: string;
  wobble: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Floater {
  x: number;
  y: number;
  vy: number;
  life: number;
  text: string;
  color: string;
}

interface Jelly {
  x: number;
  y: number;
  size: number;
  hue: string;
  phase: number;
}

export default function BubbleJump() {
  const currentNodeId = useStore((s) => s.currentNodeId);
  const masteredNodes = useStore((s) => s.masteredNodes);
  const spendPlayTokens = useStore((s) => s.spendPlayTokens);
  const playTokens = useStore((s) => s.playTokens);
  const audio = useAudio();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [o2, setO2] = useState(O2_START);
  const [depth, setDepth] = useState(0);
  const [result, setResult] = useState<{ win: boolean; text: string } | null>(
    null
  );
  const rafId = useRef(0);

  const g = useRef({
    bubbles: [] as Bubble[],
    particles: [] as Particle[],
    floaters: [] as Floater[],
    jellies: [] as Jelly[],
    pool: [] as { text: string; value: number }[],
    poolIdx: 0,
    oxygen: O2_START,
    startTime: 0,
    lastTick: 0,
    frame: 0,
    over: false,
  });

  const safeAudio = (fn: () => void) => {
    try {
      fn();
    } catch {
      /* 真机 AudioContext 可能抛错 —— 声音失败绝不能炸掉游戏 */
    }
  };

  const nextExpr = () => {
    const s = g.current;
    if (s.poolIdx >= s.pool.length) s.poolIdx = 0;
    return s.pool[s.poolIdx++] ?? { text: "1+1", value: 2 };
  };

  const spawnBubble = (fromBottom: boolean): Bubble => {
    const expr = nextExpr();
    const r = Math.min(38, 24 + expr.text.length * 1.6);
    let x = randomInt(50, W - 50);
    let y = fromBottom ? H + randomInt(20, 300) : randomInt(110, H - 130);
    for (let attempt = 0; attempt < 12; attempt++) {
      const cx = randomInt(50, W - 50);
      const cy = fromBottom ? H + randomInt(20, 320) : randomInt(110, H - 130);
      const clear = g.current.bubbles.every(
        (o) => Math.hypot(o.x - cx, o.y - cy) > o.r + r + 14
      );
      x = cx;
      y = cy;
      if (clear) break;
    }
    return {
      x,
      y,
      r,
      value: expr.value,
      text: expr.text,
      wobble: Math.random() * Math.PI * 2,
    };
  };

  const startGame = useCallback(() => {
    if (!spendPlayTokens(1)) {
      return; // 次数不足 —— 按钮层已禁用并写明原因，这里只兜底
    }
    const s = g.current;
    s.pool = generateExpressions(currentNodeId, masteredNodes, 24);
    s.poolIdx = 0;
    s.particles = [];
    s.floaters = [];
    s.oxygen = O2_START;
    s.startTime = Date.now();
    s.lastTick = Date.now();
    s.frame = 0;
    s.over = false;
    s.jellies = Array.from({ length: 3 }, (_, i) => ({
      x: 60 + i * 140 + randomInt(-20, 20),
      y: 120 + i * 150,
      size: 22 + randomInt(0, 14),
      hue: i % 2 === 0 ? "79,209,197" : "183,148,244", // 荧光青 / 荧光紫
      phase: Math.random() * Math.PI * 2,
    }));
    // 初始格子布点：整批生成互相看不见对方会重叠，格子法结构上不可能叠
    const cells: { x: number; y: number }[] = [];
    for (const cx of [105, 295]) {
      for (const cy of [170, 285, 400, 500]) cells.push({ x: cx, y: cy });
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    s.bubbles = [];
    for (const cell of cells) {
      const b = spawnBubble(true);
      b.x = cell.x + randomInt(-36, 36);
      b.y = cell.y + randomInt(-22, 22);
      s.bubbles.push(b);
    }
    setPlaying(true);
    setO2(O2_START);
    setDepth(0);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spendPlayTokens, currentNodeId, masteredNodes]);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = g.current;

    const finish = (win: boolean, survived: number) => {
      s.over = true;
      setResult(
        win
          ? { win: true, text: `抵达沉船！全程 ${GOAL_SEC} 秒` }
          : { win: false, text: `氧气用完了，撑了 ${survived} 秒` }
      );
      setPlaying(false);
    };

    const frame = () => {
      // 单帧容错：一帧出错跳过继续，绝不让画面死住
      try {
        step();
      } catch (err) {
        console.warn("game frame error (skipped):", err);
      }
      if (!s.over) rafId.current = requestAnimationFrame(frame);
    };

    const step = () => {
      s.frame++;
      const now = Date.now();
      const elapsed = Math.floor((now - s.startTime) / 1000);
      setDepth(Math.min(GOAL_SEC, elapsed));

      // 每秒呼吸消耗 1 格氧
      if (now - s.lastTick >= 1000) {
        s.lastTick += 1000;
        s.oxygen -= 1;
        setO2(Math.max(0, s.oxygen));
      }

      if (s.oxygen <= 0) return finish(false, elapsed);
      if (elapsed >= GOAL_SEC) return finish(true, elapsed);

      /* ── 深渊背景：蓝紫 → 深蓝 → 幽青 ── */
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0B1026");
      bg.addColorStop(0.5, "#0D2137");
      bg.addColorStop(1, "#0F3A42");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 丁达尔光柱
      for (let i = 0; i < 3; i++) {
        const rx = ((s.frame * 0.18 + i * 160) % (W + 340)) - 170;
        const ray = ctx.createLinearGradient(rx, 0, rx + 120, H);
        ray.addColorStop(0, "rgba(140,190,235,0.07)");
        ray.addColorStop(1, "rgba(140,190,235,0)");
        ctx.fillStyle = ray;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 50, 0);
        ctx.lineTo(rx + 200, H);
        ctx.lineTo(rx + 136, H);
        ctx.closePath();
        ctx.fill();
      }

      // 金色光尘（上升）
      for (let i = 0; i < 16; i++) {
        const px = (Math.sin(s.frame * 0.005 + i * 1.7) * 0.5 + 0.5) * W;
        const py =
          H - ((s.frame * (0.25 + (i % 3) * 0.15) + i * 61) % (H + 60));
        ctx.fillStyle = `rgba(246,193,119,${0.14 + (i % 3) * 0.07})`;
        ctx.beginPath();
        ctx.arc(px, py, 1 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 荧光水母（远景，缓慢漂浮）
      for (const j of s.jellies) {
        const jy = j.y + Math.sin(s.frame * 0.012 + j.phase) * 14;
        const jx = j.x + Math.sin(s.frame * 0.007 + j.phase * 2) * 8;
        const pulse = 0.75 + Math.sin(s.frame * 0.05 + j.phase) * 0.25;
        const glow = ctx.createRadialGradient(jx, jy, 2, jx, jy, j.size * 2.2);
        glow.addColorStop(0, `rgba(${j.hue},${0.2 * pulse})`);
        glow.addColorStop(1, `rgba(${j.hue},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(jx, jy, j.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${j.hue},${0.35 * pulse})`;
        ctx.beginPath();
        ctx.arc(jx, jy, j.size, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(${j.hue},${0.3 * pulse})`;
        ctx.lineWidth = 1.4;
        for (let t = -2; t <= 2; t++) {
          const sway = Math.sin(s.frame * 0.04 + j.phase + t) * 6;
          ctx.beginPath();
          ctx.moveTo(jx + t * (j.size / 3), jy);
          ctx.quadraticCurveTo(
            jx + t * (j.size / 3) + sway,
            jy + j.size * 0.9,
            jx + t * (j.size / 3) + sway * 1.5,
            jy + j.size * 1.6
          );
          ctx.stroke();
        }
      }

      // 底部珊瑚礁剪影（品红/青描边）
      ctx.fillStyle = "rgba(6,10,20,0.9)";
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        ctx.lineTo(
          x,
          H - 30 - Math.sin(x * 0.04) * 10 - Math.sin(x * 0.013) * 7
        );
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const gx = 30 + i * 68;
        const hgt = 26 + (i % 3) * 12;
        const sway = Math.sin(s.frame * 0.02 + i * 1.3) * 5;
        ctx.strokeStyle =
          i % 2 === 0 ? "rgba(237,100,166,0.5)" : "rgba(79,209,197,0.5)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gx, H - 20);
        ctx.quadraticCurveTo(
          gx + sway,
          H - 20 - hgt * 0.6,
          gx + sway * 1.7,
          H - 20 - hgt
        );
        ctx.stroke();
      }

      /* ── 氧气泡泡（玻璃质感，颜色不泄露答案）── */
      for (const b of s.bubbles) {
        b.y -= 0.5 + Math.sin(s.frame * 0.02 + b.wobble) * 0.22;
        b.x += Math.sin(s.frame * 0.014 + b.wobble) * 0.3;
        if (b.y < -60) Object.assign(b, spawnBubble(true));

        ctx.shadowColor = "rgba(160,215,245,0.7)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(160,215,245,0.09)";
        ctx.fill();
        ctx.shadowBlur = 0;

        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.35,
          b.y - b.r * 0.4,
          b.r * 0.1,
          b.x,
          b.y,
          b.r
        );
        grad.addColorStop(0, "rgba(240,250,255,0.5)");
        grad.addColorStop(0.55, "rgba(160,215,245,0.15)");
        grad.addColorStop(1, "rgba(130,190,230,0.05)");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "rgba(215,240,252,0.55)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.68, Math.PI * 1.12, Math.PI * 1.5);
        ctx.stroke();

        ctx.fillStyle = "#F0F7FF";
        ctx.shadowColor = "rgba(0,0,0,0.65)";
        ctx.shadowBlur = 4;
        ctx.font = 'bold 17px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.text, b.x, b.y);
        ctx.shadowBlur = 0;
      }

      /* ── 粒子与飘字 ── */
      s.particles = s.particles.filter((p) => p.life > 0);
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.03;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      s.floaters = s.floaters.filter((f) => f.life > 0);
      for (const f of s.floaters) {
        f.y += f.vy;
        f.life -= 0.018;
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle = f.color;
        ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;

      /* ── 氧气条（canvas 顶部发光胶囊）── */
      const barW = W - 48;
      const ratio = Math.max(0, Math.min(1, s.oxygen / O2_MAX));
      const low = s.oxygen <= 6;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(24, 18, barW, 14, 7);
      ctx.fill();
      const barColor = low
        ? `rgba(248,113,113,${0.75 + Math.sin(s.frame * 0.25) * 0.25})`
        : "rgba(79,209,197,0.9)";
      ctx.shadowColor = low ? "#F87171" : "#4FD1C5";
      ctx.shadowBlur = 8;
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(24, 18, Math.max(8, barW * ratio), 14, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(230,245,250,0.9)";
      ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(`氧气 ${Math.max(0, s.oxygen)}s`, 26, 46);
      ctx.textAlign = "right";
      ctx.fillText(`沉船还有 ${Math.max(0, GOAL_SEC - elapsed)}s`, W - 26, 46);
    };

    rafId.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId.current);
  }, [playing]);

  const onTouch = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!playing) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;

      const s = g.current;
      for (const b of s.bubbles) {
        if (Math.hypot(b.x - x, b.y - y) < b.r + 5) {
          const gain = b.value;
          const good = gain > 0;
          const color = good ? "#F6C177" : "#B794F4"; // 补氧金 / 毒泡荧光紫
          for (let i = 0; i < 14; i++) {
            const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
            const v = 1.6 + Math.random() * 2.2;
            s.particles.push({
              x: b.x,
              y: b.y,
              vx: Math.cos(a) * v,
              vy: Math.sin(a) * v,
              life: 1,
              color,
              size: good ? 3.4 : 2.8,
            });
          }
          s.floaters.push({
            x: b.x,
            y: b.y - 10,
            vy: -0.8,
            life: 1,
            text: good ? `+${gain}s` : `${gain}s`,
            color: good ? "#F6C177" : "#B794F4",
          });
          s.oxygen = Math.max(0, Math.min(O2_MAX, s.oxygen + gain));
          setO2(s.oxygen);
          safeAudio(() => (good ? audio.correct() : audio.error()));
          Object.assign(b, spawnBubble(true));
          break;
        }
      }
    },
    [playing, audio]
  );

  return (
    <div className="flex flex-col items-center p-3">
      <div className="flex items-center justify-between w-full max-w-sm mb-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
        <Mascot size={26} />
        <span className="font-body font-bold text-slate-100">深潜补氧</span>
        <span className="font-body text-sm text-teal-300">💨 {o2}s</span>
        <span className="font-body text-sm text-amber-300 font-bold">
          🚢 {Math.max(0, GOAL_SEC - depth)}s
        </span>
      </div>

      <div className="sr-only" aria-live="polite">
        {result
          ? `游戏结束：${result.text}`
          : `氧气剩余 ${o2} 秒，距离沉船 ${GOAL_SEC - depth} 秒`}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
        style={{ width: W, height: H, maxWidth: "100%" }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full h-full"
          onMouseDown={onTouch}
          onTouchStart={onTouch}
          tabIndex={0}
          aria-label="深潜补氧：点破泡泡补氧气，算式的值就是补几秒，负数是毒泡会吸走氧气"
        />
        {!playing && (
          <div className="absolute inset-0 bg-[#0B1026]/85 flex flex-col items-center justify-center backdrop-blur-sm px-6">
            {result ? (
              <>
                <div className="text-4xl mb-3">{result.win ? "🚢" : "💨"}</div>
                <div className="font-body text-slate-100 font-bold text-xl mb-4 text-center">
                  {result.text}
                </div>
                <button
                  onClick={startGame}
                  disabled={playTokens < 1}
                  className="bg-amber-400 text-slate-900 px-8 py-3 rounded-full font-body font-bold text-lg hover:bg-amber-300 transition shadow-lg active:scale-95 disabled:opacity-40"
                >
                  {playTokens >= 1
                    ? `再潜一次（剩 ${playTokens} 次）`
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
                <p className="font-body text-slate-100 mt-4 mb-2 text-base font-bold text-center">
                  氧气一直在掉，撑满 {GOAL_SEC} 秒就能到沉船
                </p>
                <p className="font-body text-slate-400 mb-1 text-sm text-center">
                  点破泡泡补氧——
                  <span className="text-amber-300 font-bold">
                    算式的值就是补几秒
                  </span>
                </p>
                <p className="font-body text-slate-400 mb-5 text-sm text-center">
                  算出来是负数的是毒泡，会把氧气吸走
                </p>
                <button
                  onClick={startGame}
                  disabled={playTokens < 1}
                  className="bg-amber-400 text-slate-900 px-10 py-3 rounded-full font-body font-bold text-lg hover:bg-amber-300 transition shadow-lg active:scale-95 disabled:opacity-40"
                >
                  {playTokens >= 1
                    ? `下潜（剩 ${playTokens} 次）`
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
        挑大的补得多 —— 9−3 补 6 秒，2−9 会吸走 7 秒
      </p>
    </div>
  );
}
