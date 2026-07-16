import { useEffect } from "react";
import type { View } from "../types";

const TITLES: Record<View, string> = {
  cafe: "海螺咖啡馆 · 数学探险",
  adventure: "海底探险 · 海螺咖啡馆",
  dive: "潜水算术 · 海螺咖啡馆",
  soup: "海龟汤 · 海螺咖啡馆",
  abyss: "古深海遗迹 · 海螺咖啡馆",
  rules: "规则怪谈 · 海螺咖啡馆",
  dashboard: "航海日志 · 海螺咖啡馆",
  games: "游戏角 · 海螺咖啡馆",
  album: "贝壳图鉴 · 海螺咖啡馆",
  redeem: "兑换吧台 · 海螺咖啡馆",
  map: "藏宝图 · 海螺咖啡馆",
};

export function usePageTitle(view: View) {
  useEffect(() => {
    document.title = TITLES[view] || "海螺咖啡馆";
  }, [view]);
}
