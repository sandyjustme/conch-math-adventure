import type { RadarScores } from "../../engine/analytics";

type Dim = { key: keyof RadarScores; label: string };

const DIMS: Dim[] = [
  { key: "mastery", label: "掌握度" },
  { key: "interest", label: "兴趣度" },
  { key: "persistence", label: "坚持度" },
  { key: "autonomy", label: "自主度" },
  { key: "transfer", label: "迁移度" },
  { key: "emotion", label: "情绪度" },
];

export default function RadarChart({ scores }: { scores: RadarScores }) {
  const CX = 150,
    CY = 150,
    R = 90,
    LABEL_R = R + 34;
  const VB = 300;

  const angle = (i: number) => (Math.PI / 3) * i - Math.PI / 2;

  // 背景五层六边形
  const grids = [];
  for (let lvl = 1; lvl <= 5; lvl++) {
    const pts = DIMS.map((_, i) => {
      const a = angle(i);
      const rr = R * (lvl / 5);
      return `${CX + Math.cos(a) * rr},${CY + Math.sin(a) * rr}`;
    }).join(" ");
    grids.push(
      <polygon
        key={`g${lvl}`}
        points={pts}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="0.5"
      />
    );
  }

  // 轴线 + 标签
  const axes = DIMS.map((_, i) => {
    const a = angle(i);
    const ex = CX + Math.cos(a) * R;
    const ey = CY + Math.sin(a) * R;
    const lx = CX + Math.cos(a) * LABEL_R;
    const ly = CY + Math.sin(a) * LABEL_R;
    return (
      <g key={`ax${i}`}>
        <line
          x1={CX}
          y1={CY}
          x2={ex}
          y2={ey}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
        <text
          x={lx}
          y={ly + 5}
          textAnchor="middle"
          fontSize="13"
          fill="#334155"
          fontWeight="bold"
        >
          {DIMS[i].label}
        </text>
      </g>
    );
  });

  // 数据六边形
  const dataPts = DIMS.map((_, i) => {
    const a = angle(i);
    const pct = scores[DIMS[i].key] / 100;
    const rr = R * pct;
    return `${CX + Math.cos(a) * rr},${CY + Math.sin(a) * rr}`;
  }).join(" ");
  const dataPoly = (
    <polygon
      points={dataPts}
      fill="rgba(20,184,166,0.2)"
      stroke="#14B8A6"
      strokeWidth="1.5"
    />
  );

  // 数据点 + 数值
  const dataDots = DIMS.map((_, i) => {
    const a = angle(i);
    const pct = scores[DIMS[i].key] / 100;
    const rr = R * pct;
    const dx = CX + Math.cos(a) * rr;
    const dy = CY + Math.sin(a) * rr;
    const vx = CX + Math.cos(a) * (rr + 14);
    const vy = CY + Math.sin(a) * (rr + 14);
    return (
      <g key={`d${i}`}>
        <circle cx={dx} cy={dy} r="2" fill="#0D9488" />
        <text
          x={vx}
          y={vy + 4}
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontWeight="bold"
        >
          {scores[DIMS[i].key]}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="w-full max-w-[300px] mx-auto block"
    >
      {grids}
      {axes}
      {dataPoly}
      {dataDots}
    </svg>
  );
}
