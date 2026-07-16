import { useEffect, useState } from "react";
import useStore from "./store/useStore";
import { usePersistence } from "./hooks/usePersistence";
import { useLoginCheck } from "./hooks/useLoginCheck";
import { useHashRouting } from "./hooks/useHashRouting";
import { usePageTitle } from "./hooks/usePageTitle";
import { runValidation } from "./engine/validateGraph";
import { runDiveTasksValidation } from "./engine/validateDiveTasks";
import FeedbackOverlay from "./components/shared/FeedbackOverlay";
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
  }, []);
  usePersistence();
  useLoginCheck();
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
        return <CafeHall />;
    }
  })();

  return (
    <>
      <main id="main-content">{view}</main>
      {showTest && <PrePostTest onDone={() => setShowTest(false)} />}
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
