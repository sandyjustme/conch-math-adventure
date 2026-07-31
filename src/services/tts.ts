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
  stopSegment();
}

/* ═══════════════════════════════════════════
   短剧播放：一段读完才 resolve，播放器据此自动推进下一段
   ═══════════════════════════════════════════ */

/** 火山连续失败后就不再浪费往返，直接走浏览器语音 */
let volcanoDown = false;

/** 最近一次朗读的诊断信息，供 ?debug=1 时在页面上显示 */
export const ttsDiag = {
  path: "-" as string,
  fetchMs: 0,
  bytes: 0,
  playMs: 0,
  result: "-" as string,
  error: "" as string,
};

/* ── 自动播放解锁 ──────────────────────────────
   浏览器只允许在用户手势的授权窗口内发起播放。剧集是一拍接一拍
   自动往下走的，第二拍之后都发生在异步回调里，手势早就过期了。

   对策：全程复用**同一个** Audio 元素，并在用户点「继续听」的同步
   上下文里先 play 一次静音 —— 元素一旦被手势解锁，后续换 src 再
   play 就不再受限。每拍新建 Audio 是行不通的，新元素没被解锁过。
   ────────────────────────────────────────── */

/**
 * 0.032 秒的真实静音采样（8kHz / 8bit / 单声道）。
 * 不能用 0 字节音频数据的空 WAV —— iOS Safari 会直接拒绝，解锁不成立。
 */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

let player: HTMLAudioElement | null = null;

function getPlayer(): HTMLAudioElement {
  if (!player) {
    player = new Audio();
    player.preload = "auto";
  }
  return player;
}

/** 必须在用户点击的同步上下文里调用（点「继续听」、点选项时） */
export function unlockAudio(): void {
  try {
    const a = getPlayer();
    a.src = SILENT_WAV;
    void a.play().catch(() => {
      /* 解锁失败就靠 speakViaBrowser 兜底 */
    });
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // 同理解锁 Web Speech。用一个空格而不是空串 —— 空串在 Safari 上
      // 可能被直接丢弃，达不到解锁效果。
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
    }
  } catch {
    /* 解锁是尽力而为，失败不影响后续流程 */
  }
}

/**
 * 浏览器内置语音合成兜底。
 * 音质不如火山，但零配置、离线可用 —— 保证故事永远念得出来，
 * 不会因为凭据没配好就退化成让孩子自己点着读字。
 */
async function speakViaBrowser(
  text: string,
  onPlaying?: () => void
): Promise<boolean> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const started = performance.now();
  const ended = await new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (v: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(v);
    };
    // 被自动播放策略拦下时，onend / onerror 一个都不会触发，
    // 不设超时这里会永远挂住 —— 界面就停在「正在念…」再也不动。
    const timer = setTimeout(
      () => {
        window.speechSynthesis.cancel();
        done(false);
      },
      Math.max(4000, text.length * 300)
    );

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.95;
    u.onstart = () => onPlaying?.();
    u.onend = () => done(true);
    u.onerror = () => done(false);
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
export async function speakSegment(
  text: string,
  /** 音频真正开始出声时回调 —— 用来把「取音频中」和「正在念」分开显示 */
  onPlaying?: () => void
): Promise<boolean> {
  if (!text.trim()) return false;
  stopSegment();

  // 画面上保留 −7 这个数学符号，送去朗读的转成「负7」。
  // 不转的话 TTS 会按运算符读成「减七」，等于把负数概念教反了。
  const spoken = normalizeForSpeech(text).slice(0, 480);

  ttsDiag.path = volcanoDown ? "浏览器(火山已标记不可用)" : "火山";
  ttsDiag.fetchMs = 0;
  ttsDiag.bytes = 0;
  ttsDiag.playMs = 0;
  ttsDiag.result = "进行中";
  ttsDiag.error = "";
  const t0 = performance.now();

  if (!volcanoDown) {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spoken }),
        // 网络卡住时别让整个播放器跟着挂起
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const blob = await response.blob();
        ttsDiag.fetchMs = Math.round(performance.now() - t0);
        ttsDiag.bytes = blob.size;
        const url = URL.createObjectURL(blob);
        // 复用被手势解锁过的那个元素，不新建 —— 新建的没被解锁，
        // 第二拍起会被自动播放策略拦下
        const audio = getPlayer();
        audio.src = url;

        const finished = await new Promise<boolean>((resolve) => {
          let settled = false;
          const done = (v: boolean) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            audio.onended = null;
            audio.onerror = null;
            resolve(v);
          };
          // 被拦下时 play() 的 rejection 有的浏览器不抛，
          // 音频事件也不来 —— 必须有兜底超时，否则界面永远停在「正在念…」
          const timer = setTimeout(
            () => {
              audio.pause();
              done(false);
            },
            Math.max(6000, spoken.length * 400)
          );

          audio.onplaying = () => onPlaying?.();
          audio.onended = () => done(true);
          audio.onerror = () => done(false);
          audio.play().catch(() => done(false));
        });

        URL.revokeObjectURL(url);
        ttsDiag.playMs = Math.round(performance.now() - t0) - ttsDiag.fetchMs;
        if (finished) {
          ttsDiag.result = "火山播完";
          return true;
        }
        ttsDiag.error = "播放被拦或超时";
        console.warn("音频被拦截或播放失败，改用浏览器语音");
      } else {
        volcanoDown = true;
        ttsDiag.error = `HTTP ${response.status}`;
        console.warn(
          `火山 TTS 不可用（HTTP ${response.status}），本次会话改用浏览器语音`
        );
      }
    } catch (e) {
      volcanoDown = true;
      ttsDiag.fetchMs = Math.round(performance.now() - t0);
      ttsDiag.error =
        e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.warn("火山 TTS 请求失败，本次会话改用浏览器语音:", e);
    }
  }

  const ok = await speakViaBrowser(spoken, onPlaying);
  ttsDiag.path += " → 浏览器语音";
  ttsDiag.result = ok ? "浏览器念完" : "两条路都不通";
  return ok;
}

/** 打断当前段（她点了跳过 / 离开页面） */
export function stopSegment(): void {
  if (player) {
    player.pause();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
