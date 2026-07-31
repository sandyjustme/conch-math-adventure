import { describe, it, expect } from "vitest";
import {
  seasonOf,
  isSeasonFinale,
  indexInSeason,
  getEpisode,
  hasEpisode,
  isFirstCompletion,
  pendingSeasonUnlock,
  judgeChoice,
  nextNodeToTeach,
  splitBeats,
  segmentsBefore,
  type EpisodeRecord,
} from "./dramaEngine";
import { PREWRITTEN_EPISODES, type Episode } from "../data/dramaWorld";

const rec = (no: number, correct: boolean | null = true): EpisodeRecord => ({
  no,
  choice: correct === null ? null : correct ? "A" : "B",
  correct,
  completedAt: 1000 + no,
});

const heardAll = (upTo: number) =>
  Array.from({ length: upTo }, (_, i) => rec(i + 1));

describe("季与集号", () => {
  it("每 5 集一季", () => {
    expect(seasonOf(1)).toBe(1);
    expect(seasonOf(5)).toBe(1);
    expect(seasonOf(6)).toBe(2);
    expect(seasonOf(11)).toBe(3);
  });

  it("第 5、10 集是季末", () => {
    expect(isSeasonFinale(5)).toBe(true);
    expect(isSeasonFinale(10)).toBe(true);
    expect(isSeasonFinale(4)).toBe(false);
    expect(isSeasonFinale(0)).toBe(false);
  });

  it("季内序号从 1 数起", () => {
    expect(indexInSeason(1)).toBe(1);
    expect(indexInSeason(5)).toBe(5);
    expect(indexInSeason(6)).toBe(1);
  });
});

describe("getEpisode", () => {
  it("取得到预写集", () => {
    expect(getEpisode(1)?.title).toBe("新来的");
    expect(getEpisode(5)?.nodeId).toBe("K6");
  });

  it("超出范围返回 null", () => {
    expect(getEpisode(99)).toBeNull();
    expect(hasEpisode(99)).toBe(false);
  });

  it("AI 生成集优先于预写集", () => {
    const fake = { ...PREWRITTEN_EPISODES[0], title: "生成的" } as Episode;
    expect(getEpisode(1, [fake])?.title).toBe("生成的");
  });
});

describe("isFirstCompletion —— 重听不发奖", () => {
  it("没听过 → 首次", () => {
    expect(isFirstCompletion(3, [rec(1), rec(2)])).toBe(true);
  });

  it("听过了 → 不是首次", () => {
    expect(isFirstCompletion(2, [rec(1), rec(2)])).toBe(false);
  });
});

describe("pendingSeasonUnlock —— 追完一季解锁点单权", () => {
  it("季末 + 本季全听过 + 没解锁过 → 解锁该季", () => {
    expect(pendingSeasonUnlock(5, heardAll(5), [])).toBe(1);
  });

  it("不是季末 → 不解锁", () => {
    expect(pendingSeasonUnlock(4, heardAll(4), [])).toBeNull();
  });

  it("本季有漏听 → 不解锁", () => {
    const skipped = [rec(1), rec(2), rec(4), rec(5)]; // 缺第 3 集
    expect(pendingSeasonUnlock(5, skipped, [])).toBeNull();
  });

  it("该季已解锁过 → 重听季末集不再解锁", () => {
    expect(pendingSeasonUnlock(5, heardAll(5), [1])).toBeNull();
  });

  it("第二季只看第二季的集，不受第一季影响", () => {
    const s2 = [...heardAll(5), rec(6), rec(7), rec(8), rec(9), rec(10)];
    expect(pendingSeasonUnlock(10, s2, [1])).toBe(2);
  });
});

describe("judgeChoice", () => {
  const ep = PREWRITTEN_EPISODES[2]; // 第 3 集，correct: "A"

  it("选对 → 走 branchRight", () => {
    const r = judgeChoice(ep, "A");
    expect(r.correct).toBe(true);
    expect(r.text).toBe(ep.branchRight);
  });

  it("选错 → 走 branchWrong，剧情仍然继续", () => {
    const r = judgeChoice(ep, "B");
    expect(r.correct).toBe(false);
    expect(r.text).toBe(ep.branchWrong);
    expect(r.text.length).toBeGreaterThan(0);
  });

  it("无题集直接放行", () => {
    expect(judgeChoice(PREWRITTEN_EPISODES[0], "A").correct).toBe(true);
  });
});

describe("splitBeats —— 按空行拆节拍", () => {
  it("空行分段", () => {
    expect(splitBeats("第一段。\n\n第二段。\n\n第三段。")).toEqual([
      "第一段。",
      "第二段。",
      "第三段。",
    ]);
  });

  it("单行内的换行不拆", () => {
    expect(splitBeats("上一行\n下一行")).toEqual(["上一行\n下一行"]);
  });

  it("多余空行和首尾空白被清掉", () => {
    expect(splitBeats("  甲  \n\n\n\n  乙  \n\n")).toEqual(["甲", "乙"]);
  });

  it("空字符串得到空数组", () => {
    expect(splitBeats("")).toEqual([]);
    expect(splitBeats("   \n\n  ")).toEqual([]);
  });
});

describe("节拍长度 —— 每一拍都不能长到播不动", () => {
  // 一拍 133 字会合成出 ~29 秒、586KB 的音频，要整包下完才出声，
  // 屏幕不动又没声音，看起来像卡死。拆开后每拍必须够短。
  it("全部预写剧集的每一拍都不超过 60 字", () => {
    const tooLong: string[] = [];
    for (const ep of PREWRITTEN_EPISODES) {
      const beats = [
        ...segmentsBefore(ep),
        ...splitBeats(ep.branchRight),
        ...splitBeats(ep.branchWrong),
        ...splitBeats(ep.hookText),
      ];
      for (const b of beats) {
        if (b.length > 60)
          tooLong.push(`第${ep.no}集 ${b.length}字: ${b.slice(0, 25)}…`);
      }
    }
    expect(tooLong).toEqual([]);
  });
});

describe("nextNodeToTeach", () => {
  it("全新用户 → 图谱第一个知识点", () => {
    expect(nextNodeToTeach([])).toBe("K1");
  });

  it("按顺序推进到还没考过的点", () => {
    // 听完前 5 集（K1 K3 K7 K5 K6 全部答对）→ 取图谱里第一个没覆盖的
    expect(nextNodeToTeach(heardAll(5))).toBe("K2");
  });

  it("答错过的知识点优先回炉", () => {
    const progress = [rec(1), rec(2), rec(3, false)]; // 第 3 集考 K7，答错
    expect(nextNodeToTeach(progress)).toBe("K7");
  });

  it("回炉答对后不再重复回炉", () => {
    const progress = [rec(1), rec(2), rec(3, false), rec(3, true)];
    expect(nextNodeToTeach(progress)).not.toBe("K7");
  });

  it("无题集（correct 为 null）不算答错", () => {
    const progress = [rec(1, null), rec(2, null)];
    expect(nextNodeToTeach(progress)).toBe("K2");
  });
});
