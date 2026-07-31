import { normalizeForSpeech } from "../engine/speechText";

const TTS_CACHE = new Map<string, HTMLAudioElement>();

// 火山引擎凭据只在服务端代理（/api/tts）持有，前端只发文本
export async function speak(text: string): Promise<void> {
  const cacheKey = text.slice(0, 100);
  const cached = TTS_CACHE.get(cacheKey);
  if (cached) {
    cached.currentTime = 0;
    await cached.play();
    return;
  }

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    TTS_CACHE.set(cacheKey, audio);
    await audio.play();
  } catch (e) {
    console.error("TTS error:", e);
  }
}

/** 自动朗读题目（进场调用），不缓存 */
export async function speakQuestion(text: string): Promise<void> {
  if (!text) return;
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 200) }),
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    URL.revokeObjectURL(url);
  } catch {
    /* TTS 静默失败不影响使用 */
  }
}

export function stopSpeech(): void {
  TTS_CACHE.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  if (currentSegment) {
    currentSegment.pause();
    currentSegment = null;
  }
}

/* ═══════════════════════════════════════════
   短剧播放：一段读完才 resolve，播放器据此自动推进下一段
   ═══════════════════════════════════════════ */

let currentSegment: HTMLAudioElement | null = null;
/** 火山连续失败后就不再浪费往返，直接走浏览器语音 */
let volcanoDown = false;

/**
 * 浏览器内置语音合成兜底。
 * 音质不如火山，但零配置、离线可用 —— 保证故事永远念得出来，
 * 不会因为凭据没配好就退化成让孩子自己点着读字。
 */
async function speakViaBrowser(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const started = performance.now();
  const ended = await new Promise<boolean>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.95;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
  if (!ended) return false;

  // 设备没装中文语音包时，speak() 会「秒念完」而不报错。
  // 真读出来至少要 ~60ms/字；快得离谱就当没读，交回手动模式，
  // 否则剧情会在几毫秒内整集刷完。
  const elapsed = performance.now() - started;
  if (elapsed < Math.min(1500, text.length * 60)) {
    console.warn(
      `浏览器语音疑似无中文语音包（${Math.round(elapsed)}ms 念完 ${text.length} 字），改为手动推进`
    );
    return false;
  }
  return true;
}

/**
 * 朗读一段剧情，读完才 resolve。
 * 先试火山（音质好），不行就回落浏览器语音。
 * @returns true = 念完了；false = 两条路都不通（播放器改为等她手动点继续）
 *
 * 代理层限 500 字，剧集分段后每段远低于此；超长时截断而不是整段失败。
 */
export async function speakSegment(text: string): Promise<boolean> {
  if (!text.trim()) return false;
  stopSegment();

  // 画面上保留 −7 这个数学符号，送去朗读的转成「负7」。
  // 不转的话 TTS 会按运算符读成「减七」，等于把负数概念教反了。
  const spoken = normalizeForSpeech(text).slice(0, 480);

  if (!volcanoDown) {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spoken }),
      });
      if (response.ok) {
        const url = URL.createObjectURL(await response.blob());
        const audio = new Audio(url);
        currentSegment = audio;

        const finished = await new Promise<boolean>((resolve) => {
          audio.onended = () => resolve(true);
          audio.onerror = () => resolve(false);
          audio.play().catch(() => resolve(false));
        });

        URL.revokeObjectURL(url);
        if (currentSegment === audio) currentSegment = null;
        if (finished) return true;
      } else {
        volcanoDown = true;
        console.warn(
          `火山 TTS 不可用（HTTP ${response.status}），本次会话改用浏览器语音`
        );
      }
    } catch (e) {
      volcanoDown = true;
      console.warn("火山 TTS 请求失败，本次会话改用浏览器语音:", e);
    }
  }

  return speakViaBrowser(spoken);
}

/** 打断当前段（她点了跳过 / 离开页面） */
export function stopSegment(): void {
  if (currentSegment) {
    currentSegment.pause();
    currentSegment = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
