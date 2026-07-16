import { useEffect, useMemo, useRef, useState } from "react";
import useStore from "../../store/useStore";
import {
  sendChatMessage,
  parseRewardTag,
  cleanTags,
  reskinSoup,
} from "../../services/ai";
import {
  isSTTSupported,
  startListening,
  stopListening,
} from "../../services/stt";
import Mascot from "../shared/Mascot";

/**
 * 海龟汤 —— 海螺咖啡馆的隐藏菜单。
 * 汤面是纯生活故事（零数字、零数学词），数学藏在世界规则里；
 * 孩子问是非题破案，破案那一刻才发现"原来是这么回事"。用好奇心，不是考试。
 */

interface Soup {
  id: string;
  node: string; // 藏的知识点（用于按进度推荐）
  name: string;
  emoji: string;
  difficulty: 1 | 2 | 3; // 星级
  surface: string; // 汤面：纯故事，零数字零术语
  truth: string; // 汤底：破案后才由海小喵讲出
  judge: string; // 破案判定：命中这个核心才算破案
}

const SOUPS: Soup[] = [
  {
    id: "s1",
    node: "K7",
    name: "潜水英雄榜",
    emoji: "🏆",
    difficulty: 2,
    surface:
      "深海餐厅墙上挂着一块「潜水英雄榜」，谁潜得最深谁排前面。今天更新后，一个新来的女孩排到了最前面——可她挂上去的牌子，是全榜看起来最小、最不起眼的一块。老顾客们全都服气地点头。为什么最小的那块牌子，代表她去过最深的地方？",
    truth:
      "深度是从海面往下算的，越往下越是负数、牌子上的数越小。女孩去的地方最深，她那块牌子上的数字自然最小。榜是按数字从小往大排的，所以最小的排最前面。负数正好和平时反过来——越深越小。",
    judge: "孩子领悟到「往下是负数、越深数字反而越小」。",
  },
  {
    id: "s2",
    node: "K5",
    name: "偷偷摸摸的存钱罐",
    emoji: "🐷",
    difficulty: 3,
    surface:
      "哥哥每天往存钱罐里放一样多的钱，弟弟每天趁没人偷偷拿走一样多的钱，俩人谁也不知道对方在干嘛。月底妈妈打开罐子，愣了一下，笑着说：「你俩加起来，等于谁都没碰过它。」一个天天放、一个天天拿，怎么会像没人动过？",
    truth:
      "哥哥放进去的算「正」，弟弟拿走的算「负」，而且每天一样多、方向正好相反——这就是一对相反数。相反数加起来是 0，一天天全抵消掉，罐子里跟一开始一模一样。",
    judge:
      "孩子领悟到「一个放一个拿、一样多方向相反，正好抵消成 0」（相反数相加为 0）。",
  },
  {
    id: "s3",
    node: "K6",
    name: "灯塔看守人",
    emoji: "🗼",
    difficulty: 2,
    surface:
      "海边灯塔正立在海面上，看守人就站在灯塔和海面相接的地方。一只海鸟停在塔顶，一条鱼躲在灯塔正下方的礁石缝里。看守人抬头看看鸟、低头看看鱼，说：「你俩离我一样近。」一个在天上、一个在海里，明明一上一下，怎么会一样近？",
    truth:
      "看守人站在海面上。海鸟在海面上方，鱼在海面下方，方向相反，可它们离海面的距离一样远，所以离看守人一样近。只看距离、不看上下——这就是绝对值。",
    judge:
      "孩子领悟到「一个在上一个在下，但离海面的距离一样，所以一样近」（绝对值只看距离）。",
  },
  {
    id: "s4",
    node: "K3",
    name: "站在头顶的矮个子",
    emoji: "🛗",
    difficulty: 2,
    surface:
      "海边一栋大楼里，两个人赛跑，看谁能到「最高的地方」。矮个子按了个小小的数，高个子得意地按了个大得多的数。电梯门一开，矮个子却稳稳站在高个子的头顶上方。为什么按了大数的人，反而在下面？",
    truth:
      "高个子按的是地下车库那一层，是负的、在地面以下。那个数看着大，可它带着负号，越往地下越低。矮个子按的是地上的楼层，是正的，所以站在上面。负数再大，也在地面以下。",
    judge:
      "孩子领悟到「那个大数是地下层、是负的，所以在下面」（负数都在 0 以下）。",
  },
  {
    id: "s5",
    node: "K1",
    name: "什么都没拿到的冠军",
    emoji: "🎖️",
    difficulty: 3,
    surface:
      "潜水俱乐部年终发两块金牌——「潜得最深」一块，「升得最高」一块。有个人两块都没拿到，全场却起立为他鼓掌，说他「最难得」。他既不是最深、也不是最高，凭什么最难得？",
    truth:
      "他把自己精准停在了正好海面的位置——不深不浅、不上不下。海面这个位置最特殊：它既不朝下、也不朝上，是上和下的分界线。冲到最深最高靠一股猛劲，稳稳卡在正中间那个点反而最难。",
    judge:
      "孩子领悟到「他停在正中间的海面，那个既不朝上也不朝下的特殊位置」（0 既不正也不负）。",
  },
];

function stars(n: number) {
  return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n);
}

function soupSystemPrompt(soup: Soup): string {
  return `你是「海螺咖啡馆」的海小喵🐚，正陪一个初一学生玩海龟汤（情境推理）。你已经知道谜底，学生要靠问「是非题」来猜。

【这碗汤】
汤面：${soup.surface}
汤底（只有你知道，绝对不能主动说出来）：${soup.truth}
破案判定：${soup.judge}

【铁规矩——必须一字不差地严格执行】
1. 学生每问一句，你只许回下面四种之一，一个多余的字都不许加：
   「是」 / 「不是」 / 「无关」 / 「这不是是非题哦，换成『是不是…』来问我」
2. 绝不鼓励、绝不提示、绝不评价。禁止说「好问题」「接近了」「再想想」「不错哦」之类任何多余的话。
3. 唯一的例外：当学生说出的想法**命中了破案判定的核心**，你必须**在这一条回复里立刻宣布破案，绝不能等他再问、再提醒、或再确认一次**。这条回复必须**以「🎉 你破案了！」开头**，接着用两三句大白话把汤底讲清楚、自然点出背后的数学道理（别说教），最后另起一行追加隐藏标记 <!--REWARD:2--> 和 <!--SOLVED-->（前端会隐藏，绝不能告诉学生有这标记）。
4. 只有真正命中核心才算破案。只是沾边、方向对但没说到点子上，仍然只回「是 / 不是 / 无关」，绝不提前揭晓，也绝不说「破案」二字。
5. 全程中文，句子越短越好。`;
}

export default function SoupKitchen() {
  const setView = useStore((s) => s.setView);
  const addPearls = useStore((s) => s.addPearls);
  const showToast = useStore((s) => s.showToast);
  const currentNodeId = useStore((s) => s.currentNodeId);

  const [soup, setSoup] = useState<Soup | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reskinning, setReskinning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 按孩子当前诊断到的知识点，把对应的汤排到最前并标「推荐」
  const menu = useMemo(() => {
    const rec = SOUPS.filter((s) => s.node === currentNodeId);
    const rest = SOUPS.filter((s) => s.node !== currentNodeId);
    return [...rec, ...rest];
  }, [currentNodeId]);

  useEffect(() => () => stopListening(), []);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const orderSoup = (s: Soup) => {
    setSoup(s);
    setSolved(false);
    setRevealed(false);
    setInput("");
    setMessages([
      {
        role: "assistant",
        text: `（端上一碗热气腾腾的「${s.name}」${s.emoji}）\n\n${s.surface}\n\n问我「是不是…？」，我只答 是 / 不是 / 无关。想通了就直接说出来！`,
      },
    ]);
  };

  const orderSpecial = async () => {
    setReskinning(true);
    const template = SOUPS[Math.floor(Math.random() * SOUPS.length)];
    const fresh = await reskinSoup({
      surface: template.surface,
      truth: template.truth,
      judge: template.judge,
    });
    const customSoup: Soup = {
      id: "special",
      node: template.node,
      name: fresh.name || "今日特调",
      emoji: "🎲",
      difficulty: template.difficulty,
      surface: fresh.surface,
      truth: fresh.truth,
      judge: fresh.judge,
    };
    setReskinning(false);
    orderSoup(customSoup);
  };

  const backToMenu = () => {
    stopListening();
    setListening(false);
    setSoup(null);
  };

  const toggleMic = () => {
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    if (!isSTTSupported()) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "这个浏览器还不支持语音哦～用 Chrome 打开，就能对我说话啦！",
        },
      ]);
      return;
    }
    const ok = startListening(
      "zh-CN",
      (text) => setInput(text),
      () => setListening(false)
    );
    if (ok) setListening(true);
  };

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || solved || !soup) return;
    const nm = [...messages, { role: "user" as const, text: msg }];
    setMessages(nm);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendChatMessage(nm, soupSystemPrompt(soup));
      const gained = parseRewardTag(reply);
      // 双保险：认隐藏标记，也认「破案了」这句可见的话——严格主持下没破案时绝不会出现「破案」二字
      const isSolved =
        reply.includes("<!--SOLVED-->") || /破案了|破案啦/.test(reply);
      const clean = cleanTags(reply).replace("<!--SOLVED-->", "").trim();
      setMessages([
        ...nm,
        { role: "assistant", text: clean || "（想一想，换成「是不是…」问我）" },
      ]);
      // 命中破案但模型漏了奖励标记时，兜底给 2 颗珍珠
      const reward = gained > 0 ? gained : isSolved ? 2 : 0;
      if (reward > 0) {
        addPearls(reward);
        showToast("pearl", reward);
      }
      if (isSolved) setSolved(true);
    } catch (e) {
      console.error("SoupKitchen send failed:", e);
      setMessages([
        ...nm,
        { role: "assistant", text: "网络开小差了，再问一次～" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ===== 菜单视图 =====
  if (!soup) {
    return (
      <div
        className="min-h-screen w-full font-body"
        style={{
          background: "linear-gradient(180deg,#1B4B5A 0%,#0B2E3A 100%)",
        }}
      >
        <div className="max-w-md md:max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setView("cafe")}
              className="text-white/90 text-sm font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
            >
              ← 回咖啡馆
            </button>
            <span className="text-xs text-white/50">隐藏菜单</span>
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🐢🍲</div>
            <h1 className="font-display text-3xl text-amber-200">海龟汤</h1>
            <p className="text-xs text-white/60 mt-1">
              点一碗汤，海小喵给你一道谜题。只问「是不是」，喝完就破案。
            </p>
            <button
              onClick={orderSpecial}
              disabled={reskinning}
              className="mt-3 px-5 py-2.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-sm font-bold hover:bg-amber-500/30 transition disabled:opacity-40"
            >
              {reskinning
                ? "🎲 海小喵在熬汤…"
                : "🎲 今日特调（AI现熬一碗新汤）"}
            </button>
          </div>

          <div className="space-y-3">
            {menu.map((s) => {
              const isRec = s.node === currentNodeId;
              return (
                <button
                  key={s.id}
                  onClick={() => orderSoup(s)}
                  className="w-full flex items-center gap-3 border border-white/15 rounded-2xl p-4 text-left transition hover:bg-white/15"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="text-3xl">{s.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-100">{s.name}</span>
                      {isRec && (
                        <span className="text-[10px] bg-amber-400 text-slate-900 rounded-full px-2 py-0.5 font-bold">
                          推荐给你
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      招牌里藏着一个秘密…{" "}
                      <span className="text-amber-300/70">
                        {stars(s.difficulty)}
                      </span>
                    </div>
                  </div>
                  <div className="text-white/40 text-sm">点单 →</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===== 谜题视图 =====
  return (
    <div
      className="min-h-screen w-full flex flex-col font-body"
      style={{ background: "linear-gradient(180deg,#1B4B5A 0%,#0B2E3A 100%)" }}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <button
          onClick={backToMenu}
          className="text-white/90 text-sm font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
        >
          ← 换一碗
        </button>
        <div className="flex items-center gap-2">
          <Mascot size={26} />
          <span className="font-display text-lg text-amber-200">
            {soup.name}
          </span>
        </div>
        <button
          onClick={() => setView("cafe")}
          className="text-white/70 text-xl"
        >
          🏠
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-3 space-y-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && <Mascot size={26} />}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-teal-500 text-white rounded-br-md"
                  : "bg-amber-50 text-slate-800 rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <Mascot size={26} />
            <div className="bg-amber-50 text-slate-500 px-4 py-2.5 rounded-2xl text-sm">
              海小喵尝了一口汤…
            </div>
          </div>
        )}

        {(solved || revealed) && (
          <div className="bg-amber-100 rounded-2xl p-4 mt-2 shadow">
            <div className="font-bold text-shell-dark mb-1">
              {solved ? "🎉 你破案啦！汤底是——" : "🥄 汤底揭晓——"}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {soup.truth}
            </p>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {solved || revealed ? (
          <div className="flex gap-2">
            <button
              onClick={backToMenu}
              className="flex-1 py-3 rounded-full bg-amber-400 text-white text-sm font-bold hover:bg-amber-500"
            >
              🍲 再来一碗
            </button>
            <button
              onClick={() => setView("cafe")}
              className="flex-1 py-3 rounded-full bg-white/15 text-white text-sm font-bold hover:bg-white/25"
            >
              回咖啡馆
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={toggleMic}
                className={`px-4 py-3 rounded-full text-sm font-bold transition ${
                  listening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-teal-500 text-white hover:bg-teal-600"
                }`}
                title="说话提问"
              >
                {listening ? "🔴" : "🎤"}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="问「是不是…？」或说出你的答案"
                className="flex-1 px-4 py-3 rounded-full border-2 border-white/20 bg-white/90 text-[15px] outline-none focus:ring-2 focus:ring-teal-300"
              />
              <button
                onClick={() => send()}
                disabled={loading}
                className="px-5 py-3 rounded-full bg-teal-600 text-white text-sm font-bold disabled:opacity-50"
              >
                问
              </button>
            </div>
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-2 rounded-full bg-white/10 text-white/60 text-xs hover:bg-white/20"
            >
              💡 想不出来了，揭晓汤底
            </button>
          </>
        )}
      </div>
    </div>
  );
}
