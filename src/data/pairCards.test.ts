import { describe, it, expect } from "vitest";
import { makePairCards, evalCardText } from "./pairCards";

describe("makePairCards —— 沉船翻牌卡组", () => {
  it("默认 12 张 6 对", () => {
    expect(makePairCards()).toHaveLength(12);
  });

  it("6 个目标值互不相同（否则跨对也能配上）", () => {
    for (let run = 0; run < 100; run++) {
      const values = new Set(makePairCards().map((c) => c.value));
      expect(values.size).toBe(6);
    }
  });

  it("每个值恰好两张牌", () => {
    for (let run = 0; run < 50; run++) {
      const byValue = new Map<number, number>();
      for (const c of makePairCards()) {
        byValue.set(c.value, (byValue.get(c.value) ?? 0) + 1);
      }
      for (const n of byValue.values()) expect(n).toBe(2);
    }
  });

  it("每张牌的算式算出来确实等于它的值 —— 数学不能是假的", () => {
    for (let run = 0; run < 200; run++) {
      for (const c of makePairCards()) {
        expect(evalCardText(c.text), `解析失败: ${c.text}`).not.toBeNull();
        expect(evalCardText(c.text), `算不对: ${c.text}`).toBe(c.value);
      }
    }
  });

  it("同对两条算式文本不同（一样就不用算了）", () => {
    for (let run = 0; run < 100; run++) {
      const byValue = new Map<number, string[]>();
      for (const c of makePairCards()) {
        byValue.set(c.value, [...(byValue.get(c.value) ?? []), c.text]);
      }
      for (const [v, texts] of byValue) {
        expect(texts[0], `值 ${v} 的两张牌文本一样`).not.toBe(texts[1]);
      }
    }
  });

  it("id 稳定且互不相同（洗牌后可追踪）", () => {
    const ids = makePairCards().map((c) => c.id);
    expect(new Set(ids).size).toBe(12);
  });

  it("不出 0 值（太容易一眼看穿）", () => {
    for (let run = 0; run < 50; run++) {
      expect(makePairCards().every((c) => c.value !== 0)).toBe(true);
    }
  });
});
