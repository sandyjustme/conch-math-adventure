import { useEffect, useState } from "react";
import useStore from "./store/useStore";
import { usePersistence } from "./hooks/usePersistence";
import { useLoginCheck } from "./hooks/useLoginCheck";
import { useHashRouting } from "./hooks/useHashRouting";
import { usePageTitle } from "./hooks/usePageTitle";
import { runValidation } from "./engine/validateGraph";
import { runDiveTasksValidation } from "./engine/validateDiveTasks";
import { runDramaValidation } from "./engine/validateDrama";
import FeedbackOverlay from "./components/shared/FeedbackOverlay";
import EpisodePlayer from "./components/drama/EpisodePlayer";
import CafeHall from "./components/cafe/CafeHall";
import AdventureChat from "./components/adventure/AdventureChat";
import DiveMath from "./components/adventure/DiveMath";
import SoupKitchen from "./components/adventure/SoupKitchen";
import FractionPearls from "./components/abyss/FractionPearls";
import RulesSurvival from "./components/adventure/RulesSurvival";
import GameCorner from "./components/games/GameCorner";
import TreasureMap from "./components/map/TreasureMap";
import ShellAlbum from "./components/collection/ShellAlbum";
import RedeemBar from "./components/redeem/RedeemBar";
import Dashboard from "./components/collection/Dashboard";
import PrePostTest from "./components/shared/PrePostTest";

export default function App() {
  useEffect(() => {
    runValidation();
    runDiveTasksValidation();
    runDramaValidation();
  }, []);
  const loaded = usePersistence();
  useLoginCheck(loaded);
  useHashRouting();

  const [showTest, setShowTest] = useState(() => {
    try {
      const pre = localStorage.getItem("conch_pretest");
      if (!pre) return true; // 第一次：弹前测
      const post = localStorage.getItem("conch_posttest");
      if (!post && Date.now() - JSON.parse(pre).timestamp > 14 * 86400000)
        return true; // 14天后弹后测
      return false;
    } catch {
      console.warn("读取前后测状态失败");
      return false;
    }
  });

  const currentView = useStore((s) => s.currentView);
  usePageTitle(currentView);

  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  const view = (() => {
    switch (currentView) {
      // v2 的六个玩法保留在仓库里，但已从主路径移除（只能靠 #/xxx 手输进入）。
      // 默认视图是短剧播放器 —— 没有大厅、没有玩法选择，取消选择即取消套利。
      case "cafe":
        return <CafeHall />;
      case "adventure":
        return <AdventureChat />;
      case "dive":
        return <DiveMath />;
      case "soup":
        return <SoupKitchen />;
      case "abyss":
        return <FractionPearls />;
      case "rules":
        return <RulesSurvival />;
      case "games":
        return <GameCorner />;
      case "map":
        return <TreasureMap />;
      case "album":
        return <ShellAlbum />;
      case "redeem":
        return <RedeemBar />;
      case "dashboard":
        return <Dashboard />;
      default:
        return <EpisodePlayer />;
    }
  })();

  return (
    <>
      <main id="main-content">{view}</main>
      {/* 前后测只在 v2 路径下弹；短剧路径第一眼必须是故事，不能是测验 */}
      {showTest && currentView !== "drama" && (
        <PrePostTest onDone={() => setShowTest(false)} />
      )}
      {toasts.map((t) => (
        <FeedbackOverlay
          key={t.id}
          type={t.type}
          value={t.value}
          onDone={() => removeToast(t.id)}
        />
      ))}
    </>
  );
}
