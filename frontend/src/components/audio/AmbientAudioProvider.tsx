"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type AudioValue = { setDucked: (ducked: boolean) => void };
const AudioContextState = createContext<AudioValue | null>(null);
const SNOWFALL_AUDIO_URL = "/audio/snowfall.mp3";
const SNOWFALL_PREVIEW_SECONDS = 20;

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const duckedRef = useRef(false);

  const start = useCallback(async () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(SNOWFALL_AUDIO_URL);
      audio.loop = true;
      audio.preload = "none";
      audio.volume = duckedRef.current ? 0.06 : 0.22;
      audio.addEventListener("timeupdate", () => {
        if (audio && audio.currentTime >= SNOWFALL_PREVIEW_SECONDS) audio.currentTime = 0;
      });
      audioRef.current = audio;
    }
    if (audio.paused) await audio.play();
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    duckedRef.current = ducked;
    if (audioRef.current) audioRef.current.volume = ducked ? 0.06 : 0.22;
  }, []);

  useEffect(() => {
    const startFromGesture = () => {
      void start().catch(() => undefined);
      window.removeEventListener("pointerdown", startFromGesture);
      window.removeEventListener("keydown", startFromGesture);
    };
    const startAfterLogin = () => { void start().catch(() => undefined); };
    window.addEventListener("spw:login-success", startAfterLogin);
    window.addEventListener("pointerdown", startFromGesture);
    window.addEventListener("keydown", startFromGesture);
    return () => {
      window.removeEventListener("spw:login-success", startAfterLogin);
      window.removeEventListener("pointerdown", startFromGesture);
      window.removeEventListener("keydown", startFromGesture);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [start]);

  return <AudioContextState.Provider value={{ setDucked }}>{children}</AudioContextState.Provider>;
}

export function useAmbientAudio() {
  const value = useContext(AudioContextState);
  if (!value) throw new Error("useAmbientAudio must be used within AmbientAudioProvider");
  return value;
}
