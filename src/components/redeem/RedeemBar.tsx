import { useState } from "react";
import useStore from "../../store/useStore";
import Mascot from "../shared/Mascot";
import QRCode from "qrcode";
import { buildVerifyUrl } from "./redeemCode";

const TIERS = [
  {
    key: "a",
    emoji: "🥤",
    name: "10 元以内",
    cost: 5,
    color: "border-amber-300 text-amber-700 bg-amber-50",
  },
  {
    key: "b",
    emoji: "🍰",
    name: "10～20 元",
    cost: 15,
    color: "border-stone-400 text-stone-700 bg-stone-50",
  },
  {
    key: "c",
    emoji: "🍝",
    name: "20～30 元",
    cost: 25,
    color: "border-teal-300 text-teal-700 bg-teal-50",
  },
  {
    key: "d",
    emoji: "🎂",
    name: "30 元以上",
    cost: 40,
    color: "border-rose-300 text-rose-700 bg-rose-50",
  },
];

function genPIN(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function RedeemBar() {
  const setView = useStore((s) => s.setView);
  const pearls = useStore((s) => s.pearls);
  const fragments = useStore((s) => s.fragments);
  const addRedemption = useStore((s) => s.addRedemption);
  const redemptions = useStore((s) => s.redemptions);

  const [modal, setModal] = useState<{
    tier: (typeof TIERS)[0];
    code: string;
    pin: string;
    qrDataUrl: string;
  } | null>(null);

  const handleRedeem = async (tier: (typeof TIERS)[0]) => {
    if (pearls < tier.cost) return;
    try {
      const code = `${tier.key}-${Date.now().toString(36)}`;
      const pin = genPIN();
      const url = buildVerifyUrl({
        t: tier.name,
        e: tier.emoji,
        code,
        pin,
        cost: tier.cost,
        ts: Date.now(),
      });
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
      setModal({ tier, code, pin, qrDataUrl });
    } catch {
      useStore.getState().showToast("fragment", 0);
    }
  };

  const confirmRedeem = () => {
    if (!modal) return;
    useStore.getState().spendPearls(modal.tier.cost);
    addRedemption({ code: modal.code, time: new Date().toISOString() });
    setModal(null);
  };

  const totalEarned =
    pearls +
    redemptions.reduce((sum, r) => {
      const t = TIERS.find((x) => r.code.startsWith(x.key));
      return sum + (t?.cost || 0);
    }, 0);

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
          <h1 className="font-display text-lg text-ocean-deep">兑换吧台</h1>
        </div>
        <div className="w-8" />
      </header>
      <div className="p-4">
        <div className="max-w-md md:max-w-lg mx-auto space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-md text-center">
            <p className="text-sm text-slate-500 mb-1">当前珍珠</p>
            <div className="text-4xl font-display text-ocean-deep">
              💎 {pearls}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              累计赚过 {totalEarned} 颗 · 碎片 {fragments}（10碎=1珠）
            </p>
          </div>

          <div className="space-y-3">
            {TIERS.map((tier) => {
              const canAfford = pearls >= tier.cost;
              return (
                <div
                  key={tier.key}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition ${canAfford ? tier.color.split(" ")[0] : "border-slate-200"} ${canAfford ? "" : "opacity-50"}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{tier.emoji}</div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-700">
                        {tier.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        💎{tier.cost} 颗珍珠
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${canAfford ? tier.color.split(" ")[1].replace("border-", "text-") : "text-slate-500"}`}
                      >
                        💎{tier.cost}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeem(tier)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-full font-bold text-sm transition active:scale-95 ${canAfford ? `${tier.color.split(" ")[2]} ${tier.color.split(" ")[1].replace("border-", "text-")} ${tier.color.split(" ")[2].replace("text-", "bg-").replace("-700", "-100")} hover:opacity-80` : "bg-slate-100 text-slate-500"}`}
                  >
                    {canAfford
                      ? `兑换「${tier.name}」→`
                      : `还差 ${tier.cost - pearls} 颗珍珠`}
                  </button>
                </div>
              );
            })}
          </div>

          {redemptions.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-md">
              <h3 className="font-bold text-slate-700 mb-3">📋 兑换记录</h3>
              <div className="space-y-2">
                {[...redemptions].reverse().map((r, i) => {
                  const tier = TIERS.find((t) => r.code.startsWith(t.key));
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span>{tier?.emoji || "☕"}</span>
                        <span className="font-bold text-slate-600">
                          {tier?.name || "兑换"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {r.code}
                        </span>
                      </span>
                      <span className="text-slate-500 text-xs">
                        {new Date(r.time).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 二维码确认弹窗 */}
      {modal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl text-slate-700 mb-1">
              {modal.tier.emoji} 兑换确认
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {modal.tier.name} · 💎{modal.tier.cost} 颗珍珠
            </p>

            {/* QR 码 */}
            <img
              src={modal.qrDataUrl}
              alt="兑换二维码"
              className="mx-auto mb-3 rounded-xl border"
              width={220}
              height={220}
            />
            <p className="text-xs text-slate-500 mb-4">给咖啡师扫这个码</p>

            {/* 确认码 */}
            <div className="bg-slate-900 rounded-2xl p-4 mb-4">
              <div className="text-[10px] text-slate-500 mb-1">确认码</div>
              <div className="text-3xl font-mono font-bold text-amber-400 tracking-[0.3em]">
                {modal.pin}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                告诉咖啡师这 6 位数字
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              咖啡师扫码确认后，点下面按钮完成兑换
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-full bg-slate-100 text-slate-500 font-bold text-sm"
              >
                取消
              </button>
              <button
                onClick={confirmRedeem}
                className="flex-1 py-3 rounded-full bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition active:scale-95"
              >
                已完成，扣珍珠 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
