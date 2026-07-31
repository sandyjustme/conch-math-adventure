import { describe, it, expect } from "vitest";
import { normalizeForSpeech } from "./speechText";
import { PREWRITTEN_EPISODES } from "../data/dramaWorld";

describe("normalizeForSpeech", () => {
  it("数学减号当负号读（本次修复的 bug）", () => {
    expect(normalizeForSpeech("还多出来一个数字：−7")).toBe(
      "还多出来一个数字：负7"
    );
  });

  it("ASCII 连字符同样处理", () => {
    expect(normalizeForSpeech("按下 -2")).toBe("按下 负2");
  });

  it("正号读「正」", () => {
    expect(normalizeForSpeech("游到 +5")).toBe("游到 正5");
  });

  it("夹在数字之间是运算符，不动", () => {
    expect(normalizeForSpeech("5−3")).toBe("5−3");
    expect(normalizeForSpeech("2+3")).toBe("2+3");
  });

  it("句首的负号也读「负」", () => {
    expect(normalizeForSpeech("−11。")).toBe("负11。");
  });

  it("破折号不受影响", () => {
    expect(normalizeForSpeech("第一条——")).toBe("第一条——");
  });

  it("不跟数字的符号不动", () => {
    expect(normalizeForSpeech("A-B")).toBe("A-B");
  });

  it("一句里多个负号全部处理", () => {
    expect(normalizeForSpeech("−3 层和 −7 层")).toBe("负3 层和 负7 层");
  });

  it("非数字内容原样返回", () => {
    const s = "转学第一天，她被安排在最后一排。";
    expect(normalizeForSpeech(s)).toBe(s);
  });
});

describe("全部预写剧集朗读后不再出现裸负号", () => {
  it("每一段送去朗读的文本里都没有「数字前的减号」", () => {
    for (const ep of PREWRITTEN_EPISODES) {
      const segments = [
        ep.openText,
        ep.bodyText,
        ep.branchRight,
        ep.branchWrong,
        ep.hookText,
        ep.choice?.optionA ?? "",
        ep.choice?.optionB ?? "",
      ];
      for (const seg of segments) {
        const spoken = normalizeForSpeech(seg);
        // 规整后剩下的 −/- 必须都夹在数字中间（真运算符）
        const leftovers = [...spoken.matchAll(/[−\-+](?=\d)/g)].filter(
          (m) => !/\d/.test(spoken[m.index! - 1] ?? "")
        );
        expect(leftovers.map((m) => m[0])).toEqual([]);
      }
    }
  });
});
