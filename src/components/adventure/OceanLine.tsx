import { useRef, useEffect } from "react";

interface Props {
  point: number;
  setPoint: (v: number) => void;
}

export default function OceanLine({ point, setPoint }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const min = -8;
  const max = 8;
  const width = 640;
  const height = 200;
  const padding = 34;
  const scale = (width - padding * 2) / (max - min);
  const valueToX = (v: number) => padding + (v - min) * scale;
  const seaY = height / 2;

  const dragging = useRef(false);

  const xToValue = (x: number) => {
    const raw = min + (x - padding) / scale;
    return Math.max(min, Math.min(max, Math.round(raw)));
  };

  const onDown = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    dragging.current = true;
  };

  useEffect(() => {
    const onEnd = () => {
      dragging.current = false;
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || !svgRef.current) return;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      pt.x = clientX;
      pt.y = 0;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      setPoint(xToValue(svgPt.x));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const ticks = [];
  for (let i = min; i <= max; i++) ticks.push(i);

  const isUnder = point < 0;

  return (
    <div
      className="rounded-3xl overflow-hidden border-4 border-white shadow-lg relative"
      style={{ height }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="select-none touch-none"
        role="img"
        aria-label={`数轴大海，小猫当前在 ${point >= 0 ? "水上" + point : "水下" + Math.abs(point)} 米`}
      >
        <title>海底数轴</title>
        <desc>
          一条表示有理数的数轴，以海面为零点，上方为正数，下方为负数。可拖动小猫探索数字位置。
        </desc>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BFEBFF" />
            <stop offset="100%" stopColor="#E8FBFF" />
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B7FA8" />
            <stop offset="100%" stopColor="#043352" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={seaY} fill="url(#sky)" />
        <rect
          x="0"
          y={seaY}
          width={width}
          height={height - seaY}
          fill="url(#sea)"
        />

        <line
          x1="0"
          y1={seaY}
          x2={width}
          y2={seaY}
          stroke="#0B4D6E"
          strokeWidth="2"
        />
        <text
          x={width - padding + 6}
          y={seaY + 4}
          fontSize="12"
          fill="#0B4D6E"
          fontFamily="Noto Sans SC, sans-serif"
        >
          海面
        </text>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={valueToX(t)}
              y1={seaY - 6}
              x2={valueToX(t)}
              y2={seaY + 6}
              stroke="#ffffffaa"
              strokeWidth="1.5"
            />
            <text
              x={valueToX(t)}
              y={t < 0 ? seaY + 20 : seaY - 12}
              fontSize="11"
              textAnchor="middle"
              fill={t < 0 ? "#DCF4FF" : "#0B4D6E"}
              fontFamily="Noto Sans SC, sans-serif"
            >
              {t}
            </text>
          </g>
        ))}

        <line
          x1={valueToX(0)}
          y1={seaY}
          x2={valueToX(point)}
          y2={seaY}
          stroke="#F5A623"
          strokeWidth="3"
          strokeDasharray="5 4"
        />

        <g
          transform={`translate(${valueToX(point)}, ${seaY})`}
          onMouseDown={onDown}
          onTouchStart={onDown}
          style={{ cursor: "grab" }}
        >
          <circle r="16" fill="white" opacity="0.9" />
          <text y="6" fontSize="18" textAnchor="middle">
            🐱
          </text>
        </g>
      </svg>

      <div
        className="absolute top-2 left-3 bg-white/80 rounded-full px-3 py-1 text-xs font-bold font-body"
        style={{ color: isUnder ? "#043352" : "#0B4D6E" }}
      >
        {isUnder
          ? `潜到水下 ${Math.abs(point)} 米`
          : point > 0
            ? `浮出水面 ${point} 米`
            : `正好在海面`}
      </div>
    </div>
  );
}
