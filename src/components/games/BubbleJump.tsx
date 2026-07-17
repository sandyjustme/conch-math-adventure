import { useRef, useEffect, useState, useCallback } from "react";
import useStore from "../../store/useStore";
import { getGlobalMultiplier } from "../../engine/rewardEngine";
import { useAudio } from "../../hooks/useAudio";
import Mascot from "../shared/Mascot";

const W = 400;
const H = 600;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  value: number;
  color: string;
  popped: boolean;
}

export default function BubbleJump() {
  const addFragments = useStore((s) => s.addFragments);
  const showToast = useStore((s) => s.showToast);
  const todayAdventureCount = useStore((s) => s.todayAdventureCount);
  const audio = useAudio();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState<string | null>(null);

  const g = useRef({
    playerX: W / 2,
    bubbles: [] as Bubble[],
    score: 0,
    frame: 0,
    startTime: 0,
  });

  const spawnBubbles = () => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];
    const list: Bubble[] = [];
    const origin = randomInt(-8, 8);
    for (let i = 0; i < 12; i++) {
      list.push({
        x: randomInt(50, W - 50),
        y: H + randomInt(0, 300),
        r: randomInt(24, 36),
        value: randomInt(-10, 10),
        color: colors[randomInt(0, colors.length - 1)],
        popped: false,
      });
    }
    return list;
  };

  const startGame = useCallback(() => {
    const state = g.current;
    state.playerX = W / 2;
    state.score = 0;
    state.bubbles = spawnBubbles();
    state.startTime = Date.now();
    state.frame = 0;
    setPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = g.current;

    const loop = () => {
      state.frame++;
      const elapsed = Date.now() - state.startTime;
      const remaining = Math.max(0, 30000 - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        const mult = getGlobalMultiplier(todayAdventureCount);
        const earned = Math.floor(
          Math.max(1, Math.floor(state.score / 2)) * mult
        );
        addFragments(earned);
        if (earned > 0) showToast("fragment", earned);
        setResult(
          state.score > 0 ? `太棒了！获得 ${earned} 个贝壳碎片` : "再试一次吧！"
        );
        setPlaying(false);
        return;
      }

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#0B3D5C");
      skyGrad.addColorStop(0.5, "#0F5E7A");
      skyGrad.addColorStop(1, "#1B7FA8");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Light rays
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 3; i++) {
        const rx = ((state.frame * 0.2 + i * 200) % (W + 400)) - 200;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 40, 0);
        ctx.lineTo(rx + 180, H);
        ctx.lineTo(rx + 140, H);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Particles
      for (let i = 0; i < 8; i++) {
        const px = (Math.sin(state.frame * 0.01 + i * 0.7) * 0.5 + 0.5) * W;
        const py = (state.frame * 0.3 + i * 73) % H;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bubbles
      for (const b of state.bubbles) {
        if (b.popped) continue;
        b.y -= 0.6 + Math.sin(state.frame * 0.02 + b.x * 0.1) * 0.3;

        if (b.y < -60) {
          b.y = H + 60;
          b.x = randomInt(50, W - 50);
          b.value = randomInt(-10, 10);
        }

        // Glow
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color + "44";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bubble body
        const grad = ctx.createRadialGradient(
          b.x - 4,
          b.y - 4,
          b.r * 0.1,
          b.x,
          b.y,
          b.r
        );
        grad.addColorStop(0, "rgba(255,255,255,0.6)");
        grad.addColorStop(0.4, b.color + "99");
        grad.addColorStop(1, b.color + "33");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Number
        ctx.fillStyle = "#fff";
        ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(b.value), b.x, b.y);
      }

      // Player (cat on a platform)
      const px = state.playerX;
      const py = H - 50;
      ctx.fillStyle = "#F5A623";
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🐱", px, py + 2);

      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [playing, addFragments]);

  useEffect(() => {
    if (!playing) return;
    const state = g.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")
        state.playerX = Math.max(30, state.playerX - 15);
      if (e.key === "ArrowRight")
        state.playerX = Math.min(W - 30, state.playerX + 15);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

      const state = g.current;
      for (const b of state.bubbles) {
        if (b.popped) continue;
        if (Math.hypot(b.x - x, b.y - y) < b.r + 4) {
          b.popped = true;
          if (b.value > 0) {
            state.score++;
            setScore(state.score);
            audio.correct();
          } else {
            audio.error();
          }
          break;
        }
      }
    },
    [playing, audio]
  );

  return (
    <div className="flex flex-col items-center p-3">
      <div className="flex items-center justify-between w-full max-w-sm mb-2 px-2">
        <Mascot size={28} />
        <span className="font-body font-bold text-white">海底跳跃</span>
        <span className="font-body text-sm text-white/80">⏱ {timeLeft}s</span>
        <span className="font-body text-sm text-amber-300 font-bold">
          🌟 {score}
        </span>
      </div>

      <div className="sr-only" aria-live="polite">
        {result ? `游戏结束：${result}` : `当前得分：${score}`}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
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
          aria-label="海底跳跃游戏，← → 方向键移动海小喵躲避障碍"
        />
        {!playing && (
          <div className="absolute inset-0 bg-ocean-deep/60 flex flex-col items-center justify-center backdrop-blur-sm">
            {result ? (
              <>
                <div className="text-4xl mb-3">🎉</div>
                <div className="font-body text-white font-bold text-xl mb-2">
                  {result}
                </div>
                <button
                  onClick={startGame}
                  className="bg-amber-400 text-white px-8 py-3 rounded-full font-body font-bold text-lg hover:bg-amber-500 transition shadow-lg"
                >
                  再来一局
                </button>
              </>
            ) : (
              <>
                <Mascot size={60} />
                <p className="font-body text-white/80 mt-3 mb-4 text-sm">
                  点击更大的数字气泡得分！
                </p>
                <button
                  onClick={startGame}
                  className="bg-teal-500 text-white px-10 py-3 rounded-full font-body font-bold text-lg hover:bg-teal-600 transition shadow-lg"
                >
                  开始游戏
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="font-body text-xs text-slate-500 mt-2">
        ← → 键盘移动 · 点击气泡 · 点更大的数字
      </p>
    </div>
  );
}
