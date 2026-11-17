"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type AudioValue = { setDucked: (ducked: boolean) => void; enabled: boolean; setEnabled: (enabled: boolean) => void };
const AudioContextState = createContext<AudioValue | null>(null);
const SNOWFALL_AUDIO_URL = "/audio/snowfall.mp3";

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clickContextRef = useRef<AudioContext | null>(null);
  const duckedRef = useRef(false);
  const enabledRef = useRef(true);
  const [enabled, setEnabledState] = useState(true);

  const start = useCallback(async () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(SNOWFALL_AUDIO_URL);
      audio.loop = true;
      audio.preload = "none";
      audio.volume = duckedRef.current ? 0.06 : 0.22;
      audio.muted = !enabledRef.current;
      audioRef.current = audio;
    }
    if (enabledRef.current && audio.paused) await audio.play();
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    duckedRef.current = ducked;
    if (audioRef.current) audioRef.current.volume = ducked ? 0.06 : 0.22;
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    enabledRef.current = value;
    setEnabledState(value);
    try { window.localStorage.setItem("spw_ambient_enabled", value ? "1" : "0"); } catch { /* Ignore blocked storage. */ }
    if (audioRef.current) audioRef.current.muted = !value;
    if (value) void start().catch(() => undefined);
  }, [start]);

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("spw_ambient_enabled");
        if (saved === "0") { enabledRef.current = false; setEnabledState(false); }
      } catch { /* Keep default audio preference. */ }
    }, 0);
    const startFromGesture = () => {
      void start().catch(() => undefined);
      window.removeEventListener("pointerdown", startFromGesture);
      window.removeEventListener("keydown", startFromGesture);
    };
    const startAfterLogin = () => { void start().catch(() => undefined); };
    const playClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("a, button, [role='button']")) return;
      try {
        const context = clickContextRef.current ?? new AudioContext();
        clickContextRef.current = context;
        if (context.state === "suspended") void context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1050, now);
        oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.045);
        gain.gain.setValueAtTime(0.026, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.052);
      } catch { /* Ignore if Web Audio is unavailable in this browser. */ }
    };

    window.addEventListener("spw:login-success", startAfterLogin);
    window.addEventListener("pointerdown", startFromGesture);
    window.addEventListener("keydown", startFromGesture);
    document.addEventListener("click", playClick);
    return () => {
      window.removeEventListener("spw:login-success", startAfterLogin);
      window.removeEventListener("pointerdown", startFromGesture);
      window.removeEventListener("keydown", startFromGesture);
      document.removeEventListener("click", playClick);
      audioRef.current?.pause();
      audioRef.current = null;
      if (clickContextRef.current) void clickContextRef.current.close();
      clickContextRef.current = null;
      window.clearTimeout(preferenceTimer);
    };
  }, [start]);

  return <AudioContextState.Provider value={{ setDucked, enabled, setEnabled }}>{children}</AudioContextState.Provider>;
}

export function useAmbientAudio() {
  const value = useContext(AudioContextState);
  if (!value) throw new Error("useAmbientAudio must be used within AmbientAudioProvider");
  return value;
}
