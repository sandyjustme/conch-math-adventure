import { useEffect, useRef } from "react";
import useStore from "../store/useStore";

export function useLoginCheck(loaded: boolean) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (!loaded || ranRef.current) return;
    ranRef.current = true;

    const today = new Date().toISOString().slice(0, 10);
    const state = useStore.getState();
    const lastLoginDate = state.lastLoginDate;
    const consecutiveDays = state.consecutiveDays;

    if (!lastLoginDate) {
      state.setLastLogin(today);
      state.setConsecutiveDays(1);
      /* v4 单水龙头：珍珠与碎片只从「今天的活儿」来，此处停发 */
      return;
    }

    if (lastLoginDate === today) return;

    state.resetAdventureCount();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastLoginDate === yesterdayStr) {
      const newCount = consecutiveDays + 1;
      state.setConsecutiveDays(newCount);
      /* v4 单水龙头：珍珠与碎片只从「今天的活儿」来，此处停发 */
      if (newCount === 7) {
        /* v4 单水龙头：珍珠与碎片只从「今天的活儿」来，此处停发 */
      }
    } else {
      state.setConsecutiveDays(1);
      /* v4 单水龙头：珍珠与碎片只从「今天的活儿」来，此处停发 */
    }

    state.setLastLogin(today);
  }, [loaded]);
}
