import { useEffect, useCallback } from "react";
import useStore from "../store/useStore";
import {
  getDueSneaks,
  advanceSneakLevel,
  resetSneakLevel,
  scheduleSneakAttack,
  getSneakReward,
} from "../engine/spacedRepetition";
import { isMastered } from "../engine/levelManager";
import type { SneakAttack } from "../types";

export function useSneakAttacks() {
  const masteredNodes = useStore((s) => s.masteredNodes);
  const answerRecords = useStore((s) => s.answerRecords);
  const sneakAttacks = useStore((s) => s.sneakAttacks);
  const setSneakAttacks = useStore((s) => s.setSneakAttacks);
  const updateSneakAttack = useStore((s) => s.updateSneakAttack);
  const removeSneakAttack = useStore((s) => s.removeSneakAttack);
  const addFragments = useStore((s) => s.addFragments);

  useEffect(() => {
    for (const nodeId of masteredNodes) {
      const existing = sneakAttacks.find((a) => a.nodeId === nodeId);
      if (!existing) {
        const attack = scheduleSneakAttack(nodeId, 0, Date.now());
        setSneakAttacks([...sneakAttacks, attack]);
      }
    }

    for (const attack of sneakAttacks) {
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
