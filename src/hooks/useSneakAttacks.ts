import { useEffect, useCallback } from "react";
import useStore from "../store/useStore";
import {
  getDueSneaks,
  advanceSneakLevel,
  resetSneakLevel,
  scheduleSneakAttack,
  getSneakReward,
} from "../engine/spacedRepetition";
import type { SneakAttack } from "../types";

export function useSneakAttacks() {
  const masteredNodes = useStore((s) => s.masteredNodes);
  const sneakAttacks = useStore((s) => s.sneakAttacks);
  const setSneakAttacks = useStore((s) => s.setSneakAttacks);
  const updateSneakAttack = useStore((s) => s.updateSneakAttack);
  const removeSneakAttack = useStore((s) => s.removeSneakAttack);
  const addFragments = useStore((s) => s.addFragments);

  useEffect(() => {
    setSneakAttacks((prev) => {
      let next = prev;
      for (const nodeId of masteredNodes) {
        const existing = next.find((a) => a.nodeId === nodeId);
        if (!existing) {
          next = [...next, scheduleSneakAttack(nodeId, 0, Date.now())];
        }
      }
      return next;
    });

    const state = useStore.getState();
    for (const attack of state.sneakAttacks) {
      if (!masteredNodes.includes(attack.nodeId)) {
        removeSneakAttack(attack.nodeId);
      }
    }
  }, [masteredNodes]);

  const checkForDueAttacks = useCallback((): SneakAttack[] => {
    const due = getDueSneaks(sneakAttacks);
    return due;
  }, [sneakAttacks]);

  const handleSneakSuccess = useCallback(
    (nodeId: string) => {
      const attack = sneakAttacks.find((a) => a.nodeId === nodeId);
      if (attack) {
        const reward = getSneakReward(attack.level);
        addFragments(reward);
        const updated = advanceSneakLevel(attack);
        updateSneakAttack(updated);
      }
    },
    [sneakAttacks, addFragments, updateSneakAttack]
  );

  const handleSneakFail = useCallback(
    (nodeId: string) => {
      const attack = sneakAttacks.find((a) => a.nodeId === nodeId);
      if (attack) {
        const reset = resetSneakLevel(attack);
        updateSneakAttack(reset);
      }
    },
    [sneakAttacks, updateSneakAttack]
  );

  return {
    dueAttacks: checkForDueAttacks(),
    handleSneakSuccess,
    handleSneakFail,
  };
}
