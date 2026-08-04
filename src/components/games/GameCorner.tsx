import { useState } from "react";
import useStore from "../../store/useStore";
import BubbleJump from "./BubbleJump";
import ShellCollector from "./ShellCollector";
import Mascot from "../shared/Mascot";

type GameId = "bubble-jump" | "shell-collector" | null;

export default function GameCorner() {
  const setView = useStore((s) => s.setView);
  const [activeGame, setActiveGame] = useState<GameId>(null);

  if (activeGame === "bubble-jump") {
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(180deg, #07090C 0%, #0E141C 50%, #16202C 100%)",
        }}
      >
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setActiveGame(null)}
            className="text-xl font-body text-slate-300 hover:text-slate-100"
          >
            ← 返回
          </button>
        </header>
        <BubbleJump />
      </div>
    );
  }

  if (activeGame === "shell-collector") {
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(180deg, #07090C 0%, #0E141C 50%, #16202C 100%)",
        }}
      >
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setActiveGame(null)}
            className="text-xl font-body text-slate-300 hover:text-slate-100"
          >
            ← 返回
          </button>
        </header>
        <ShellCollector />
      </div>
    );
  }

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
          <h1 className="font-display text-lg text-ocean-deep">游戏角</h1>
        </div>
        <div className="w-8" />
      </header>
      <div className="p-4">
        <div className="space-y-3 max-w-md md:max-w-lg mx-auto pb-8">
          <button
            onClick={() => setActiveGame("bubble-jump")}
            className="w-full bg-white rounded-3xl p-5 shadow-md hover:shadow-lg transition text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🤿</div>
              <div>
                <div className="font-body font-bold text-lg">深潜补氧</div>
                <div className="font-body text-sm text-slate-500">
                  氧气一直在掉，算式的值就是补的秒数
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveGame("shell-collector")}
            className="w-full bg-white rounded-3xl p-5 shadow-md hover:shadow-lg transition text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🐚</div>
              <div>
                <div className="font-body font-bold text-lg">沉船翻牌</div>
                <div className="font-body text-sm text-slate-500">
                  翻牌配对：两个算式一样大才是一对
                </div>
              </div>
            </div>
          </button>

          <div className="bg-white/50 rounded-3xl p-5 text-left opacity-50">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🔐</div>
              <div>
                <div className="font-body font-bold text-lg">沉船密码</div>
                <div className="font-body text-sm text-slate-500">
                  整式章节解锁 · 合并同类项
                </div>
              </div>
              <div className="ml-auto text-slate-500 text-sm font-body">🔒</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
