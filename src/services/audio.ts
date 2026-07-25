let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  startTime?: number
) {
  const ctx = getCtx();
  const t = startTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/** 答对 — 清脆三角铁 + 延音 */
export function sfxCorrect() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(880, 0.12, "triangle", t);
  playTone(1100, 0.15, "triangle", t + 0.06);
}

/** 收集 — 轻快的叮 */
export function sfxCollect() {
  playTone(1047, 0.1, "triangle");
}

/** 获得珍珠 — 叠音宝石落地感 */
export function sfxPearl() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(1319, 0.1, "sine", t);
  playTone(1568, 0.15, "sine", t + 0.06);
  playTone(1760, 0.18, "sine", t + 0.12);
}

/** 答错 — 柔和降调（不刺耳） */
export function sfxError() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(330, 0.12, "triangle", t);
  playTone(260, 0.15, "triangle", t + 0.1);
}

/** 过关/升级 — 8音阶上行旋律 + 结尾和弦（1.5s） */
export function sfxLevelUp() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  notes.forEach((n, i) => playTone(n, 0.12, "sine", t + i * 0.08));
  playTone(1047, 0.3, "triangle", t + notes.length * 0.08);
  playTone(1319, 0.3, "triangle", t + notes.length * 0.08 + 0.05);
}

/** 里程碑庆典 — 3秒完整旋律 */
export function sfxCelebration() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const fanfare = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
  fanfare.forEach((n, i) => playTone(n, 0.18, "sine", t + i * 0.12));
  playTone(1568, 0.5, "triangle", t + fanfare.length * 0.12);
  playTone(1319, 0.5, "triangle", t + fanfare.length * 0.12 + 0.05);
  playTone(1047, 0.5, "triangle", t + fanfare.length * 0.12 + 0.1);
}
