"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type AudioValue = { setDucked: (ducked: boolean) => void };
const AudioContextState = createContext<AudioValue | null>(null);
const SNOWFALL_AUDIO_URL = "/audio/snowfall.mp3";
const SNOWFALL_PREVIEW_SECONDS = 20;

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const bufferPromiseRef = useRef<Promise<AudioBuffer> | null>(null);

  const start = useCallback(async () => {
    let context = contextRef.current;
    if (!context) {
      context = new AudioContext();
      const gain = context.createGain();
      gain.gain.value = 0.22;
      gain.connect(context.destination);
      contextRef.current = context;
      gainRef.current = gain;
    }
    await context.resume();

    if (!bufferPromiseRef.current) {
      bufferPromiseRef.current = fetch(SNOWFALL_AUDIO_URL)
        .then((response) => {
          if (!response.ok) throw new Error("Snowfall audio could not be loaded");
          return response.arrayBuffer();
        })
        .then((data) => context!.decodeAudioData(data))
        .then((buffer) => { bufferRef.current = buffer; return buffer; });
    }
    const buffer = bufferRef.current ?? await bufferPromiseRef.current;
    if (sourceRef.current) return;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = Math.min(SNOWFALL_PREVIEW_SECONDS, buffer.duration);
    source.connect(gainRef.current!);
    source.start(0, 0);
    sourceRef.current = source;
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    const context = contextRef.current;
    if (context && gainRef.current) {
      gainRef.current.gain.setTargetAtTime(ducked ? 0.06 : 0.22, context.currentTime, 0.25);
    }
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
      sourceRef.current?.stop();
      sourceRef.current = null;
      if (contextRef.current) void contextRef.current.close();
      contextRef.current = null;
      gainRef.current = null;
    };
  }, [start]);

  return <AudioContextState.Provider value={{ setDucked }}>{children}</AudioContextState.Provider>;
}

export function useAmbientAudio() {
  const value = useContext(AudioContextState);
  if (!value) throw new Error("useAmbientAudio must be used within AmbientAudioProvider");
  return value;
}
