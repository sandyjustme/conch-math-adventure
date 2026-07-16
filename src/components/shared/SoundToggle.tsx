import useStore from "../../store/useStore";

export default function SoundToggle() {
  const ttsEnabled = useStore((s) => s.ttsEnabled);
  const sfxEnabled = useStore((s) => s.sfxEnabled);
  const toggleTts = useStore((s) => s.toggleTts);
  const toggleSfx = useStore((s) => s.toggleSfx);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTts}
        className={`text-lg px-1.5 py-0.5 rounded-full transition ${
          ttsEnabled ? "opacity-100" : "opacity-30"
        }`}
        aria-label={ttsEnabled ? "关闭语音" : "开启语音"}
      >
        🔊
      </button>
      <button
        onClick={toggleSfx}
        className={`text-lg px-1.5 py-0.5 rounded-full transition ${
          sfxEnabled ? "opacity-100" : "opacity-30"
        }`}
        aria-label={sfxEnabled ? "关闭音效" : "开启音效"}
      >
        🎵
      </button>
    </div>
  );
}
