import { useRef, useEffect, useState, useCallback } from "react";
import useStore from "../../store/useStore";
import { useAudio } from "../../hooks/useAudio";
import Mascot from "../shared/Mascot";

const W = 400;
const H = 600;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Pearl {
  x: number;
  y: number;
  value: number;
  size: number;
  caught: boolean;
}

export default function ShellCollector() {
  const addFragments = useStore((s) => s.addFragments);
  const showToast = useStore((s) => s.showToast);
  const audio = useAudio();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState<string | null>(null);

  const g = useRef({
    pearls: [] as Pearl[],
    score: 0,
    misses: 0,
    frame: 0,
    startTime: 0,
    lastSpawn: 0,
  });

  const startGame = useCallback(() => {
    const s = g.current;
    s.score = 0;
    s.misses = 0;
    s.pearls = [];
    s.startTime = Date.now();
    s.lastSpawn = 0;
    s.frame = 0;
    setPlaying(true);
    setScore(0);
    setMisses(0);
    setTimeLeft(30);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = g.current;

    const loop = () => {
      s.frame++;
      const elapsed = Date.now() - s.startTime;
      const remaining = Math.max(0, 30000 - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        const earned = Math.max(1, Math.floor(s.score / 2));
        addFragments(earned);
        if (earned > 0) showToast("fragment", earned);
        setResult(
          s.score > 0
            ? `收集了 ${s.score} 颗珍珠！获得 ${earned} 碎片`
            : "再试一次吧～"
        );
        setPlaying(false);
        return;
      }

      if (elapsed - s.lastSpawn > 1000 + Math.random() * 600) {
        s.lastSpawn = elapsed;
        s.pearls.push({
          x: randomInt(40, W - 40),
          y: -20,
          value: randomInt(-8, 8),
          size: randomInt(12, 22),
          caught: false,
        });
      }

      // Gradient sea background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#043352");
      bg.addColorStop(0.5, "#0B4D6E");
      bg.addColorStop(1, "#1B7FA8");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Floating light particles
      for (let i = 0; i < 15; i++) {
        const lx = (Math.sin(s.frame * 0.008 + i) * 0.5 + 0.5) * W;
        const ly = (s.frame * 0.4 + i * 47) % H;
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(lx, ly, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Falling pearls
      for (const p of s.pearls) {
        if (p.caught) continue;
        p.y += 1.2 + p.size * 0.04;

        if (p.y > H + 30) {
          if (p.value >= 0) s.misses++;
          setMisses(s.misses);
          p.caught = true;
          continue;
        }

        const isPositive = p.value >= 0;

        // Glow
        const glowColor = isPositive
          ? "rgba(52,211,153,0.4)"
          : "rgba(248,113,113,0.3)";
        ctx.shadowColor = isPositive ? "#34D399" : "#F87171";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 4, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pearl body
        const pearlGrad = ctx.createRadialGradient(
          p.x - 2,
          p.y - 2,
          1,
          p.x,
          p.y,
          p.size
        );
        if (isPositive) {
          pearlGrad.addColorStop(0, "#fff");
          pearlGrad.addColorStop(0.3, "#A7F3D0");
          pearlGrad.addColorStop(1, "#059669");
        } else {
          pearlGrad.addColorStop(0, "#fff");
          pearlGrad.addColorStop(0.3, "#FECACA");
          pearlGrad.addColorStop(1, "#DC2626");
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = pearlGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Number label
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, p.size * 0.8)}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(p.value), p.x, p.y);
      }

      // Remove caught
      g.current.pearls = s.pearls.filter((p) => !p.caught);

      // Bottom instruction bar
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, H - 40, W, 40);
      ctx.fillStyle = "#fff";
      ctx.font = '14px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("只点正数珍珠！负数不能碰", W / 2, H - 15);

      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [playing, addFragments]);

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

      for (const p of g.current.pearls) {
        if (p.caught) continue;
        if (Math.hypot(p.x - x, p.y - y) < p.size + 8) {
          p.caught = true;
          if (p.value >= 0) {
            g.current.score++;
            setScore(g.current.score);
            audio.collect();
          } else {
            g.current.misses++;
            setMisses(g.current.misses);
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
        <span className="font-body font-bold text-white">珍珠收集</span>
        <span className="font-body text-sm text-white/80">⏱ {timeLeft}s</span>
        <div className="flex gap-2">
          <span className="font-body text-sm text-emerald-300">✅{score}</span>
          <span className="font-body text-sm text-red-300">❌{misses}</span>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {result
          ? `游戏结束：${result}`
          : `收集了 ${score} 颗珍珠，漏掉了 ${misses} 颗`}
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
          aria-label="贝壳收集游戏，点击漂浮的珍珠来收集它们"
        />
        {!playing && (
          <div className="absolute inset-0 bg-ocean-deep/60 flex flex-col items-center justify-center backdrop-blur-sm">
            {result ? (
              <>
                <div className="text-4xl mb-3">✨</div>
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
                <p className="font-body text-white/80 mt-3 mb-1 text-sm">
                  珍珠从海底冒出来啦！
                </p>
                <p className="font-body text-white/60 mb-4 text-xs">
                  点击正数珍珠，躲开负数
                </p>
                <button
                  onClick={startGame}
                  className="bg-teal-500 text-white px-10 py-3 rounded-full font-body font-bold text-lg hover:bg-teal-600 transition shadow-lg"
                >
                  开始收集
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="font-body text-xs text-slate-500 mt-2">
        点击珍珠收集 · 绿色=正数 · 红色=负数
      </p>
    </div>
  );
}
