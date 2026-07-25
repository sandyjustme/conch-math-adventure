import { useEffect, useState } from "react";
import { sfxLevelUp, sfxCelebration } from "../../services/audio";

export type CelebrationType =
  "practice" | "dive" | "soup_solve" | "milestone" | "login7";

interface Props {
  type: CelebrationType;
  title: string;
  subtitle?: string;
  reward?: { type: "pearl" | "fragment"; amount: number };
  extra?: string;
  onDone: () => void;
}

const DURATION: Record<CelebrationType, number> = {
  practice: 2000,
  dive: 2000,
  soup_solve: 3000,
  milestone: 3000,
  login7: 3000,
};

const PARTICLE_COLORS: Record<CelebrationType, string[]> = {
  practice: ["#fbbf24", "#f59e0b", "#fcd34d", "#fef3c7", "#fde68a"],
  dive: ["#06b6d4", "#0d9488", "#14b8a6", "#99f6e4", "#5eead4"],
  soup_solve: ["#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff", "#8b5cf6"],
  milestone: ["#fbbf24", "#f59e0b", "#eab308", "#fcd34d", "#ca8a04"],
  login7: ["#ec4899", "#f472b6", "#fda4af", "#fbcfe8", "#f9a8d4"],
};

const EMOJI: Record<CelebrationType, string> = {
  practice: "🏆",
  dive: "🐚",
  soup_solve: "🔮",
  milestone: "⭐",
  login7: "🎉",
};

/** 随机生成 N 个粒子，散布在屏幕各处 */
function spawnParticles(
  count: number,
  colors: string[]
): {
  x: number;
  y: number;
  color: string;
  delay: number;
  size: number;
  tx: number;
  ty: number;
}[] {
  return Array.from({ length: count }, () => ({
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 1.5,
    size: 4 + Math.random() * 8,
    tx: (Math.random() - 0.5) * 200,
    ty: -(Math.random() * 150 + 50),
  }));
}

export default function CelebrationOverlay({
  type,
  title,
  subtitle,
  reward,
  extra,
  onDone,
}: Props) {
  const [visible, setVisible] = useState(true);
  const particles = spawnParticles(24, PARTICLE_COLORS[type]);

  useEffect(() => {
    if (type === "milestone" || type === "soup_solve" || type === "login7") {
      sfxCelebration();
    } else {
      sfxLevelUp();
    }
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, DURATION[type]);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onDone}
    >
      {/* 粒子 */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-celebration-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            ["--tx" as any]: `${p.tx}px`,
            ["--ty" as any]: `${p.ty}px`,
            opacity: 0,
          }}
        />
      ))}

      {/* 中心卡片 */}
      <div className="relative z-10 bg-white/95 backdrop-blur rounded-3xl px-8 py-8 shadow-2xl text-center max-w-xs w-full mx-4 animate-pop-in">
        <div className="text-5xl mb-3">{EMOJI[type]}</div>
        <h2 className="font-display text-2xl text-ocean-deep mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mb-3">{subtitle}</p>}
        {reward && (
          <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-1.5 mb-3">
            <span className="text-lg">
              {reward.type === "pearl" ? "💎" : "🪸"}
            </span>
            <span className="font-bold text-amber-700 text-xl">
              +{reward.amount}
            </span>
          </div>
        )}
        {extra && <p className="text-sm font-bold text-teal-600">{extra}</p>}
        <p className="text-xs text-slate-400 mt-3">点任意位置继续</p>
      </div>
    </div>
  );
}
