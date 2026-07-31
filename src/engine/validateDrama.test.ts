import { describe, it, expect } from "vitest";
import { validateDrama, validateEpisode } from "./validateDrama";
import { PREWRITTEN_EPISODES, type Episode } from "../data/dramaWorld";

const base = (): Episode => ({
  ...PREWRITTEN_EPISODES[2],
  choice: { ...PREWRITTEN_EPISODES[2].choice! },
});

describe("预写剧集", () => {
  it("全部通过五条设计铁律", () => {
    const r = validateDrama();
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });
});

describe("铁律 2：题面不许出现数学术语", () => {
  it("正文出现「绝对值」→ 报错", () => {
    const ep = { ...base(), bodyText: "她想起了绝对值的定义。" };
    expect(validateEpisode(ep).join()).toMatch(/数学术语/);
  });

  it("「楼层数是负的」不算术语，放行", () => {
    const ep = { ...base(), bodyText: "在地下，楼层数是负的。" };
    expect(validateEpisode(ep)).toEqual([]);
  });
});

describe("铁律 1：题必须是主角的决定", () => {
  it("prompt 出现「请问」→ 报错", () => {
    const ep = base();
    ep.choice!.prompt = "请问她该选哪个？";
    expect(validateEpisode(ep).join()).toMatch(/出题口吻/);
  });
});

describe("铁律 3：选项不能是裸数字", () => {
  it("「−7。」→ 报错", () => {
    const ep = base();
    ep.choice!.optionA = "「−7。」";
    expect(validateEpisode(ep).join()).toMatch(/裸数字/);
  });

  it("「−3 层。」带上单位 → 放行", () => {
    const ep = base();
    ep.choice!.optionA = "「−3 层。」";
    expect(validateEpisode(ep)).toEqual([]);
  });
});

describe("铁律 4：答错不阻断", () => {
  it("branchWrong 为空 → 报错", () => {
    const ep = { ...base(), branchWrong: "" };
    expect(validateEpisode(ep).join()).toMatch(/答错绝不允许阻断/);
  });
});

describe("钩子", () => {
  it("hookText 为空 → 报错", () => {
    const ep = { ...base(), hookText: "" };
    expect(validateEpisode(ep).join()).toMatch(/每集必须留钩子/);
  });

  it("hookText 以句号收尾 → 报错", () => {
    const ep = { ...base(), hookText: "他答错了。" };
    expect(validateEpisode(ep).join()).toMatch(/钩子不能收/);
  });
});

describe("集号", () => {
  it("不连续 → 报错", () => {
    const eps = [PREWRITTEN_EPISODES[0], { ...PREWRITTEN_EPISODES[1], no: 5 }];
    expect(validateDrama(eps).valid).toBe(false);
  });
});
