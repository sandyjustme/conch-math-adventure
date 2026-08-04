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
import FractionLine from "./components/practice/FractionLine";
import ShiftShell from "./components/shift/ShiftShell";
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
      case "fraction":
        return <FractionLine />;
      case "shift":
        return <ShiftShell ready={loaded} />;
      // drama 原来是 default 分支；default 换成班次后必须显式列出，
      // 否则 #/drama 会静默落回班次，短剧整个访问不到。
      case "drama":
        return <EpisodePlayer />;
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
        return <ShiftShell ready={loaded} />;
    }
  })();

  return (
    <>
      <main id="main-content">{view}</main>
      {/* 前后测只在已冻结的 v2 大厅弹，别的地方一律不弹。
          她拒绝的就是「被考」这件事本身 —— 打开任何一个玩的地方
          先撞上一场测验，后面做什么都白搭。 */}
      {showTest && currentView === "cafe" && (
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
