import { useCallback } from "react";
import useStore from "../store/useStore";
import {
  sfxCorrect,
  sfxCollect,
  sfxPearl,
  sfxError,
  sfxLevelUp,
} from "../services/audio";

export function useAudio() {
  const sfxEnabled = useStore((s) => s.sfxEnabled);

  const playIfEnabled = useCallback(
    (fn: () => void) => {
      if (sfxEnabled) fn();
    },
    [sfxEnabled]
  );

  return {
    correct: useCallback(() => playIfEnabled(sfxCorrect), [playIfEnabled]),
    collect: useCallback(() => playIfEnabled(sfxCollect), [playIfEnabled]),
    pearl: useCallback(() => playIfEnabled(sfxPearl), [playIfEnabled]),
    error: useCallback(() => playIfEnabled(sfxError), [playIfEnabled]),
    levelUp: useCallback(() => playIfEnabled(sfxLevelUp), [playIfEnabled]),
  };
}
