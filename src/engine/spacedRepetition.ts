import type { SneakAttack } from "../types";
import { SNEAK_INTERVALS } from "../data/gameConfig";

export function scheduleSneakAttack(
  nodeId: string,
  currentLevel: number,
  masteredAt: number
): SneakAttack {
  const interval =
    SNEAK_INTERVALS[Math.min(currentLevel, SNEAK_INTERVALS.length - 1)];
  return {
    nodeId,
    level: currentLevel,
    nextAt: masteredAt + interval.ms,
    context: interval.label,
  };
}

export function isSneakDue(
  attack: SneakAttack,
  now: number = Date.now()
): boolean {
  return now >= attack.nextAt;
}

export function advanceSneakLevel(attack: SneakAttack): SneakAttack {
  const nextLevel = Math.min(attack.level + 1, SNEAK_INTERVALS.length - 1);
  const interval = SNEAK_INTERVALS[nextLevel];
  return {
    ...attack,
    level: nextLevel,
    nextAt: Date.now() + interval.ms,
    context: interval.label,
  };
}

export function resetSneakLevel(attack: SneakAttack): SneakAttack {
  const interval = SNEAK_INTERVALS[0];
  return {
    ...attack,
    level: 0,
    nextAt: Date.now() + interval.ms,
    context: interval.label,
  };
}

export function getSneakReward(level: number): number {
  return SNEAK_INTERVALS[Math.min(level, SNEAK_INTERVALS.length - 1)].reward;
}

export function getDueSneaks(
  attacks: SneakAttack[],
  now: number = Date.now()
): SneakAttack[] {
  return attacks.filter((a) => isSneakDue(a, now));
}
