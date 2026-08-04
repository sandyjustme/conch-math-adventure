import { useState, useEffect } from "react";
import useStore from "../../store/useStore";
import { generateRuleQuestions } from "../../data/rulesQuestions";
import { computeRoundReward } from "../../engine/fractionEngine";
import { flushPersistence } from "../../hooks/usePersistence";
import { speakQuestion } from "../../services/tts";
import Mascot from "../shared/Mascot";

/* ═══════════════════════════════════════════
   规则怪谈 · 数学密室逃脱
   题目动态生成，按学生水平自适应
   ═══════════════════════════════════════════ */

export default function RulesSurvival() {
  const setView = useStore((s) => s.setView);
  const addPlayTokens = useStore((s) => s.addPlayTokens);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);
  const showToast = useStore((s) => s.showToast);
  const currentNodeId = useStore((s) => s.currentNodeId);
  const answerRecords = useStore((s) => s.answerRecords);
  const ttsEnabled = useStore((s) => s.ttsEnabled);

  const [step, setStep] = useState<"intro" | "scenario" | "final">("intro");
  const [scIdx, setScIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightHint, setHighlightHint] = useState(false);

  /**
   * 题目跟着她的真实进度走：分数还断着就练断点那一层，过关了才上有理数。
   *
   * 原来这里用 expressionGenerator 生成，只有三个模板、全是「谁更大」，
   * 而且第 5 题的选项被写死成 ["对","错"]、正确答案却仍按 a>b 判 ——
   * 每一轮的最后一题都是道废题，点哪个全看运气。
   */
  const [scenarios] = useState(() =>
    generateRuleQuestions(answerRecords, currentNodeId, 5)
  );

  const scenario = scenarios[scIdx];

  // 进场自动朗读 + 选项延迟
  useEffect(() => {
    if (step === "scenario" && scenario && ttsEnabled) {
      speakQuestion(scenario.story);
      const t = setTimeout(() => setShowOptions(true), 2500);
      return () => clearTimeout(t);
    }
    if (step === "scenario" && scenario && !ttsEnabled) {
      setShowOptions(true);
    }
  }, [step, scIdx, scenario?.story]); // eslint-disable-line react-hooks/exhaustive-deps

  // 重置选项延迟
  useEffect(() => {
    setShowOptions(false);
    setHighlightHint(false);
  }, [scIdx]);

  const choose = (idx: number) => {
    if (!showOptions) return;
    setPicked(idx);
    if (idx === scenario.correct) {
      setResult("correct");
      setCorrectCount((c) => c + 1);
      // 不再每答对一题就发珍珠 —— 那正是「一天傻点赚 1000 多珍珠」的口子。
      // 改成整轮结束时一次结算，跟刻线用同一套奖励规则。
      addAnswerRecord({
        nodeId: scenario.nodeId,
        correct: true,
        latencyMs: 0,
        timestamp: Date.now(),
      });
      showToast("pearl", 1);
    } else {
      setResult("wrong");
      setHighlightHint(true);
      setShowOptions(false);
      addAnswerRecord({
        nodeId: scenario.nodeId,
        correct: false,
        latencyMs: 0,
        timestamp: Date.now(),
      });
    }
  };

  const next = () => {
    setPicked(null);
    setResult(null);
    if (scIdx < scenarios.length - 1) {
      setScIdx((i) => i + 1);
      return;
    }
    // 整轮结算：做了就有，做对更多，绝不归零（与刻线同一套规则）
    const reward = computeRoundReward(correctCount, scenarios.length);
    /* v4 单水龙头：珍珠与碎片只从「今天的活儿」来，此处停发 */
    addPlayTokens(reward.playTokens);
    flushPersistence();
    setStep("final");
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
              📜 密室规则
            </h3>
            <div className="text-xs text-white/55 leading-relaxed">
              每题只有一次机会，选错直接看答案。
            </div>
          </div>
        </div>
      )}

      {/* ── 场景 ── */}
      {step === "scenario" && scenario && (
        <div className="flex-1 flex flex-col px-4 py-4 max-w-md md:max-w-lg mx-auto w-full">
          <div className="text-xs text-white/20 mb-2">
            第 {scIdx + 1} / {scenarios.length} 关
          </div>

          {/* 题目 */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-4">
            <p className="text-sm text-white/80 leading-relaxed">
              {scenario.story}
            </p>
            {highlightHint && (
              <p className="text-xs text-amber-300 mt-2 animate-pop-in">
                {scenario.hint}
              </p>
            )}
          </div>

          {/* 选项（延迟出现）*/}
          {!showOptions && !result && (
            <div className="text-center text-white/30 text-sm py-8">
              {ttsEnabled ? "🔊 海小喵正在读题…" : "..."}
            </div>
          )}
          {showOptions && (
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
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          {/* 反馈 */}
          {result && (
            <div
              className={`mt-4 rounded-2xl p-4 text-center ${result === "correct" ? "bg-emerald-500/10 border border-emerald-400/20" : "bg-red-500/10 border border-red-400/20"}`}
            >
              <div className="text-lg font-bold mb-1">
                {result === "correct" ? "🕯️ 安全！" : "😿 不对哦～"}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {scenario.hint}
              </p>
              <div className="mt-3 flex gap-2 justify-center">
                <button
                  onClick={next}
                  className="px-5 py-2 rounded-full bg-amber-500/80 text-white text-xs font-bold hover:bg-amber-400/80"
                >
                  {scIdx < scenarios.length - 1 ? "下一题 →" : "看看结果 →"}
                </button>
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
              你答对了 {correctCount} / {scenarios.length} 题
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setView("cafe")}
              className="px-6 py-3 rounded-full bg-amber-500/80 text-white text-sm font-bold hover:bg-amber-400/80"
            >
              {correctCount > 0
                ? `答对 ${correctCount} 题，回咖啡馆 →`
                : "回咖啡馆 →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
