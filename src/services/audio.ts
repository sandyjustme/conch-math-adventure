let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine"
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function sfxCorrect() {
  playTone(523, 0.1);
  setTimeout(() => playTone(659, 0.1), 100);
  setTimeout(() => playTone(784, 0.15), 200);
}

export function sfxCollect() {
  playTone(880, 0.08, "triangle");
}

export function sfxPearl() {
  playTone(1047, 0.12, "sine");
  setTimeout(() => playTone(1319, 0.2, "sine"), 120);
}

export function sfxError() {
  playTone(200, 0.15, "square");
}

export function sfxLevelUp() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15), i * 120));
}

/* 浏览器自带语音朗读（免费，Chrome 用）*/
let speaking = false;
export function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 200));
    u.lang = "zh-CN";
    u.rate = 0.95;
    u.pitch = 1.1;
    u.onend = () => {
      speaking = false;
      resolve();
    };
    u.onerror = () => {
      speaking = false;
      resolve();
    };
    speaking = true;
    window.speechSynthesis.speak(u);
  });
}
export function stopSpeak() {
  window.speechSynthesis?.cancel();
  speaking = false;
}
export function isSpeaking() {
  return speaking;
}
