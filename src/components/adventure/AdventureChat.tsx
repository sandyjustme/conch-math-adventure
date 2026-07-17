import { useState, useRef, useEffect, useCallback } from "react";
import useStore from "../../store/useStore";
import { NODES, NODE_MAP } from "../../data/knowledgeGraph";
import {
  sendChatMessage,
  parseLevelTag,
  parseRewardTag,
  parseWrongTag,
  parsePracticeTag,
  cleanTags,
} from "../../services/ai";
import {
  isSTTSupported,
  startListening,
  stopListening,
} from "../../services/stt";
import { speakText } from "../../services/audio";
import { runDiagnostic } from "../../engine/diagnostic";
import OceanLine from "./OceanLine";
import Mascot from "../shared/Mascot";

const WELCOME_MESSAGE = {
  role: "assistant" as const,
  text: "嗨！我是海小喵～准备好了就点下面的「开始闯关」，我们一起去海底探险，找到你卡住的地方！",
};

const PRACTICE_NODES = [
  "K1",
  "K3",
  "K5",
  "K6",
  "K7",
  "K8",
  "K9",
  "K10",
  "K11",
  "K12",
  "K13",
  "K14",
  "K16",
  "K17",
  "K19",
  "K20",
];

export default function AdventureChat() {
  const setView = useStore((s) => s.setView);
  const messages = useStore((s) => s.messages);
  const setMessages = useStore((s) => s.setMessages);
  const loading = useStore((s) => s.loading);
  const setLoading = useStore((s) => s.setLoading);
  const currentNodeId = useStore((s) => s.currentNodeId);
  const setCurrentNode = useStore((s) => s.setCurrentNode);
  const addPearls = useStore((s) => s.addPearls);
  const addFragments = useStore((s) => s.addFragments);
  const showToast = useStore((s) => s.showToast);
  const setDiveFocus = useStore((s) => s.setDiveFocus);
  const setDiagnosticsCompleted = useStore((s) => s.setDiagnosticsCompleted);
  const incrementAdventureCount = useStore((s) => s.incrementAdventureCount);
  const setDiveFromAdventure = useStore((s) => s.setDiveFromAdventure);
  const masterNode = useStore((s) => s.masterNode);
  const addAnswerRecord = useStore((s) => s.addAnswerRecord);

  const [input, setInput] = useState("");
  const [point, setPoint] = useState(-3);
  const [showLine, setShowLine] = useState(false);
  const [listening, setListening] = useState(false);
  // 想通进度：绑定到某个知识点；steps 随小突破增长，ready 由 AI 判定学懂后置 true
  const [understand, setUnderstand] = useState<{
    node: string;
    steps: number;
    ready: boolean;
  }>({
    node: currentNodeId,
    steps: 0,
    ready: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fragPending = useRef(0); // 累加 0.5 碎片，满 1 才入账

  useEffect(() => () => stopListening(), []);

  useEffect(() => {
    if (messages.length === 0) setMessages([WELCOME_MESSAGE]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      const newMessages = [...messages, { role: "user" as const, text: msg }];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const reply = await sendChatMessage(newMessages);

        const levelMatch = parseLevelTag(reply);
        const replyNode = levelMatch || currentNodeId;
        if (levelMatch) setCurrentNode(levelMatch);

        const rewardGained = parseRewardTag(reply);
        const isWrong = parseWrongTag(reply);
        const isPractice = parsePracticeTag(reply);

        if (rewardGained > 0) {
          addPearls(rewardGained);
          addFragments(2);
          showToast("pearl", rewardGained);
        }

        // 每轮对话 0.5 碎片（PRACTICE 跳转那轮也计入）
        if (text !== "我准备好了，开始吧！") {
          fragPending.current += 0.5;
          if (fragPending.current >= 1) {
            const earned = Math.floor(fragPending.current);
            addFragments(earned);
            fragPending.current -= earned;
          }
        }

        // PRACTICE：聊通了一个知识点
        if (isPractice) {
          addFragments(3);
          if (fragPending.current > 0) {
            addFragments(1);
            fragPending.current = 0;
          }
          setDiagnosticsCompleted();
          incrementAdventureCount();
        }

        // ── 诊断引擎：记录每次答题 + 定期溯源断点 ──
        const recordNode = replyNode;
        addAnswerRecord({
          nodeId: recordNode,
          correct: !isWrong, // 除非 AI 标记 WRONG，否则视为正确
          latencyMs: 0,
          timestamp: Date.now(),
        });
        // 每积累 3 条记录，跑一次诊断（延迟到下一帧，避免渲染中更新父组件状态）
        const totalRecords = useStore.getState().answerRecords.length + 1;
        if (totalRecords >= 3 && totalRecords % 3 === 0) {
          const diag = runDiagnostic(
            useStore.getState().answerRecords,
            recordNode
          );
          if (diag.nodeId !== recordNode && diag.confidence > 0.4) {
            setTimeout(() => setCurrentNode(diag.nodeId), 0);
          }
        }

        const ready = parsePracticeTag(reply);
        setUnderstand((prev) => {
          const u =
            prev.node === replyNode
              ? { ...prev }
              : { node: replyNode, steps: 0, ready: false };
          if (rewardGained > 0) u.steps = Math.min(4, u.steps + 1);
          if (ready && !u.ready) {
            u.ready = true;
            masterNode(replyNode);
            showToast("levelup");
          }
          return u;
        });

        const cleanedReply = cleanTags(reply) || "咦，我好像走神了，再说一次？";
        setMessages([
          ...newMessages,
          { role: "assistant", text: cleanedReply },
        ]);
      } catch (e) {
        console.error("sendChatMessage failed:", e);
        setMessages([
          ...newMessages,
          { role: "assistant", text: "网络好像开小差了，再发一次试试～" },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      input,
      messages,
      loading,
      currentNodeId,
      setMessages,
      setLoading,
      setCurrentNode,
      addPearls,
      addAnswerRecord,
      showToast,
    ]
  );

  const toggleMic = () => {
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    if (!isSTTSupported()) {
      setMessages([
        ...messages,
        {
          role: "assistant",
          text: "这个浏览器还不支持语音哦～用 Chrome 打开，就能对着我说话啦！",
        },
      ]);
      return;
    }
    const ok = startListening(
      "zh-CN",
      (t) => setInput(t),
      () => setListening(false)
    );
    if (ok) setListening(true);
  };

  const submitPosition = () => {
    const label =
      point >= 0 ? `水上 ${point} 米` : `水下 ${Math.abs(point)} 米`;
    setShowLine(false);
    send(`我把小猫放在了${label}`);
  };

  const currentNode = NODE_MAP.get(currentNodeId);
  const currentIndex = NODES.findIndex((n) => n.id === currentNodeId);
  const isStart = messages.length <= 1;
  const supported = PRACTICE_NODES.includes(currentNodeId);
  const readyHere = understand.ready;
  const steps = understand.node === currentNodeId ? understand.steps : 0;
  const barWidth = readyHere ? 100 : Math.min(85, 12 + steps * 24);
  // 当前节点对话轮数（只算用户发言）
  const nodeMsgCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-ocean-shimmer">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white/60 backdrop-blur flex-shrink-0">
        <button
          onClick={() => setView("cafe")}
          className="text-xl"
          aria-label="回咖啡馆"
        >
          🏠
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Mascot size={24} />
            <h1 className="font-display text-lg text-ocean-deep">海底探险</h1>
          </div>
          <p className="text-xs text-slate-500 font-body">
            {currentNode
              ? `${currentNode.name} · 第${currentIndex + 1}/${NODES.length}关`
              : "探险中"}
          </p>
        </div>
        <div className="w-8" />
      </header>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 py-1.5 px-4 overflow-x-auto flex-shrink-0">
        {NODES.map((n, i) => {
          const done = i < currentIndex;
          const here = i === currentIndex;
          return (
            <div
              key={n.id}
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                done
                  ? "bg-emerald-400"
                  : here
                    ? "bg-amber-400 ring-2 ring-amber-300 ring-offset-1"
                    : "bg-slate-200"
              }`}
              title={
                here ? `当前：${n.name}` : done ? `已完成：${n.name}` : n.name
              }
            />
          );
        })}
      </div>

      {/* 想通进度条（常驻头部）*/}
      {!isStart && supported && !readyHere && (
        <div className="px-3 pt-1 flex-shrink-0">
          <div className="bg-white/60 rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-body whitespace-nowrap">
              🐚 想通进度
            </span>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-body whitespace-nowrap">
              {nodeMsgCount >= 4
                ? "快出结果了"
                : `最多再聊 ${4 - nodeMsgCount} 轮`}
            </span>
          </div>
        </div>
      )}

      {/* 对话记录 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && <Mascot size={26} />}
            <div className="flex flex-col gap-1">
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-body shadow-sm ${
                  m.role === "user"
                    ? "bg-ocean-surface text-white rounded-br-md"
                    : "bg-amber-50 text-slate-700 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
              {m.role === "assistant" && (
                <button
                  onClick={() => speakText(m.text)}
                  className="self-start text-xs text-slate-500 hover:text-teal-500 px-1"
                  aria-label="朗读海小喵的话"
                >
                  🔊 朗读
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <Mascot size={26} />
            <div className="bg-amber-50 text-slate-500 px-4 py-2.5 rounded-2xl text-sm font-body">
              海小喵正在思考…
            </div>
          </div>
        )}

        {/* 学懂后：潜水按钮出现在对话底部 */}
        {readyHere && (
          <div className="flex justify-center pt-1 pb-2">
            <button
              onClick={() => {
                setDiveFocus(currentNodeId);
                setView("dive");
              }}
              className="px-5 py-3 rounded-2xl bg-ocean-deep text-white font-body text-sm font-bold shadow-lg hover:bg-ocean-deep/90 transition active:scale-95"
            >
              🐚 学得不错！去潜水练一练「{currentNode?.name}」→
            </button>
          </div>
        )}
      </div>

      {/* 数轴面板（折叠，展开后自带提交）*/}
      {showLine && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="bg-white/80 rounded-2xl p-3 shadow-sm border border-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-body">
                拖动小猫，摆到你觉得对的位置
              </span>
              <button
                onClick={() => setShowLine(false)}
                className="text-slate-500 text-sm"
              >
                收起 ✕
              </button>
            </div>
            <div className="flex items-center justify-center min-h-[150px]">
              <OceanLine point={point} setPoint={setPoint} />
            </div>
            <button
              onClick={submitPosition}
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-full bg-amber-400 text-white font-body text-sm font-bold shadow-sm hover:bg-amber-500 transition disabled:opacity-50"
            >
              📍 就用这个位置回答（
              {point >= 0 ? `水上 ${point} 米` : `水下 ${Math.abs(point)} 米`}）
            </button>
          </div>
        </div>
      )}

      {/* 孩子卡住时的快捷求助 */}
      {!isStart && (
        <div className="px-3 pb-1 flex-shrink-0 flex justify-center">
          <button
            onClick={() => send("我不太懂，换种方式讲讲吧")}
            disabled={loading}
            className="text-xs text-amber-600 font-bold px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-40"
          >
            🤔 我不太懂，换种方式讲讲
          </button>
        </div>
      )}

      {/* 底部：开局显示「开始闯关」，之后是常驻输入栏 */}
      <div className="p-3 flex-shrink-0">
        {isStart ? (
          <button
            onClick={() => send("我准备好了，开始吧！")}
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-ocean-surface text-white font-body text-base font-bold shadow hover:bg-ocean-surface/90 transition disabled:opacity-50"
          >
            🎯 开始闯关
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowLine((v) => !v)}
              className={`px-3 py-3 rounded-full text-sm font-bold shadow-sm transition flex-shrink-0 ${
                showLine
                  ? "bg-ocean-surface text-white"
                  : "bg-white border-2 border-teal-200 text-teal-700 hover:bg-teal-50"
              }`}
              aria-label="打开数轴"
            >
              🌊
            </button>
            <button
              onClick={toggleMic}
              className={`px-3 py-3 rounded-full text-sm font-bold shadow-sm transition flex-shrink-0 ${
                listening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
              aria-label={listening ? "正在听你说" : "语音输入"}
            >
              {listening ? "🔴" : "🎤"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={listening ? "在听你说…" : "说说你的想法…"}
              className="flex-1 min-w-0 px-4 py-3 rounded-full border-2 border-teal-200 text-[15px] outline-none focus:ring-2 focus:ring-teal-300 font-body bg-white"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="px-4 py-3 rounded-full bg-teal-600 text-white text-sm font-bold disabled:opacity-50 font-body flex-shrink-0"
              aria-label="发送消息"
            >
              发送
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
