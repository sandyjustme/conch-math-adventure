import { useEffect, useState } from "react";

interface Props {
  type: "pearl" | "fragment" | "correct" | "levelup" | "combo";
  value?: number;
  onDone: () => void;
}

const CONFIG = {
  pearl: {
    emoji: "💎",
    color: "text-amber-300",
    bg: "bg-amber-100/90",
    label: "珍珠",
  },
  fragment: {
    emoji: "🌟",
    color: "text-yellow-400",
    bg: "bg-yellow-100/90",
    label: "碎片",
  },
  correct: {
    emoji: "✅",
    color: "text-emerald-500",
    bg: "bg-emerald-100/90",
    label: "",
  },
  levelup: {
    emoji: "🎉",
    color: "text-purple-500",
    bg: "bg-purple-100/90",
    label: "升级！",
  },
  combo: {
    emoji: "🔥",
    color: "text-orange-500",
    bg: "bg-orange-100/90",
    label: "连击",
  },
};

export default function FeedbackOverlay({ type, value, onDone }: Props) {
  const [visible, setVisible] = useState(true);
  const cfg = CONFIG[type];

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1200);
    const t2 = setTimeout(onDone, 1500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`${cfg.bg} backdrop-blur rounded-full px-5 py-3 shadow-xl flex items-center gap-3 animate-bounce`}
      >
        <span className="text-2xl">{cfg.emoji}</span>
        <span className={`font-body font-bold text-lg ${cfg.color}`}>
          {cfg.label}
          {value != null && value > 0 && ` +${value}`}
        </span>
      </div>
    </div>
  );
}

interface Toast {
  id: number;
  type: Props["type"];
  value?: number;
}

let toastId = 0;

export function useFeedback() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (type: Props["type"], value?: number) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, value }]);
  };

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const FeedbackElements = (
    <>
      {toasts.map((t) => (
        <FeedbackOverlay
          key={t.id}
          type={t.type}
          value={t.value}
          onDone={() => remove(t.id)}
        />
      ))}
    </>
  );

  return { show, FeedbackElements };
}
