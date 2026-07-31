/* 奖励规则看板弹层（从 CafeHall 提取，纯展示） */
export default function RulesBoard({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl text-ocean-deep text-center mb-4">
          🎁 奖励规则
        </h2>

        <div className="space-y-4">
          <section>
            <h3 className="text-sm font-bold text-ocean-surface mb-2">
              🌟 碎片/珍珠怎么赚
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>💬 今日探险每轮对话 +0.2 碎片</p>
              <p>🤔 真正想通一步 +2 碎片 +1 珍珠</p>
              <p>🏁 聊通一个知识点 +3 碎片 +3次游戏</p>
              <p>🏊 潜水算术过关 +1 珍珠 +2次游戏</p>
              <p>🎮 游戏角按算式得分结算碎片（0分=0）</p>
              <p>🐢 海龟汤首次破解 +5 珍珠 +3次游戏</p>
              <p>🗺️ 藏宝图每掌握1个知识点 +2 珍珠</p>
              <p>📅 每日签到 +1 碎片，连续7天 +1 珍珠</p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-amber-600 mb-2">
              📈 倍率怎么算
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>🎯 今天还没探险 → 所有活动 ×0.5</p>
              <p>🔥 每聊通1关 +0.3 倍率（上不封顶）</p>
              <p>🐱 从今日探险跳转潜水 → 更高收益</p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-violet-600 mb-2">
              🎮 游戏次数怎么获得
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>探险过1关 +3次 · 潜水算术 +2次</p>
              <p>规则怪谈答对 +1次 · 海龟汤破解 +3次</p>
              <p>每日登录送 +2次 · 上限 10 次</p>
              <p>海底跳跃/贝壳收集每次消耗 1 次</p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-rose-500 mb-2">
              ⚠️ 答错扣减
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>🤿 潜水算术每答错 1 次 → 扣 0.2 碎片</p>
              <p>💀 答错 5 次 → 过关 0 碎片</p>
              <p>📜 规则怪谈选错 → 不可重选，直接跳过</p>
              <p>🐢 看过汤底再玩 → 不再给奖励</p>
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-full bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
