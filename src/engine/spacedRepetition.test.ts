import { describe, it, expect } from "vitest";
import {
  scheduleSneakAttack,
  isSneakDue,
  advanceSneakLevel,
  resetSneakLevel,
  getSneakReward,
  getDueSneaks,
} from "./spacedRepetition";
import { SNEAK_INTERVALS } from "../data/gameConfig";

const NOW = 1752600000000;

describe("间隔偷袭调度", () => {
  it("按等级取间隔梯度", () => {
    const attack = scheduleSneakAttack("K8", 0, NOW);
    expect(attack.nextAt).toBe(NOW + SNEAK_INTERVALS[0].ms);
    expect(attack.context).toBe(SNEAK_INTERVALS[0].label);
  });

  it("等级超出梯度封顶到最后一级", () => {
    const attack = scheduleSneakAttack("K8", 99, NOW);
    expect(attack.nextAt).toBe(
      NOW + SNEAK_INTERVALS[SNEAK_INTERVALS.length - 1].ms
    );
  });

  it("到期判定", () => {
    const attack = scheduleSneakAttack("K8", 0, NOW);
    expect(isSneakDue(attack, NOW)).toBe(false);
    expect(isSneakDue(attack, NOW + SNEAK_INTERVALS[0].ms)).toBe(true);
  });

  it("答对升级，最高封顶", () => {
    let attack = scheduleSneakAttack("K8", SNEAK_INTERVALS.length - 1, NOW);
    attack = advanceSneakLevel(attack);
    expect(attack.level).toBe(SNEAK_INTERVALS.length - 1);
  });

  it("答错重置回 0 级", () => {
    const attack = resetSneakLevel(scheduleSneakAttack("K8", 4, NOW));
    expect(attack.level).toBe(0);
  });

  it("奖励随等级递增", () => {
    expect(getSneakReward(0)).toBe(SNEAK_INTERVALS[0].reward);
    expect(getSneakReward(999)).toBe(
      SNEAK_INTERVALS[SNEAK_INTERVALS.length - 1].reward
    );
  });

  it("getDueSneaks 只返回到期的", () => {
    const due = scheduleSneakAttack("K8", 0, NOW - SNEAK_INTERVALS[0].ms * 2);
    const future = scheduleSneakAttack("K10", 0, NOW);
    expect(getDueSneaks([due, future], NOW)).toEqual([due]);
  });
});
