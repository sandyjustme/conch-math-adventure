import { useEffect } from "react";
import useStore from "../store/useStore";
import type { View } from "../types";

const VIEWS: ReadonlySet<string> = new Set<View>([
  "shift",
  "drama",
  "fraction",
  "cafe",
  "adventure",
  "dive",
  "soup",
  "abyss",
  "rules",
  "games",
  "album",
  "redeem",
  "map",
  "dashboard",
]);

function hashToView(hash: string): string | null {
  const m = hash.match(/^#\/(\w+)$/);
  return m && VIEWS.has(m[1]) ? m[1] : null;
}

// store 的 currentView 与 URL hash 双向同步。
// 学生按手机返回键时 popstate 回上一个 view，而不是直接退出应用。
// #verify= 开头的核销页走 main.tsx:9 的分流，不受此 hook 影响。
export function useHashRouting() {
  const currentView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);

  // 初始加载：从 hash 恢复视图（否则默认 cafe）
  useEffect(() => {
    const v = hashToView(window.location.hash);
    if (v && v !== currentView) setView(v as View);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // view 变化 → 写 hash（store 是唯一真相源）
  useEffect(() => {
    if (window.location.hash.startsWith("#verify=")) return;
    const target = `#/${currentView}`;
    if (window.location.hash !== target) {
      history.pushState(null, "", target);
    }
  }, [currentView]);

  // 浏览器前进/后退 → 改 view
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith("#verify=")) return;
      const v = hashToView(window.location.hash);
      if (v && v !== currentView) setView(v as View);
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, [currentView, setView]);
}
