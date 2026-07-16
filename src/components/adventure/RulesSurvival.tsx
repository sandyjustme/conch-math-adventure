import { useState } from "react";
import useStore from "../../store/useStore";
import Mascot from "../shared/Mascot";

/* ═══════════════════════════════════════════
   规则怪谈 · 咖啡馆午夜班
   ═══════════════════════════════════════════ */

interface Rule {
  id: number;
  text: string;
  hint: string; // 对应的数学道理（通关后揭晓）
  isFake: boolean;
}

const RULES: Rule[] = [
  {
    id: 1,
    text: "只有深度是负数的走廊可以通行——正数的门，推开就会被发现。",
    hint: "负数：海面以下的数。−1, −3, −8 都是负数，安全。",
    isFake: false,
  },
  {
    id: 2,
    text: "岔路口选绝对值更大的那条——越深海妖越听不见你的脚步声。",
    hint: "绝对值：离海面的距离，不看方向。|−6|=6 > |−2|=2。",
    isFake: false,
  },
  {
    id: 3,
    text: "两个门牌号相加得 0 的，是同一扇门的正反面——推开一面就能穿过。",
    hint: "相反数：+4 和 −4 互为相反数，相加为 0。",
    isFake: false,
  },
  {
    id: 4,
    text: "越往上的楼层越安全——永远优先往上走。",
    hint: '比大小：正数 > 负数。−1 楼比 −7 楼更"高"、更安全。',
    isFake: false,
  },
  {
    id: 5,
    text: "−2 比 −7 小，所以 −2 那条路更浅、走那条。",
    hint: '这是假的！负数比大小是反的：−2 > −7，−2 在上面。说 −2"更小"是错的。',
    isFake: true,
  },
];

interface Scenario {
  story: string;
  choices: string[];
  correct: number;
  explain: string;
}

const SCENARIOS: Scenario[] = [
  {
    story:
      "你站在 −3 层走廊。左边岔路通向 −2，右边通向 −6。脚步声从深处隐隐传来——你必须选一条路。",
    choices: [
      "走左边 −2（浅一点，可能更安全）",
      "走右边 −6（更深，但规则说…）",
    ],
    correct: 1,
    explain:
      "规则二：绝对值更大的更安全。|−6|=6 > |−2|=2，走 −6。海妖在浅处听得到。",
  },
  {
    story:
      "走廊尽头有两扇门：一扇标着 −7，一扇标着 +7。你注意到它们**相加正好是 0**。这扇门能通吗？",
    choices: ["能——它们是同一扇门的两面！", "不能——一个地上一个地下，肯定不通"],
    correct: 0,
    explain:
      "规则三：相加得 0 的是同一扇门。−7 和 +7 互为相反数，推开一面就能穿过。",
  },
  {
    story:
      "你面前有三扇门：标着 +2、−4、−1。你可以推开**一扇**。哪扇不会触发警报？",
    choices: [
      "+2（看上去最安全）",
      "−4（负数，负数都安全）",
      "−1（负数，而且很浅）",
    ],
    correct: 2,
    explain:
      '规则一：负数走廊才安全。+2 是正数，推开就暴露。−4 和 −1 都是负数，但 −1 最浅——结合规则四"越往上越安全"，选 −1。',
  },
  {
    story: "你需要逃到更高的地方。电梯按钮有：−5 楼、−1 楼、+3 楼。按哪个？",
    choices: [
      "−5 楼（数字最大，应该最高）",
      "−1 楼（负数里更靠上的）",
      "+3 楼（正数肯定最高）",
    ],
    correct: 2,
    explain:
      "规则四：越往上越安全，正数楼层在负数之上。+3 在 −1 之上，是最高的。",
  },
  {
    story:
      "墙上有一行警告：「−2 比 −7 小，所以 −2 那条路更浅、走那条。」——这是贴在墙上的规则。你要照做吗？",
    choices: ["照做——−2 确实更浅", "不照做——这条规则有问题！"],
    correct: 1,
    explain:
      '这是一条假规则！负数比大小和正数相反：−2 > −7，−2 确实在上面、确实更浅——但理由是 −2 比 −7 大，不是比它小。"−2 更小"的说法是错的。答案巧合地对了，但道理整个反了。',
  },
];

export default function RulesSurvival() {
  const setView = useStore((s) => s.setView);
  const addPearls = useStore((s) => s.addPearls);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const showToast = useStore((s) => s.showToast);

  const [step, setStep] = useState<"intro" | "scenario" | "final" | "done">(
    "intro"
  );
  const [scIdx, setScIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const scenario = SCENARIOS[scIdx];

  const choose = (idx: number) => {
    setPicked(idx);
    if (idx === scenario.correct) {
      setResult("correct");
      setCorrectCount((c) => c + 1);
      addPearls(1);
      addAnswerRecord({
        nodeId: "K7",
        correct: true,
        latencyMs: 0,
        timestamp: Date.now(),
      });
      showToast("pearl", 1);
    } else {
      setResult("wrong");
    }
  };

  const next = () => {
    setPicked(null);
    setResult(null);
    if (scIdx < SCENARIOS.length - 1) {
      setScIdx((i) => i + 1);
    } else {
      setStep("final");
    }
  };

  const retry = () => {
    setPicked(null);
    setResult(null);
  };

  const startGame = () => {
    setStep("scenario");
    setScIdx(0);
    setPicked(null);
    setResult(null);
    setCorrectCount(0);
  };

  return (
    <div
      className="min-h-screen font-body flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #0A0F14 0%, #121A24 40%, #1A2432 100%)",
      }}
    >
      {/* 头部 */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/30">
        <button
          onClick={() => setView("cafe")}
          className="text-white/60 text-sm font-bold px-3 py-1 rounded-full bg-white/8 hover:bg-white/15"
        >
          ← 回咖啡馆
        </button>
        <div className="flex items-center gap-2">
          <Mascot size={24} />
          <span className="font-display text-base text-amber-300/80">
            午夜班守则
          </span>
        </div>
        <div className="w-8" />
      </header>

      {/* ── 开场 ── */}
      {step === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">📜</div>
          <h2 className="font-display text-2xl text-amber-200 mb-3">
            咖啡馆午夜班
          </h2>
          <p className="text-white/55 text-sm leading-relaxed max-w-xs mb-6">
            夜深了，咖啡馆打烊。你准备离开时，发现吧台上压着一张泛黄的纸条——
            <br />
            <span className="text-amber-300/80">《夜班守则》</span>
            <br />
            <br />
            上面写着五条规则。有人说……不遵守规则的人，会被深海里的东西发现。
          </p>
          <p className="text-xs text-white/30 mb-6">
            一共 5 关 · 跟着规则走 · 活到天亮
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 rounded-full bg-amber-500/80 text-white font-bold text-sm hover:bg-amber-400/80 transition active:scale-95"
            aria-label="开始午夜守夜游戏"
          >
            点一盏灯，开始守夜 →
          </button>
        </div>
      )}

      {/* ── 规则栏（常驻） ── */}
      {(step === "scenario" || step === "final") && (
        <div className="px-4 pt-2 pb-1 flex-shrink-0">
          <div className="bg-white/4 border border-white/8 rounded-xl p-3 max-w-md md:max-w-lg mx-auto">
            <h3 className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">
              📜 夜班守则
            </h3>
            <div className="space-y-1">
              {RULES.map((r) => (
                <div
                  key={r.id}
                  className="text-xs text-white/55 leading-relaxed"
                >
                  <span className="text-amber-400/70 font-bold mr-1">
                    规则{r.id}
                  </span>
                  {r.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 场景 ── */}
      {step === "scenario" && scenario && (
        <div className="flex-1 flex flex-col px-4 py-4 max-w-md md:max-w-lg mx-auto w-full">
          <div className="text-xs text-white/20 mb-2">
            第 {scIdx + 1} / {SCENARIOS.length} 关
          </div>

          {/* 故事 */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-4">
            <p className="text-sm text-white/80 leading-relaxed">
              {scenario.story}
            </p>
          </div>

          {/* 选项 */}
          <div className="space-y-2.5 flex-1">
            {scenario.choices.map((c, i) => {
              let cls =
                "border-white/12 bg-white/5 text-white/70 hover:bg-white/10 hover:border-amber-400/40";
              if (picked !== null) {
                if (i === scenario.correct)
                  cls =
                    "border-emerald-400/40 bg-emerald-500/10 text-emerald-300";
                else if (i === picked)
                  cls = "border-red-400/40 bg-red-500/10 text-red-300";
                else cls = "border-white/5 bg-white/3 text-white/25";
              }
              return (
                <button
                  key={i}
                  disabled={picked !== null}
                  onClick={() => choose(i)}
                  className={`w-full text-left p-4 rounded-xl border text-sm leading-relaxed transition-all ${cls}`}
                  aria-label={`选择这个做法`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* 反馈 */}
          {result && (
            <div
              className={`mt-4 rounded-2xl p-4 text-center ${result === "correct" ? "bg-emerald-500/10 border border-emerald-400/20" : "bg-red-500/10 border border-red-400/20"}`}
            >
              <div className="text-lg font-bold mb-1">
                {result === "correct" ? "🕯️ 安全！" : "🌊 海妖发现了你…"}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {scenario.explain}
              </p>
              <div className="mt-3 flex gap-2 justify-center">
                {result === "wrong" && (
                  <button
                    onClick={retry}
                    className="px-5 py-2 rounded-full bg-white/10 text-white/60 text-xs font-bold hover:bg-white/20"
                    aria-label="重新回答这一关"
                  >
                    再试一次
                  </button>
                )}
                {result === "correct" && (
                  <button
                    onClick={next}
                    className="px-5 py-2 rounded-full bg-amber-500/80 text-white text-xs font-bold hover:bg-amber-400/80"
                    aria-label="下一关"
                  >
                    {scIdx < SCENARIOS.length - 1
                      ? "继续前行 →"
                      : "面对最后的考验 →"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 最终考验：找假规则 ── */}
      {step === "final" && (
        <div className="flex-1 flex flex-col px-4 py-4 max-w-md md:max-w-lg mx-auto w-full">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-display text-xl text-amber-200 mb-1">
              最后的考验
            </h3>
            <p className="text-xs text-white/45">
              五条规则里，有一条是假的。找出它。
            </p>
          </div>
          <div className="space-y-2.5 flex-1">
            {RULES.map((r) => (
              <button
                aria-label={`选择规则${r.id}，如果这条是假的就能破关`}
                key={r.id}
                onClick={() => {
                  if (r.isFake) {
                    setStep("done");
                    addPearls(3);
                    addAnswerRecord({
                      nodeId: "K7",
                      correct: true,
                      latencyMs: 0,
                      timestamp: Date.now(),
                    });
                    showToast("pearl", 3);
                  } else {
                    setResult("wrong");
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border text-sm leading-relaxed transition-all ${
                  result === "wrong"
                    ? "border-white/5 bg-white/3 text-white/25"
                    : "border-white/12 bg-white/5 text-white/70 hover:bg-white/10 hover:border-amber-400/40"
                }`}
              >
                <span className="text-amber-400/70 font-bold mr-1">
                  规则{r.id}
                </span>
                {r.text}
              </button>
            ))}
          </div>
          {result === "wrong" && (
            <div className="mt-3 bg-red-500/10 border border-red-400/20 rounded-2xl p-3 text-center">
              <p className="text-sm text-white/50">
                这条是真的——再找找那条"听起来对但其实是错的"。
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 通关 ── */}
      {step === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">🌅</div>
          <h2 className="font-display text-2xl text-amber-200 mb-3">
            天亮了。
          </h2>
          <p className="text-white/55 text-sm leading-relaxed max-w-xs mb-2">
            你成功守过了午夜班。假规则是
            <span className="text-red-300 font-bold"> 规则 5</span>——"−2 比 −7
            小"是错的。
          </p>
          <p className="text-xs text-white/30 mb-6">
            负数比大小是反过来的：越深数字越小。−2 在上面，比 −7 大。
          </p>
          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-full bg-white/10 text-white/60 text-sm font-bold hover:bg-white/20"
              aria-label="再玩一遍午夜守夜"
            >
              再守一夜
            </button>
            <button
              onClick={() => setView("cafe")}
              className="px-6 py-3 rounded-full bg-amber-500/80 text-white text-sm font-bold hover:bg-amber-400/80"
              aria-label="返回咖啡馆大厅"
            >
              回咖啡馆 ☕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
