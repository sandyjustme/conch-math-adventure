import useStore from "../../store/useStore";
import { NODES } from "../../data/knowledgeGraph";
import { computeAnalytics } from "../../engine/analytics";
import Mascot from "../shared/Mascot";
import RadarChart from "../shared/RadarChart";

const BACKUP_VERSION = 1;

export default function Dashboard() {
  const setView = useStore((s) => s.setView);
  const records = useStore((s) => s.answerRecords);
  const mastered = useStore((s) => s.masteredNodes);
  const consecutive = useStore((s) => s.consecutiveDays);
  const pearls = useStore((s) => s.pearls);
  const fragments = useStore((s) => s.fragments);
  const redemptions = useStore((s) => s.redemptions);

  // 导出整个存档为 JSON 文件下载（换手机/清缓存时保护孩子资产）
  const exportBackup = () => {
    const state = useStore.getState();
    const backup = {
      version: BACKUP_VERSION,
      app: "喵喵趣学",
      exportedAt: new Date().toISOString(),
      data: {
        fragments: state.fragments,
        pearls: state.pearls,
        masteredNodes: state.masteredNodes,
        sneakAttacks: state.sneakAttacks,
        answerRecords: state.answerRecords,
        redemptions: state.redemptions,
        rareShells: state.rareShells,
        // 也备份音效偏好
        ttsEnabled: state.ttsEnabled,
        sttEnabled: state.sttEnabled,
        bgmEnabled: state.bgmEnabled,
        sfxEnabled: state.sfxEnabled,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `喵喵趣学备份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入备份
  const importBackup = () => {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = ".json";
    el.onchange = async () => {
      const file = el.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const obj = JSON.parse(text);
        if (!obj?.data || typeof obj.data !== "object")
          throw new Error("格式不对");
        const d = obj.data;
        const keys = [
          "fragments",
          "pearls",
          "masteredNodes",
          "sneakAttacks",
          "answerRecords",
          "redemptions",
          "rareShells",
        ];
        for (const k of keys) {
          if (!(k in d)) throw new Error(`缺少字段: ${k}`);
        }
        if (
          !confirm(
            `确认导入备份？\n\n备份信息：${obj.exportedAt?.slice(0, 10) || "未知日期"}\n珍珠 💎${d.pearls || 0} · 碎片 ${d.fragments || 0}\n掌握 ${d.masteredNodes?.length || 0} 个知识点\n\n导入后当前存档将被替换。`
          )
        )
          return;
        useStore.setState({
          fragments: d.fragments,
          pearls: d.pearls,
          masteredNodes: d.masteredNodes,
          sneakAttacks: d.sneakAttacks,
          answerRecords: d.answerRecords,
          redemptions: d.redemptions,
          rareShells: d.rareShells,
          ttsEnabled: d.ttsEnabled ?? true,
          sttEnabled: d.sttEnabled ?? true,
          bgmEnabled: d.bgmEnabled ?? true,
          sfxEnabled: d.sfxEnabled ?? true,
        });
        alert("备份已还原！");
      } catch (e) {
        alert(
          `导入失败：${e instanceof Error ? e.message : "文件不合法"}，请确认选中了正确的备份文件。`
        );
      }
    };
    el.click();
  };

  const nodeNames = new Map(NODES.map((n) => [n.id, n.name]));
  const totalDays = new Set(
    records.map((r) => new Date(r.timestamp).toISOString().slice(0, 10))
  ).size;
  const a = computeAnalytics(
    records,
    mastered,
    consecutive,
    totalDays,
    pearls,
    fragments,
    redemptions,
    nodeNames,
    NODES.length
  );

  const exportReport = () => {
    const lines = [
      "喵喵趣学 · 学习报告",
      "──────────────────────────────",
      `生成时间：${new Date().toLocaleDateString("zh-CN")}`,
      "",
      `📝 总答题数：${a.totalAnswers}`,
      `🎯 正确率：${a.accuracy}%`,
      `🏝️ 已掌握：${a.masteredCount}/${a.totalNodes}`,
      `🔥 连续登录：${a.consecutiveDays} 天`,
      `📅 累计使用：${totalDays} 天`,
      `💎 珍珠：${a.pearls} · 碎片：${a.fragments}`,
      "",
      "📐 知识点掌握：",
      ...a.nodeAccuracy.map(
        (n) => `  ${n.name}: ${Math.round(n.accuracy * 100)}% (${n.count}题)`
      ),
      "",
      `💪 最强项：${a.strongestNode}`,
      `🎯 需加强：${a.weakestNode}`,
      "",
      "🧭 六维画像：",
      `  掌握度 ${a.radar.mastery}  兴趣度 ${a.radar.interest}  坚持度 ${a.radar.persistence}`,
      `  自主度 ${a.radar.autonomy}  迁移度 ${a.radar.transfer}  情绪度 ${a.radar.emotion}`,
    ].join("\n");
    navigator.clipboard
      .writeText(lines)
      .then(() => alert("报告已复制到剪贴板，可以粘贴给家长看！"));
  };

  return (
    <div className="min-h-screen bg-ocean-shimmer">
      <header className="flex items-center justify-between px-4 py-3 bg-white/60 backdrop-blur">
        <button
          onClick={() => setView("cafe")}
          className="text-xl"
          aria-label="回咖啡馆"
        >
          🏠
        </button>
        <div className="flex items-center gap-2">
          <Mascot size={24} />
          <h1 className="font-display text-lg text-ocean-deep">航海日志</h1>
        </div>
        <div className="flex gap-1">
          <button
            onClick={exportReport}
            className="text-xs text-teal-600 font-bold px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100"
            aria-label="导出学习报告"
          >
            📋 报告
          </button>
          <button
            onClick={exportBackup}
            className="text-xs text-teal-600 font-bold px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100"
            aria-label="导出完整存档"
          >
            💾 备份
          </button>
          <button
            onClick={importBackup}
            className="text-xs text-teal-600 font-bold px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100"
            aria-label="导入存档"
          >
            📥 还原
          </button>
        </div>
      </header>

      <div className="p-4 max-w-md md:max-w-lg mx-auto space-y-4 pb-8">
        {/* 概览卡片 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["📝", a.totalAnswers, "总答题"],
            ["🎯", `${a.accuracy}%`, "正确率"],
            ["🏝️", `${a.masteredCount}/${a.totalNodes}`, "已掌握"],
          ].map(([emoji, val, label]) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="text-lg">{emoji}</div>
              <div className="font-display text-xl text-ocean-deep">{val}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["🔥", a.consecutiveDays, "连续天数"],
            ["📅", totalDays, "累计天数"],
            ["💎", a.pearls, "珍珠数"],
          ].map(([emoji, val, label]) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="text-lg">{emoji}</div>
              <div className="font-display text-xl text-ocean-deep">{val}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* 六维雷达图 */}
        <div className="bg-white rounded-3xl p-5 shadow-md">
          <h3 className="font-bold text-slate-700 mb-3 text-center">
            🧭 成长画像
          </h3>
          <RadarChart scores={a.radar} />
        </div>

        {/* 节点掌握度 */}
        <div className="bg-white rounded-3xl p-5 shadow-md">
          <h3 className="font-bold text-slate-700 mb-3">📐 知识点掌握</h3>
          <div className="space-y-2">
            {a.nodeAccuracy.slice(0, 8).map((n) => (
              <div key={n.node} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-16 truncate">
                  {n.name}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-all"
                    style={{ width: `${n.accuracy * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-10 text-right">
                  {Math.round(n.accuracy * 100)}%
                </span>
                <span className="text-[10px] text-slate-400 w-6">
                  {n.count}题
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 强弱项 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">💪 最强</div>
            <div className="font-bold text-emerald-600">{a.strongestNode}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">🎯 需加强</div>
            <div className="font-bold text-amber-600">{a.weakestNode}</div>
          </div>
        </div>

        {/* 每日表现 */}
        {a.timeline.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700">📅 每日表现</h3>
              <span className="text-[10px] text-slate-500">最近 14 天</span>
            </div>
            <div
              className="flex items-end gap-2 justify-center border-b border-slate-100"
              style={{ height: 132, paddingBottom: 0 }}
            >
              {a.timeline.slice(-14).map((d) => {
                const rate = d.answers > 0 ? d.correct / d.answers : 0;
                const h = Math.max(8, rate * 100);
                const intensity = 0.3 + Math.min(d.answers / 10, 0.7);
                return (
                  <div
                    key={d.date}
                    className="flex flex-col items-center"
                    title={`${d.date}: ${d.correct}/${d.answers} 题 · 正确 ${Math.round(rate * 100)}%`}
                  >
                    <span className="text-[9px] text-slate-500 mb-1 font-bold">
                      {rate > 0 ? Math.round(rate * 100) + "%" : ""}
                    </span>
                    <div
                      className="bg-teal-500 rounded-t-sm transition-all"
                      style={{ width: 18, height: h, opacity: intensity }}
                    />
                    <span className="text-[9px] text-slate-500 mt-1.5 whitespace-nowrap">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-2 justify-center">
              <span className="text-[10px] text-slate-500">
                ⬆ 柱高 = 正确率
              </span>
              <span className="text-[10px] text-slate-500">
                ⬆ 深浅 = 答题量
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
