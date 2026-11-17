"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type AudioValue = { setDucked: (ducked: boolean) => void; ambientEnabled: boolean; setAmbientEnabled: (enabled: boolean) => void };
const AudioContextState = createContext<AudioValue | null>(null);

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const duckedRef = useRef(false);
  const enabledRef = useRef(true);
  const [ambientEnabled, setAmbientEnabledState] = useState(true);

  const start = useCallback(async (fadeIn = true) => {
    const AudioCtor = window.AudioContext;
    if (!AudioCtor) throw new Error("Web Audio API tidak tersedia");
    let context = audioRef.current;
    if (!context) {
      context = new AudioCtor();
      const master = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 360;
      filter.Q.value = 0.8;
      master.gain.value = 0;
      filter.connect(master);
      master.connect(context.destination);
      const drone = context.createGain();
      drone.gain.value = 0.24;
      drone.connect(filter);
      for (const [frequency, level, pan] of [[55, 0.36, -0.18], [82.41, 0.2, 0.18], [110, 0.1, 0]] as const) {
        const osc = context.createOscillator();
        const voiceGain = context.createGain();
        const stereo = context.createStereoPanner();
        osc.type = "sine";
        osc.frequency.value = frequency;
        voiceGain.gain.value = level;
        osc.connect(voiceGain);
        voiceGain.connect(stereo);
        stereo.pan.value = pan;
        stereo.connect(drone);
        osc.start();
      }
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 20, context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      let brown = 0;
      for (let index = 0; index < noiseData.length; index += 1) {
        const slow = Math.sin(index / context.sampleRate * Math.PI * 0.31) * 0.42;
        const fine = Math.sin(index / context.sampleRate * Math.PI * 7.7) * 0.08;
        brown = (brown + 0.018 * (Math.sin(index * 12.9898) * 0.35 + slow + fine)) / 1.018;
        noiseData[index] = brown * 3.2;
      }
      const noise = context.createBufferSource();
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noise.loop = true;
      noise.buffer = noiseBuffer;
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 260;
      noiseFilter.Q.value = 0.45;
      noiseGain.gain.value = 0.16;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(filter);
      noise.start();
      const slowLfo = context.createOscillator();
      const lfoGain = context.createGain();
      slowLfo.frequency.value = 0.055;
      lfoGain.gain.value = 90;
      slowLfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      slowLfo.start();
      audioRef.current = context;
      gainRef.current = master;
    }
    await context.resume();
    const gain = gainRef.current;
    if (gain) {
      if (fadeIn) gain.gain.setTargetAtTime(enabledRef.current ? (duckedRef.current ? 0.015 : 0.05) : 0, context.currentTime, 1.5);
      else gain.gain.setValueAtTime(0, context.currentTime);
    }
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    duckedRef.current = ducked;
    if (audioRef.current && gainRef.current) gainRef.current.gain.setTargetAtTime(enabledRef.current ? (ducked ? 0.015 : 0.05) : 0, audioRef.current.currentTime, 0.2);
  }, []);

  const setAmbientEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    setAmbientEnabledState(enabled);
    window.localStorage.setItem("spw_ambient_enabled", enabled ? "1" : "0");
    if (!enabled) {
      if (audioRef.current && gainRef.current) gainRef.current.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.25);
      return;
    }
    void start(true).catch(() => undefined);
  }, [start]);

  useEffect(() => {
    let syncSavedPreference: number | undefined;
    const primeFromGesture = () => { void start(false).catch(() => undefined); window.removeEventListener("pointerdown", primeFromGesture); window.removeEventListener("keydown", primeFromGesture); };
    const saved = window.localStorage.getItem("spw_ambient_enabled");
    if (saved === "0") {
      enabledRef.current = false;
      syncSavedPreference = window.setTimeout(() => setAmbientEnabledState(false), 0);
    }
    const startAfterLogin = () => { if (enabledRef.current) void start(true).catch(() => undefined); };
    window.addEventListener("spw:login-success", startAfterLogin);
    window.addEventListener("pointerdown", primeFromGesture);
    window.addEventListener("keydown", primeFromGesture);
    return () => { if (syncSavedPreference !== undefined) window.clearTimeout(syncSavedPreference); window.removeEventListener("spw:login-success", startAfterLogin); window.removeEventListener("pointerdown", primeFromGesture); window.removeEventListener("keydown", primeFromGesture); if (audioRef.current) void audioRef.current.close(); audioRef.current = null; gainRef.current = null; };
  }, [start]);

  return <AudioContextState.Provider value={{ setDucked, ambientEnabled, setAmbientEnabled }}>{children}</AudioContextState.Provider>;
}

export function useAmbientAudio() {
  const value = useContext(AudioContextState);
  if (!value) throw new Error("useAmbientAudio must be used within AmbientAudioProvider");
  return value;
}
