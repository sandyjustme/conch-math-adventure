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

export function stopSpeech(): void {
  TTS_CACHE.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}
