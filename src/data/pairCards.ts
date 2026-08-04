/**
 * 沉船翻牌的卡组生成（纯函数）。
 *
 * 玩法：12 张牌 6 对，**两张算式的值相等才配对**（3+4 ↔ 9−2）。
 * 数学内嵌在玩法里：每翻一张都得算出它的值才记得住 —— 不算就玩不了，
 * 但没有人在考她（记忆配对是她拼图人格的同一种快感：翻找、记忆、收齐）。
 *
 * 硬约束：
 *   · 6 个目标值互不相同 —— 否则跨对也能配上，判定就乱了
 *   · 同对的两条算式文本不同 —— 一模一样就不用算了
 *   · 所有操作数落在 −9..9，先定结果再反推，不会越界
 */

export interface PairCard {
  /** 稳定 id（洗牌后仍可追踪） */
  id: number;
  text: string;
  value: number;
}

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** 规范化显示：a + (-3) 写成 a−3，a − (-3) 写成 a+3 */
function fmtAdd(a: number, b: number): string {
  return b >= 0 ? `${a}+${b}` : `${a}-${-b}`;
}
function fmtSub(a: number, b: number): string {
  return b >= 0 ? `${a}-${b}` : `${a}+${-b}`;
}

/** 给值 v 造一条加法式（先定结果再反推，界内保证） */
function addExprFor(v: number): string {
  const a = randInt(Math.max(-9, v - 9), Math.min(9, v + 9));
  return fmtAdd(a, v - a);
}
/** 给值 v 造一条减法式 */
function subExprFor(v: number): string {
  const c = randInt(Math.max(-9, v - 9), Math.min(9, v + 9));
  return fmtSub(c, c - v);
}

/**
 * 生成一副牌：pairs 对（默认 6），洗好序。
 * 两条式子撞了文本就重造，最多重试若干次后强制用「v+0 / v-0」兜底
 * ——兜底几乎不会走到，但生成器绝不能有失败路径。
 */
export function makePairCards(pairs = 6): PairCard[] {
  // 6 个互不相同的值，避开 0（0 的算式太容易一眼看穿）
  const values: number[] = [];
  while (values.length < pairs) {
    const v = randInt(-9, 9);
    if (v !== 0 && !values.includes(v)) values.push(v);
  }

  const cards: PairCard[] = [];
  let id = 0;
  for (const v of values) {
    let t1 = addExprFor(v);
    let t2 = subExprFor(v);
    for (let retry = 0; t1 === t2 && retry < 20; retry++) {
      t2 = subExprFor(v);
    }
    if (t1 === t2) {
      t1 = fmtAdd(v, 0);
      t2 = fmtSub(v, 0);
    }
    cards.push({ id: id++, text: t1, value: v });
    cards.push({ id: id++, text: t2, value: v });
  }

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** 只用于测试与校验：解析 "a±b" 求值 */
export function evalCardText(text: string): number | null {
  const m = text.match(/^(-?\d+)([+-])(\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return m[2] === "+" ? a + b : a - b;
}
