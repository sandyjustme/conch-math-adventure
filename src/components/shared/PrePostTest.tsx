import { useEffect, useState } from "react";
import Mascot from "./Mascot";

interface Answer {
  q: number; // 题号 0-2
  answer: string;
  correct: boolean;
  ms: number; // 答题用时
}

interface TestResult {
  answers: Answer[];
  timestamp: number;
}

const QUESTIONS = [
  {
    q: '"海面以下 3 米"用数字怎么表示？',
    hint: "海面是 0，以下是负数",
    correct: "-3",
    ok: ["-3", "负3", "负三"],
  },
  {
    q: "−5 和 −2，哪个更大？",
    hint: "越往上越大，越往下越小",
    correct: "-2",
    ok: ["-2", "负2", "负二"],
  },
  {
    q: "|−4| 等于多少？",
    hint: "绝对值只看离海面多远，不管方向",
    correct: "4",
    ok: ["4", "四"],
  },
];

function check(questionIdx: number, a: string): boolean {
  return QUESTIONS[questionIdx].ok.some((x) => a.trim() === x);
}

function load(k: string): TestResult | null {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
function save(k: string, r: TestResult) {
  localStorage.setItem(k, JSON.stringify(r));
}

export default function PrePostTest({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"pre" | "post" | "compare" | "done">("pre");
  const [qIdx, setQIdx] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [preResult, setPreResult] = useState<TestResult | null>(null);
  const [postResult, setPostResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const pre = load("conch_pretest");
    const post = load("conch_posttest");
    if (!pre) setStep("pre");
    else if (pre && !post && Date.now() - pre.timestamp > 14 * 86400000)
      setStep("post");
    else if (pre && post) {
      setPreResult(pre);
      setPostResult(post);
      setStep("compare");
    } else {
      onDone();
    }
  }, []);

  const submit = () => {
    const elapsed = Date.now() - startTime;
    const correct = check(qIdx, input);
    const a: Answer = { q: qIdx, answer: input, correct, ms: elapsed };
    const next = [...answers, a];
    setAnswers(next);
    setInput("");
    setStartTime(Date.now());

    if (qIdx < 2) {
      setQIdx(qIdx + 1);
    } else {
      const result: TestResult = { answers: next, timestamp: Date.now() };
      if (step === "pre") {
        save("conch_pretest", result);
        setPreResult(result);
        onDone();
      } else if (step === "post") {
        save("conch_posttest", result);
        setPostResult(result);
        setPreResult(load("conch_pretest"));
        setStep("compare");
      }
    }
  };

  const skip = () => {
    save(step === "pre" ? "conch_pretest" : "conch_posttest", {
      answers: [],
      timestamp: Date.now(),
    });
    onDone();
  };

  if (step === "compare" && preResult && postResult) {
    const preOk = preResult.answers.filter((a) => a.correct).length;
    const postOk = postResult.answers.filter((a) => a.correct).length;
    const preMs = preResult.answers.reduce((s, a) => s + a.ms, 0);
    const postMs = postResult.answers.reduce((s, a) => s + a.ms, 0);
    const improved = postOk > preOk || (postOk === preOk && postMs < preMs);
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
        onClick={onDone}
      >
        <div
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Mascot size={48} />
          <h2 className="font-display text-xl text-stone-700 mt-2">
            {improved ? "🎉 你进步了！" : "📊 你的变化"}
          </h2>
          <div className="mt-4 space-y-2 text-sm text-stone-600">
            <div className="flex justify-between bg-slate-50 rounded-xl p-2">
              <span>上次</span>
              <span className="font-bold">
                {preOk}/3 正确 · {Math.round(preMs / 1000)}秒
              </span>
            </div>
            <div className="flex justify-between bg-teal-50 rounded-xl p-2">
              <span>这次</span>
              <span className="font-bold text-teal-600">
                {postOk}/3 正确 · {Math.round(postMs / 1000)}秒
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {improved ? "数学探险让你变得更强了！" : "继续探险，下次会更好的！"}
          </p>
          <button
            onClick={onDone}
            className="mt-4 w-full py-3 rounded-full bg-teal-500 text-white font-bold text-sm"
            aria-label="完成测试，继续探险"
          >
            继续探险 →
          </button>
        </div>
      </div>
    );
  }

  if (step === "done") return null;

  const q = QUESTIONS[qIdx];
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
      onClick={skip}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <Mascot size={40} />
          <h2 className="font-display text-lg text-stone-700 mt-1">
            海小喵想了解你的超能力
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {step === "pre"
              ? "3 道小问题，看看你现在多厉害"
              : "再来看看你进步了多少"}
          </p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 mb-4">
          <div className="text-xs text-amber-600 mb-1">第 {qIdx + 1}/3 题</div>
          <p className="text-sm font-bold text-stone-700">{q.q}</p>
          <p className="text-xs text-stone-500 mt-2">💡 {q.hint}</p>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="输入你的答案…"
          className="w-full px-4 py-3 rounded-full border-2 border-teal-200 text-[15px] outline-none focus:ring-2 focus:ring-teal-300 mb-3"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={skip}
            className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-500 text-sm font-bold"
            aria-label="跳过这道题"
          >
            跳过
          </button>
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="flex-1 py-2.5 rounded-full bg-teal-500 text-white text-sm font-bold disabled:opacity-40"
            aria-label="提交答案"
          >
            下一题 →
          </button>
        </div>
      </div>
    </div>
  );
}
