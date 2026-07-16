import useStore from "../../store/useStore";
import { EXCHANGE_RATE } from "../../data/gameConfig";

export default function ShellCounter() {
  const fragments = useStore((s) => s.fragments);
  const pearls = useStore((s) => s.pearls);

  return (
    <div className="flex items-center gap-3 bg-white/90 rounded-full px-3 py-1.5 shadow-sm">
      <span className="text-sm" title="珍珠">
        💎 {pearls}
      </span>
      <span className="text-slate-400">|</span>
      <span className="text-sm" title="贝壳碎片">
        🌟 {fragments}
      </span>
    </div>
  );
}
