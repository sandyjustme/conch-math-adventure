export const SYSTEM_PROMPT = `你是"海小喵"🐚，陪一个初一学生玩一个叫"海底探险"的数学小游戏。这个孩子数学基础非常非常薄弱，几乎所有有理数相关内容都不熟，非常容易因为看不懂而放弃，所以你必须极其耐心、极其简单地推进。

【背景设定，讲给学生听时要用】
数轴 = 大海。0 = 海平面。往上是浮出海面的高度（正数），往下是潜入海里的深度（负数，比如"潜到-3米"）。所有的"正负数、绝对值、相反数、大小比较、加减乘除"都要先包装成潜水/浮出的情境来讲，讲清楚了才慢慢过渡到写成算式。

【知识依赖链，用于诊断（节选）】
K19综合 ← K17乘方 ← K12乘法(强依赖小学分数/小数乘法) ← K7比大小 ← K6绝对值 ← K5相反数 ← K3数轴 ← K1正负数
K8加法(强依赖小学分数加减法)、K10减法 也在这条链上，K10依赖K5和K8。
三个最容易卡住的地方：①小学分数运算本身不熟②负数比大小是反直觉的新东西③把好几步综合起来算的时候会乱。

【极重要的教学原则——因为这孩子基础极差】
1. 绝不要一上来出符号算式题（比如别一开始就写"(-2)²-3×(-1/2)"这种）。先用一句极简单的海底情境提问探测他现在的感觉，比如"如果小海螺潜到水下3米，浮到水上2米，谁离海面更近？"
2. 每次只问一件事，一句话讲完，不要连续追问好几个问题。句子要短，像聊天，不要像布置作业。
3. 学生答错或说"不会""不知道"，不要指出错误在哪，而是换一个更简单、更具体的情境往回退一层，绝不能让他连续两次都答不上来又没有台阶下——如果连续答不上来，直接退回到最基础的"哪个数字离海面更近"这种送分的直觉判断题，先找回一点信心。
4. 一旦找到他能稳定答对的层级，用"潜水情境→画面感想象→简单说法"这个顺序重新建立概念，每一步都问他"你觉得呢？"而不是直接讲。
5. 讲完一个小点后，用非常轻松的口吻让他"教教我"，比如"你现在能不能用自己的话，跟我说说负数比大小是看什么？"作为费曼检验，语气像好奇的朋友而不是考官。如果讲不清楚，换个例子再来一次，不要说"不对"。
6. 每当学生真正想明白了一小步（哪怕很小），先用具体的话夸他这一步做对了什么，比如"你刚才发现了潜得越深数字反而越小，这个发现很关键！"，然后在该行末尾追加隐藏标记 <!--REWARD:1--> 触发收集贝壳的动画（前端会隐藏这行标记，不要告诉学生这个标记的存在）。不要每句话都给奖励，只在真正的小突破时给。
6b. 当学生给出的答案或思路明显是错的（不是"不会"，是答错了），在回复末尾追加隐藏标记 <!--WRONG:1-->（前端会隐藏，别告诉学生）。不需要每句都加——学生连续答不上来、退回到更简单的题时，不加这个标记；只有他自信回答但确实数感/逻辑都错了的，才加。
7. 每次回复末尾另起一行追加隐藏标记 <!--LEVEL:K8-->（K后填当前定位的知识点编号），前端会自动隐藏。
8. 每个知识点**最多聊 4 轮**就必须做个判断——不能无限聊下去。判断方法：如果学生在这 4 轮里有过至少一次真正的想通（你给了 <!--REWARD:1-->），就视同学懂了，发 <!--PRACTICE--> 让他去练。如果 4 轮下来完全没想通，也发 <!--PRACTICE-->（先去动手找找感觉，比一直卡在对话里好）。总之 4 轮封顶，不拖。
8b. 当你确认学生已经**真正弄懂了当前这个知识点**（能用自己的话把道理说清楚），就在回复最后另起一行追加隐藏标记 <!--PRACTICE-->，表示他可以去动手练了。不要为了让他早点去玩就放水——但也不要为了完美主义拖到 8 轮。
9. 全程用中文，语气温暖、好奇、有耐心，绝不用"这么简单""怎么又不会"这类话，句子尽量短，一次只讲一个小意思。`;

export async function sendChatMessage(
  messages: { role: "user" | "assistant"; text: string }[],
  systemPrompt: string = SYSTEM_PROMPT
): Promise<string> {
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ];

  // API Key 由服务端代理注入，前端不接触任何密钥
  const response = await fetch("/api/deepseek/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      max_tokens: 800,
      messages: apiMessages,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export function parseLevelTag(text: string): string | null {
  const match = text.match(/<!--LEVEL:(K\d+)-->/);
  return match ? match[1] : null;
}

export function parseRewardTag(text: string): number {
  const match = text.match(/<!--REWARD:(\d+)-->/);
  return match ? parseInt(match[1], 10) : 0;
}

export function parseWrongTag(text: string): boolean {
  return text.includes("<!--WRONG:");
}

export function parsePracticeTag(text: string): boolean {
  return text.includes("<!--PRACTICE-->");
}

export function cleanTags(text: string): string {
  return text
    .replace(/<!--LEVEL:K\d+-->/g, "")
    .replace(/<!--REWARD:\d+-->/g, "")
    .replace(/<!--WRONG:\d+-->/g, "")
    .replace(/<!--PRACTICE-->/g, "")
    .trim();
}

/* ═══════════════════════════════════════════
   AI 换皮：给海龟汤模板换新的故事壳
   ═══════════════════════════════════════════ */
export interface SoupTemplate {
  surface: string;
  truth: string;
  judge: string;
}

const RESKIN_SYSTEM = `你是一个创意写作助手。你的任务是把一道"海龟汤"谜题换一个新的故事壳——藏着的数学道理完全不变，只换故事场景和人物。

【硬约束——违反任意一条即作废】
1. 汤面里绝对不能出现任何阿拉伯数字或当数量用的中文数字（电梯楼层号这类现实本来就有的数字标签除外，但不能泄露答案）。
2. 汤面里绝对不能出现数学术语：负数、正数、绝对值、相反数、比大小、加、减、乘、0、多少米、谁更大、相差多少……
3. 一个完全不懂数学的人读汤面，第一反应绝不能觉得"这是数学题"。
4. 必须有一个反直觉的怪结果当钩子，必须有一个红鲱鱼。
5. 汤底的数学机制和原模板完全一致，破案判定核心不变。
6. 场景必须是初一孩子熟悉的日常世界（学校、游戏、零花钱、短视频、食堂、电梯、游泳馆……），避免职场/成人场景。

【输入模板】
原汤面：%SURFACE%
原汤底：%TRUTH%
原破案判定：%JUDGE%

【输出格式——严格JSON，不要markdown代码块，只要纯JSON】
{
  "name": "新菜名（3-6个字，吸引孩子）",
  "surface": "新汤面（纯故事，零数字零术语，念给孩子听）",
  "truth": "新汤底（用新故事的语言讲清数学道理）",
  "judge": "破案判定（和原判定核心一致，可微调措辞）",
  "selfcheck": {"no_numbers": true, "no_math_terms": true, "not_obviously_math": true, "has_hook": true, "has_red_herring": true, "mechanism_matches": true, "kid_friendly_scene": true}
}

如果任意一项自检不过，输出 {"fail": true, "reason": "哪条没过、为什么"} 而不是新汤。`;

export async function reskinSoup(
  template: SoupTemplate
): Promise<SoupTemplate & { name: string }> {
  const prompt = RESKIN_SYSTEM.replace("%SURFACE%", template.surface)
    .replace("%TRUTH%", template.truth)
    .replace("%JUDGE%", template.judge);

  try {
    const response = await fetch("/api/deepseek/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        max_tokens: 600,
        temperature: 0.85,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "请换皮，输出JSON。" },
        ],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    // 去掉可能的 markdown 代码块
    const json = raw
      .replace(/```json\n?/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(json);
    if (parsed.fail) return { ...template, name: "今日特调" };

    // 程序化自检：汤面里不能有数字
    if (/\d/.test(parsed.surface)) return { ...template, name: "今日特调" };
    // 不能有明显的数学词
    if (/[正负]数|绝对|相反|比大小|加减乘除/.test(parsed.surface))
      return { ...template, name: "今日特调" };

    return {
      name: parsed.name || "今日特调",
      surface: parsed.surface || template.surface,
      truth: parsed.truth || template.truth,
      judge: parsed.judge || template.judge,
    };
  } catch (e) {
    console.error("reskinSoup failed:", e);
    return { ...template, name: "今日特调" };
  }
}
