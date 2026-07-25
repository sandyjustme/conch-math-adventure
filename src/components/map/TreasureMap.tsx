import { useEffect, useRef } from "react";
import useStore from "../../store/useStore";
import { NODES, NODE_MAP } from "../../data/knowledgeGraph";
import { getNodeStatus } from "../../engine/levelManager";
import Mascot from "../shared/Mascot";

export default function TreasureMap() {
  const setView = useStore((s) => s.setView);
  const masteredNodes = useStore((s) => s.masteredNodes);
  const currentNodeId = useStore((s) => s.currentNodeId);
  const answerRecords = useStore((s) => s.answerRecords);
  const lastCount = useRef(masteredNodes.length);

  useEffect(() => {
    if (masteredNodes.length > lastCount.current) {
      const gained = (masteredNodes.length - lastCount.current) * 2;
      useStore.getState().addPearls(gained);
      useStore.getState().showToast("pearl", gained);
      lastCount.current = masteredNodes.length;
    }
  }, [masteredNodes.length]);

  const chapterNodes = NODES.filter((n) => n.chapter === "有理数");

  return (
    <div className="min-h-screen bg-ocean-shimmer">
      <header className="flex items-center justify-between px-4 py-3 bg-white/60 backdrop-blur">
        <button
          onClick={() => setView("cafe")}
          className="text-xl"
          aria-label="回咖啡馆"
        >
          🏠
        </button>
        <div className="flex items-center gap-2">
          <Mascot size={24} />
          <h1 className="font-display text-lg text-ocean-deep">藏宝图</h1>
        </div>
        <div className="w-8" />
      </header>
      <div className="p-4">
        {/* 图例 */}
        <div className="max-w-md md:max-w-lg mx-auto mb-4 bg-white/70 rounded-2xl p-3 flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs font-body text-slate-600">
          <span>
            🏝️ <span className="text-emerald-500 font-bold">绿色</span> 已掌握
          </span>
          <span>
            🌋 <span className="text-amber-500 font-bold">橙色</span> 正在学
          </span>
          <span>
            🏝️ <span className="text-slate-500">白色</span> 已解锁
          </span>
          <span>
            🌫️ <span className="text-slate-400">灰色</span> 未解锁
          </span>
          <span>
            <span className="inline-block w-3 h-3 rounded-full ring-2 ring-amber-400 align-middle mr-0.5" />
            当前
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 max-w-md md:max-w-lg mx-auto">
          {chapterNodes.map((node) => {
            const status = getNodeStatus(node.id, masteredNodes, answerRecords);
            const isCurrent = node.id === currentNodeId;

            const bgColor =
              status === "mastered"
                ? "bg-emerald-100 border-emerald-300"
                : status === "in_progress"
                  ? "bg-amber-50 border-amber-300"
                  : status === "unlocked"
                    ? "bg-white border-teal-200"
                    : "bg-slate-100 border-slate-200 opacity-50";

            return (
              <div
                key={node.id}
                className={`rounded-2xl border-2 p-3 text-center transition ${bgColor} ${
                  isCurrent ? "ring-2 ring-amber-400 ring-offset-2" : ""
                }`}
              >
                <div className="text-xl mb-1">
                  {status === "mastered"
                    ? "🏝️"
                    : status === "in_progress"
                      ? "🌋"
                      : status === "unlocked"
                        ? "🏝️"
                        : "🌫️"}
                </div>
                <div className="font-body text-xs font-bold">{node.name}</div>
                <div className="font-body text-[10px] text-slate-500">
                  {node.id}
                </div>
                {node.breakpointRisk && status !== "mastered" && (
                  <div className="text-[10px] mt-1">⚠️ 重点</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
