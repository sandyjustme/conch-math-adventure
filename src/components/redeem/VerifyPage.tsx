import Mascot from "../shared/Mascot";
import { decodePayload, type RedeemPayload } from "./redeemCode";

function readPayload(): RedeemPayload | null {
  const m = window.location.hash.match(/^#verify=(.+)$/);
  return m ? decodePayload(m[1]) : null;
}

export default function VerifyPage() {
  const payload = readPayload();

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ocean-shimmer">
        <div className="bg-white rounded-3xl p-8 shadow-md text-center max-w-sm w-full">
          <div className="text-5xl mb-3">🐚</div>
          <h1 className="font-display text-xl text-slate-700 mb-2">
            二维码无效
          </h1>
          <p className="text-sm text-slate-500">
            这个码可能已损坏或不是喵喵趣学的兑换码，请让顾客在 App 里重新生成。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-ocean-shimmer">
      <header className="flex items-center gap-2 py-4">
        <Mascot size={28} />
        <h1 className="font-display text-lg text-ocean-deep">
          喵喵趣学 · 兑换核销
        </h1>
      </header>

      <div className="max-w-sm w-full space-y-4">
        {/* 档位大卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-md text-center">
          <div className="text-6xl mb-2">{payload.e}</div>
          <div className="text-2xl font-bold text-slate-700">{payload.t}</div>
          <div className="text-sm text-slate-500 mt-1">
            消耗 💎 {payload.cost} 颗珍珠
          </div>
        </div>

        {/* 确认码：核销的关键 */}
        <div className="bg-slate-900 rounded-3xl p-5 text-center">
          <div className="text-xs text-slate-500 mb-1">请核对确认码</div>
          <div className="text-4xl font-mono font-bold text-amber-400 tracking-[0.3em]">
            {payload.pin}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            与顾客口述的 6 位数字一致，才是有效兑换
          </div>
        </div>

        {/* 兑换码 + 时间 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm text-sm text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>兑换码</span>
            <span className="font-mono text-slate-600">{payload.code}</span>
          </div>
          <div className="flex justify-between">
            <span>生成时间</span>
            <span>{new Date(payload.ts).toLocaleString("zh-CN")}</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 px-4">
          确认码一致后，为顾客兑换对应档位的奖励即可。本页仅用于核对，不会自动扣除珍珠。
        </p>
      </div>
    </div>
  );
}
