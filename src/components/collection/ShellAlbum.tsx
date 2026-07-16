import useStore from "../../store/useStore";
import { EXCHANGE_RATE } from "../../data/gameConfig";
import Mascot from "../shared/Mascot";
import RadarChart from "../shared/RadarChart";
import { computeAnalytics } from "../../engine/analytics";
import { NODES } from "../../data/knowledgeGraph";

export default function ShellAlbum() {
  const setView = useStore((s) => s.setView);
  const fragments = useStore((s) => s.fragments);
  const pearls = useStore((s) => s.pearls);
  const rareShells = useStore((s) => s.rareShells);
  const masteredNodes = useStore((s) => s.masteredNodes);
  const answerRecords = useStore((s) => s.answerRecords);
  const consecutiveDays = useStore((s) => s.consecutiveDays);
  const redemptions = useStore((s) => s.redemptions);
  const convertFragmentsToPearls = useStore((s) => s.convertFragmentsToPearls);

  const nodeNames = new Map(NODES.map((n) => [n.id, n.name]));
  const totalDays = new Set(
    answerRecords.map((r) => new Date(r.timestamp).toISOString().slice(0, 10))
  ).size;
  const analytics = computeAnalytics(
    answerRecords,
    masteredNodes,
    consecutiveDays,
    totalDays,
    pearls,
    fragments,
    redemptions,
    nodeNames,
    NODES.length
  );

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
          <h1 className="font-display text-lg text-ocean-deep">贝壳图鉴</h1>
        </div>
        <div className="w-8" />
      </header>
      <div className="p-4">
        <div className="max-w-md md:max-w-lg mx-auto space-y-6">
          <section className="bg-white rounded-3xl p-5 shadow-md">
            <h2 className="font-body font-bold text-lg mb-3">💎 珍珠</h2>
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-2xl">
                  {i < pearls % EXCHANGE_RATE ||
                  (pearls >= EXCHANGE_RATE && i < EXCHANGE_RATE)
                    ? "💎"
                    : "⭕"}
                </span>
              ))}
            </div>
            <p className="font-body text-sm text-slate-500">
              当前 {pearls} 颗 · {EXCHANGE_RATE} 颗兑一杯咖啡
            </p>
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-md">
            <h2 className="font-body font-bold text-lg mb-3">🌟 贝壳碎片</h2>
            <p className="font-body text-3xl font-bold text-amber-500">
              {fragments}
            </p>
            <p className="font-body text-sm text-slate-500 mb-3">
              每 10 个碎片可以兑换 1 颗珍珠 · 游戏角获取
            </p>
            {fragments === 0 && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 text-center">
                还没有碎片，去🎮 游戏角玩玩吧！
              </p>
            )}
            {fragments >= 10 && (
              <button
                onClick={convertFragmentsToPearls}
                className="w-full py-2.5 rounded-full bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 transition active:scale-95"
                aria-label="把碎片兑换成珍珠"
              >
                兑换成 {Math.floor(fragments / 10)} 颗珍珠（剩余{" "}
                {fragments % 10} 碎片）
              </button>
            )}
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-md">
            <h2 className="font-body font-bold text-lg mb-1">🐚 稀有贝壳</h2>
            <p className="font-body text-xs text-slate-500 mb-3">
              攻克重点知识点时随机掉落 · 永久收藏
            </p>
            {rareShells.length === 0 ? (
              <p className="font-body text-sm text-slate-500">
                还没有稀有贝壳，攻克 ⚠️ 重点标记的知识点来获得第一只吧！
              </p>
            ) : (
              <div className="space-y-2">
                {rareShells.map((shell) => (
                  <div
                    key={shell.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-amber-50"
                  >
                    <span className="text-2xl">🐚</span>
                    <div>
                      <div className="font-body font-bold text-sm">
                        {shell.name}
                      </div>
                      <div className="font-body text-xs text-slate-500">
                        {shell.story}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-md">
            <h2 className="font-body font-bold text-lg mb-1">🧭 成长画像</h2>
            <p className="font-body text-xs text-slate-500 mb-3">
              六个维度看你的数学探险
            </p>
            <RadarChart scores={analytics.radar} />
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-md">
            <h2 className="font-body font-bold text-lg mb-1">🏆 徽章</h2>
            <p className="font-body text-xs text-slate-500 mb-3">
              掌握的知识点越多，徽章越稀有 · 终极目标：集齐 20 关
            </p>
            <div className="flex gap-3 flex-wrap">
              {masteredNodes.length >= 1 && (
                <span className="text-2xl" title="初露锋芒：掌握第一个知识点">
                  🌱
                </span>
              )}
              {masteredNodes.length >= 5 && (
                <span className="text-2xl" title="渐入佳境：掌握五个知识点">
                  🌿
                </span>
              )}
              {masteredNodes.length >= 10 && (
                <span className="text-2xl" title="半程英雄：掌握十个知识点">
                  🌳
                </span>
              )}
              {masteredNodes.length >= 20 && (
                <span
                  className="text-2xl"
                  title="有理数大师：掌握全部二十个知识点"
                >
                  👑
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
