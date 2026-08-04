/**
 * 奖励规则看板（纯展示）。
 *
 * v4 重写：原来 22 行规则、四个板块（倍率/扣减/各玩法各自的发钱表），
 * 家长的原话是「我都有点懒得看，小朋友没看完规则就不想玩了吧」——
 * 而且那些还全是 v2 的死规则，单水龙头之后没有一条是真的。
 *
 * 完成制的意义就是规则简单到不需要解释。这里只剩四句大实话，
 * 而且每一句在她的必经之路上（工位页/兑换吧台）本来就能看到。
 */
export default function RulesBoard({ onClose }: { onClose: () => void }) {
  const RULES = [
    { emoji: "🧾", text: "干完一张活儿：+1 珍珠 +3 碎片 +1 次游戏" },
    { emoji: "🌙", text: "一天 3 张，干完就收工" },
    { emoji: "🍜", text: "珍珠攒够了，去兑换吧台换好吃的" },
    { emoji: "💧", text: "做错不扣钱，随便重试" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl text-ocean-deep text-center mb-5">
          🎁 就这几条
        </h2>

        <div className="space-y-3">
          {RULES.map((r) => (
            <div
              key={r.text}
              className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3"
            >
              <span className="text-2xl leading-none">{r.emoji}</span>
              <span className="text-sm text-slate-700 leading-snug">
                {r.text}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          没了，真的就这些
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-full bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
