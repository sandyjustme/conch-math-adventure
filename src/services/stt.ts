let recognition: SpeechRecognition | null = null;

export function isSTTSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(
  lang: string,
  onResult: (text: string) => void,
  onEnd: () => void
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

  recognition.onend = onEnd;
  recognition.onerror = () => onEnd();

  recognition.start();
  return true;
}

export function stopListening(): void {
  recognition?.stop();
  recognition = null;
}
