import { useEffect } from "react";
import type { View } from "../types";

const TITLES: Record<View, string> = {
  drama: "地下十三层 · 喵喵趣学",
  cafe: "喵喵趣学",
  adventure: "海底探险 · 喵喵趣学",
  dive: "潜水算术 · 喵喵趣学",
  soup: "海龟汤 · 喵喵趣学",
  abyss: "古深海遗迹 · 喵喵趣学",
  rules: "规则怪谈 · 喵喵趣学",
  dashboard: "航海日志 · 喵喵趣学",
  games: "游戏角 · 喵喵趣学",
  album: "贝壳图鉴 · 喵喵趣学",
  redeem: "兑换吧台 · 喵喵趣学",
  map: "藏宝图 · 喵喵趣学",
};

export function usePageTitle(view: View) {
  useEffect(() => {
    document.title = TITLES[view] || "喵喵趣学";
  }, [view]);
}
