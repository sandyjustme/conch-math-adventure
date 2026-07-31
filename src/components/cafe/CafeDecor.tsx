/* 咖啡馆大厅纯装饰层：水面波光金点 + 底部海浪线（无交互、无状态） */

export function Sparkles() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${3 + Math.random() * 8}px`,
            height: `${3 + Math.random() * 8}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            background: Math.random() > 0.5 ? "#FFD89C" : "#FFEED0",
            opacity: 0.25 + Math.random() * 0.4,
            animation: `shimmer ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Waves() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 60 }}
      >
        <path
          d="M0 30 Q 30 15 60 30 T 120 30 T 180 30 T 240 30 T 300 30 T 360 30 T 400 30 V60 H0 Z"
          fill="#B8E6E0"
          opacity="0.25"
        />
        <path
          d="M0 38 Q 35 22 70 38 T 140 38 T 210 38 T 280 38 T 350 38 T 400 38 V60 H0 Z"
          fill="#8ED7CF"
          opacity="0.18"
        />
      </svg>
    </div>
  );
}
