let recognition: SpeechRecognition | null = null;

export function isSTTSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(
  lang: string,
  onResult: (text: string) => void,
  onEnd: (error?: string) => void
): boolean {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return false;

  recognition = new SR();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onend = () => onEnd();
  recognition.onerror = (event: Event) => {
    const errors: Record<string, string> = {
      "not-allowed": "麦克风被禁用了，请在浏览器设置中允许麦克风权限",
      "no-speech": "没有听到声音，再试一次～",
      "audio-capture": "找不到麦克风",
      network: "网络连接失败",
      "service-not-allowed": "语音服务不可用",
      "bad-grammar": "语音识别出错",
      "language-not-supported": "不支持中文语音识别",
    };
    const errorCode = (event as SpeechRecognitionErrorEvent).error;
    const msg = errors[errorCode] || "语音识别出了点问题";
    recognition = null;
    onEnd(msg);
  };

  recognition.start();
  return true;
}

export function stopListening(): void {
  recognition?.stop();
  recognition = null;
}
