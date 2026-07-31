import { PREWRITTEN_EPISODES, type Episode } from "../data/dramaWorld";

/**
 * 剧集数据校验 —— 强制 dramaWorld.ts 顶部那五条设计铁律。
 * 同一套规则也用于 AI 生成集的程序化二次校验（services/ai.ts 调 validateEpisode）。
 */

/** 题面里出现即作废的数学术语 */
const MATH_TERMS =
  /负数|正数|绝对值|相反数|比大小|数轴|有理数|加法|减法|乘法|除法|运算/;

/** 出题口吻，出现即作废（题必须是主角的决定，不是旁白提问） */
const QUIZ_TONE = /请问|计算|答案是|等于多少|下列|正确的是/;

/** 去掉标点和空白后判断是不是纯数字（选项不许是裸数字） */
function isBareNumber(s: string): boolean {
  const stripped = s.replace(/[「」""''。，、．.\s()（）]/g, "");
  return /^[−\-+]?\d+$/.test(stripped);
}

export function validateEpisode(ep: Episode): string[] {
  const errors: string[] = [];
  const label = `第 ${ep.no} 集「${ep.title}」`;

  if (!ep.openText.trim()) errors.push(`${label}: openText 为空`);
  if (!ep.bodyText.trim()) errors.push(`${label}: bodyText 为空`);

  // 铁律 5：一集只考一个知识点
  if (ep.choice && !ep.nodeId) {
    errors.push(`${label}: 有题但没标 nodeId`);
  }

  // 铁律 2：题面不许出现数学术语
  const surface = [ep.openText, ep.bodyText, ep.choice?.prompt ?? ""].join(
    "\n"
  );
  const term = surface.match(MATH_TERMS);
  if (term) errors.push(`${label}: 题面出现数学术语「${term[0]}」`);

  if (ep.choice) {
    // 铁律 1：题是主角的决定，不是旁白提问
    const tone = ep.choice.prompt.match(QUIZ_TONE);
    if (tone) errors.push(`${label}: choice.prompt 出现出题口吻「${tone[0]}」`);

    // 铁律 3：选项必须是剧情动作，不能是裸数字
    for (const [key, opt] of [
      ["optionA", ep.choice.optionA],
      ["optionB", ep.choice.optionB],
    ] as const) {
      if (!opt.trim()) errors.push(`${label}: ${key} 为空`);
      else if (isBareNumber(opt))
        errors.push(`${label}: ${key}「${opt}」是裸数字，必须是剧情动作`);
    }

    if (ep.choice.correct !== "A" && ep.choice.correct !== "B") {
      errors.push(`${label}: correct 必须是 "A" 或 "B"`);
    }

    // 铁律 4：答错不阻断，错误分支必须继续推进剧情
    if (!ep.branchRight.trim()) errors.push(`${label}: branchRight 为空`);
    if (!ep.branchWrong.trim())
      errors.push(`${label}: branchWrong 为空 —— 答错绝不允许阻断`);
  }

  // 钩子必须存在，且不能以句号收尾（要吊着）
  if (!ep.hookText.trim()) {
    errors.push(`${label}: hookText 为空 —— 每集必须留钩子`);
  } else if (/。\s*$/.test(ep.hookText)) {
    errors.push(`${label}: hookText 以句号结尾 —— 钩子不能收`);
  }

  return errors;
}

export function validateDrama(episodes: Episode[] = PREWRITTEN_EPISODES): {
  valid: boolean;
  errors: string[];
} {
  const errors = episodes.flatMap(validateEpisode);

  // 集号必须唯一且连续
  const nos = episodes.map((e) => e.no).sort((a, b) => a - b);
  nos.forEach((n, i) => {
    if (n !== i + 1) errors.push(`集号不连续：第 ${i + 1} 位是 ${n}`);
  });

  return { valid: errors.length === 0, errors };
}

export function runDramaValidation(): void {
  const result = validateDrama();
  if (!result.valid) {
    console.error("剧集数据验证失败:", result.errors);
  }
}
