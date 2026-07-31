import Mascot from "../shared/Mascot";

/* 新手引导弹层（从 CafeHall 提取，纯展示 + onDismiss） */
export default function GuideModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <Mascot size={56} />
          <h2 className="font-display text-xl text-stone-700 mt-2">
            欢迎来到喵喵趣学！
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            我是海小喵，你的数学探险伙伴～
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 bg-teal-50 rounded-2xl p-3">
            <div className="text-2xl">1️⃣</div>
            <div className="text-sm text-stone-600">
              <b className="text-teal-600">点「今日探险」</b>
              <br />
              海小喵会跟你聊天，看看你在哪个知识点卡住了。
            </div>
          </div>
          <div className="flex gap-3 bg-amber-50 rounded-2xl p-3">
            <div className="text-2xl">2️⃣</div>
            <div className="text-sm text-stone-600">
              <b className="text-amber-600">答着答着就学懂了</b>
              <br />
              不用打字也可以——按 🎤 说话，或者拖数轴上的小猫回答。
            </div>
          </div>
          <div className="flex gap-3 bg-rose-50 rounded-2xl p-3">
            <div className="text-2xl">3️⃣</div>
            <div className="text-sm text-stone-600">
              <b className="text-rose-500">学懂了就去练！</b>
              <br />
              对话框里会跳出「去潜水练一练」——点它，用手拖着海螺把算式走出来。
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="mt-5 w-full py-3 rounded-full bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition"
        >
          开始探险 →
        </button>
        <p className="text-center text-[11px] text-stone-300 mt-2">
          右上角 ? 随时可以再打开
        </p>
      </div>
    </div>
  );
}
