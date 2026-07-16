import { useMemo } from "react";
import useStore from "../store/useStore";

const MORNING_GREETINGS = [
  "早上好！今天也是元气满满的一天呢～",
  "你来了！早上最适合探险了！",
  "早啊～海小螺一直在等你来玩！",
];

const AFTERNOON_GREETINGS = [
  "下午好！要不要来海底避避暑？",
  "你来啦！下午潜水最舒服了～",
  "嘿！下午茶时间到了吗？",
];

const EVENING_GREETINGS = [
  "晚上好！海底的夜晚特别安静，适合慢慢思考～",
  "你来啦！晚上来探险的人都是酷小孩！",
  "晚安之前，要不要再潜一次水？",
];

const WEEKEND_GREETINGS = [
  "周末还来看我，你也太酷了吧！",
  "周末快乐！今天想玩多久就玩多久～",
];

const RETURN_GREETINGS = [
  "上次你发现了{feat}的秘密，今天要不要继续？",
  "你回来啦！上次在{node}我们玩得可开心了！",
  "嘿！还记得上次你在{node}的表现吗？超棒的！",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useGreeting(): string {
  const masteredNodes = useStore((s) => s.masteredNodes);
  const currentNodeId = useStore((s) => s.currentNodeId);
  const consecutiveDays = useStore((s) => s.consecutiveDays);

  return useMemo(() => {
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    const hasProgress = masteredNodes.length > 0;

    if (hasProgress && Math.random() < 0.4) {
      const last = masteredNodes[masteredNodes.length - 1];
      const greeting = pick(RETURN_GREETINGS)
        .replace("{feat}", last)
        .replace("{node}", last);
      return greeting;
    }

    if (isWeekend && Math.random() < 0.3) {
      return pick(WEEKEND_GREETINGS);
    }

    if (consecutiveDays >= 7) {
      return "连续一周都来了！你太厉害了，今天也要加油哦！";
    }

    if (hour < 12) return pick(MORNING_GREETINGS);
    if (hour < 18) return pick(AFTERNOON_GREETINGS);
    return pick(EVENING_GREETINGS);
  }, [masteredNodes, currentNodeId, consecutiveDays]);
}
