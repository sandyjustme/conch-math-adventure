/**
 * 朗读前的文本规整（纯函数）。
 *
 * 存在的原因：正文里的 −7 是**负号**，但 TTS 默认按运算符读成「减七」。
 * 这个产品教的就是负数，读错等于第一句就把概念教反了。
 *
 * 只改送去朗读的文本，**画面上仍然显示 −7** ——
 * 她需要认得这个数学符号，而听到的是它正确的读法。
 */

/**
 * 把负号 / 正号转成中文读法，运算符保持原样。
 *
 * 判据是符号前面那个字符：
 *   前面是数字 → 运算符（`5−3` 读「五减三」，正确，不动）
 *   否则       → 正负号（`−7` → 「负7」，`+5` → 「正5」）
 */
export function normalizeForSpeech(text: string): string {
  return text.replace(/[−\-+](?=\d)/g, (sign, offset: number) => {
    const prev = text[offset - 1] ?? "";
    if (/\d/.test(prev)) return sign; // 夹在数字中间 → 是运算符
    return sign === "+" ? "正" : "负";
  });
}
