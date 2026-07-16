import { useState } from "react";
import useStore from "../../store/useStore";
import { useGreeting } from "../../hooks/useGreeting";
import { useSneakAttacks } from "../../hooks/useSneakAttacks";
import { getChapterProgress } from "../../engine/levelManager";
import { EXCHANGE_RATE } from "../../data/gameConfig";
import ShellCounter from "../shared/ShellCounter";
import Mascot from "../shared/Mascot";
import SoundToggle from "../shared/SoundToggle";
import { NODE_MAP } from "../../data/knowledgeGraph";
import type { View } from "../../types";

/* ── 卡片 ── */
function Card({
  emoji,
  title,
  desc,
  badge,
  accent = "coral",
  delay = 0,
  onClick,
}: {
  emoji: string;
  title: string;
  desc: string;
  badge?: string;
  accent?: "coral" | "gold" | "mint" | "ocean";
  delay?: number;
  onClick: () => void;
}) {
  const border = {
    coral: "border-rose-200 hover:border-rose-300",
    gold: "border-amber-200 hover:border-amber-300",
    mint: "border-teal-200 hover:border-teal-300",
    ocean: "border-sky-200 hover:border-sky-300",
  }[accent];
  const text = {
    coral: "text-rose-500",
    gold: "text-amber-600",
    mint: "text-teal-600",
    ocean: "text-sky-600",
  }[accent];
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border-2 p-4 transition-all duration-300 bg-white shadow-sm hover:shadow-md active:scale-[0.98] ${border} animate-pop-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className={`font-bold text-sm ${text}`}>{title}</div>
      <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">
        {desc}
      </div>
      {badge && (
        <span className="absolute top-3 right-3 bg-amber-100 text-amber-600 text-[10px] rounded-full px-2 py-0.5 font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── 水面波光金点 ── */
function Sparkles() {
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

/* ── 底部海浪线 ── */
function Waves() {
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

/* ═══════════════════════════════════════════
   咖啡馆大厅
   ═══════════════════════════════════════════ */
export default function CafeHall() {
  const setView = useStore((s) => s.setView);
  const setDiveFocus = useStore((s) => s.setDiveFocus);
  const masteredNodes = useStore((s) => s.masteredNodes);
  const pearls = useStore((s) => s.pearls);
  const fragments = useStore((s) => s.fragments);
  const greeting = useGreeting();
  const progress = getChapterProgress("有理数", masteredNodes);
  const canRedeem = pearls >= EXCHANGE_RATE;
  const nav = (v: View) => () => setView(v);

  // 间隔偷袭
  const { dueAttacks, handleSneakSuccess } = useSneakAttacks();

  // 新手引导
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem("cafeGuideSeen") !== "1";
    } catch {
      console.warn("读取新手引导状态失败");
      return true;
    }
  });
  const dismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem("cafeGuideSeen", "1");
    } catch {
      console.warn("存储新手引导状态失败");
    }
  };

  return (
    <div className="relative min-h-screen font-body overflow-hidden bg-cafe-gradient">
      {/* 金色波光 + 底部海浪 */}
      <Sparkles />
      <Waves />

      <div className="relative z-10">
        {/* 顶栏 */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowGuide(true)}
            className="text-xl w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white"
            aria-label="帮助"
          >
            ?
          </button>
          <SoundToggle />
        </div>

        {/* 间隔偷袭提醒 */}
        {dueAttacks.length > 0 && (
          <div className="px-4 mb-3 max-w-md md:max-w-lg mx-auto">
            {dueAttacks.map((a) => {
              const node = NODE_MAP.get(a.nodeId);
              return (
                <div
                  key={a.nodeId}
                  className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-center gap-3 animate-pop-in"
                >
                  <div className="text-2xl">⏰</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-amber-700">
                      还记得「{node?.name || a.nodeId}」吗？
                    </div>
                    <div className="text-xs text-amber-500">
                      {a.context}到了，来复习一下吧！
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSneakSuccess(a.nodeId);
                      setDiveFocus(a.nodeId);
                      setView("dive");
                    }}
                    className="px-4 py-2 rounded-full bg-amber-400 text-white text-xs font-bold hover:bg-amber-500 transition active:scale-95 whitespace-nowrap"
                  >
                    去复习 →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 海小喵欢迎区 */}
        <div className="text-center mb-5 px-4">
          <div className="mb-3 flex justify-center">
            <div className="relative">
              {/* 暖金色柔光 */}
              <div
                className="absolute rounded-full blur-2xl"
                style={{
                  width: 120,
                  height: 120,
                  top: -20,
                  left: -20,
                  background:
                    "radial-gradient(circle, #FFD89C66 0%, #FFB8A944 50%, transparent 80%)",
                }}
              />
              <div className="relative z-10 animate-float">
                <Mascot size={84} />
              </div>
            </div>
          </div>
          <h1 className="font-display text-3xl text-stone-700 mb-1">
            海螺咖啡馆
          </h1>
          <p className="text-sm text-stone-500">{greeting}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-xs text-teal-500 bg-teal-50/80 rounded-full px-3 py-1 font-medium">
              有理数 {progress}%
            </span>
            <ShellCounter />
          </div>
        </div>

        {/* 卡片区 */}
        <div className="max-w-md md:max-w-lg mx-auto px-4 pb-12 space-y-5">
          {/* 🌊 学习冒险 */}
          <section>
            <h2 className="text-[11px] font-bold text-teal-400 mb-2.5 px-1">
              🌊 学习冒险
            </h2>
            <div className="space-y-2.5">
              <Card
                emoji="🐱"
                title="今日探险"
                desc="海小喵陪你聊天诊断，找到卡住的地方"
                accent="ocean"
                delay={60}
                onClick={nav("adventure")}
              />
              <Card
                emoji="🐚"
                title="潜水算术"
                desc="用手拖着海螺上浮下潜，把算式走出来"
                accent="ocean"
                badge="动手练"
                delay={110}
                onClick={() => {
                  setDiveFocus(null);
                  setView("dive");
                }}
              />
            </div>
          </section>

          {/* 🕹️ 游戏与收集 */}
          <section>
            <h2 className="text-[11px] font-bold text-amber-400 mb-2.5 px-1">
              🕹️ 游戏与收集
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Card
                emoji="🎮"
                title="游戏角"
                desc="2 个小游戏练反应"
                accent="gold"
                delay={170}
                onClick={nav("games")}
              />
              <Card
                emoji="🗺️"
                title="藏宝图"
                desc={`已点亮 ${masteredNodes.length}/20 岛`}
                accent="gold"
                delay={210}
                onClick={nav("map")}
              />
              <Card
                emoji="📖"
                title="贝壳图鉴"
                desc={`${fragments} 碎片 · ${pearls} 珍珠`}
                accent="coral"
                delay={250}
                onClick={nav("album")}
              />
              <Card
                emoji="☕"
                title="兑换吧台"
                desc={
                  canRedeem
                    ? "可以去兑换啦！"
                    : `${pearls}/${EXCHANGE_RATE} 珍珠`
                }
                accent="coral"
                badge={canRedeem ? "可兑" : undefined}
                delay={290}
                onClick={nav("redeem")}
              />
            </div>
          </section>

          {/* 🔮 隐藏菜单 */}
          <section>
            <h2 className="text-[11px] font-bold text-purple-400 mb-2.5 px-1">
              🔮 隐藏菜单
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Card
                emoji="🐢"
                title="海龟汤"
                desc="点一碗汤，破一道谜"
                accent="mint"
                badge="新"
                delay={350}
                onClick={nav("soup")}
              />
              <Card
                emoji="🪦"
                title="古深海遗迹"
                desc="上古石碑 · 发现分数"
                accent="mint"
                badge="深渊"
                delay={390}
                onClick={nav("abyss")}
              />
              <Card
                emoji="📜"
                title="规则怪谈"
                desc="午夜班守则 · 遵守规则活到天亮"
                accent="mint"
                badge="新"
                delay={430}
                onClick={nav("rules")}
              />
              <Card
                emoji="📊"
                title="航海日志"
                desc="成长画像 · 数据看板 · 学习分析"
                accent="mint"
                delay={470}
                onClick={nav("dashboard")}
              />
            </div>
          </section>
        </div>
      </div>

      {/* 新手引导 */}
      {showGuide && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={dismissGuide}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <Mascot size={56} />
              <h2 className="font-display text-xl text-stone-700 mt-2">
                欢迎来到海螺咖啡馆！
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                我是海小喵，你的数学探险伙伴～
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 bg-teal-50 rounded-2xl p-3">
                <div className="text-2xl">1️⃣</div>
                <div className="text-sm text-stone-600">
                  <b className="text-teal-600">点「今日探险」</b>
                  <br />
                  海小喵会跟你聊天，看看你在哪个知识点卡住了。
                </div>
              </div>
              <div className="flex gap-3 bg-amber-50 rounded-2xl p-3">
                <div className="text-2xl">2️⃣</div>
                <div className="text-sm text-stone-600">
                  <b className="text-amber-600">答着答着就学懂了</b>
                  <br />
                  不用打字也可以——按 🎤 说话，或者拖数轴上的小猫回答。
                </div>
              </div>
              <div className="flex gap-3 bg-rose-50 rounded-2xl p-3">
                <div className="text-2xl">3️⃣</div>
                <div className="text-sm text-stone-600">
                  <b className="text-rose-500">学懂了就去练！</b>
                  <br />
                  对话框里会跳出「去潜水练一练」——点它，用手拖着海螺把算式走出来。
                </div>
              </div>
            </div>
            <button
              onClick={dismissGuide}
              className="mt-5 w-full py-3 rounded-full bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition"
            >
              开始探险 →
            </button>
            <p className="text-center text-[11px] text-stone-300 mt-2">
              右上角 ? 随时可以再打开
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
