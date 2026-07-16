import { useEffect } from "react";
import useStore from "../store/useStore";

export function useLoginCheck() {
  const lastLoginDate = useStore((s) => s.lastLoginDate);
  const consecutiveDays = useStore((s) => s.consecutiveDays);
  const setLastLogin = useStore((s) => s.setLastLogin);
  const setConsecutiveDays = useStore((s) => s.setConsecutiveDays);
  const addFragments = useStore((s) => s.addFragments);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    if (!lastLoginDate) {
      setLastLogin(today);
      setConsecutiveDays(1);
      addFragments(1);
      return;
    }

    if (lastLoginDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastLoginDate === yesterdayStr) {
      const newCount = consecutiveDays + 1;
      setConsecutiveDays(newCount);
      addFragments(1);
      if (newCount === 7) {
        useStore.getState().addPearls(1);
      }
    } else {
      setConsecutiveDays(1);
      addFragments(1);
    }

    setLastLogin(today);
  }, []);
}
