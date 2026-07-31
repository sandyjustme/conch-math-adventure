import useStore from "../../store/useStore";
import { useSneakAttacks } from "../../hooks/useSneakAttacks";
import { NODE_MAP } from "../../data/knowledgeGraph";

/* 间隔偷袭提醒条（自包含：数据来自 useSneakAttacks，点击跳转潜水算术） */
export default function SneakAttackBanner() {
  const setView = useStore((s) => s.setView);
  const setDiveFocus = useStore((s) => s.setDiveFocus);
  const { dueAttacks, handleSneakSuccess } = useSneakAttacks();

  if (dueAttacks.length === 0) return null;

  return (
    <div className="px-4 mb-3 max-w-md md:max-w-lg mx-auto">
      {dueAttacks.map((a) => {
        const node = NODE_MAP.get(a.nodeId);
        return (
          <div
            key={a.nodeId}
            className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-center gap-3 animate-pop-in"
          >
            <div className="text-2xl">⏰</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-amber-700">
                还记得「{node?.name || a.nodeId}」吗？
              </div>
              <div className="text-xs text-amber-500">
                {a.context}到了，来复习一下吧！
              </div>
            </div>
            <button
              onClick={() => {
                handleSneakSuccess(a.nodeId);
                setDiveFocus(a.nodeId);
                setView("dive");
              }}
              className="px-4 py-2 rounded-full bg-amber-400 text-white text-xs font-bold hover:bg-amber-500 transition active:scale-95 whitespace-nowrap"
            >
              去复习 →
            </button>
          </div>
        );
      })}
    </div>
  );
}
