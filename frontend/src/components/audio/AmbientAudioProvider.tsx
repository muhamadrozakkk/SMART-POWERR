"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type AudioValue = { enabled: boolean; toggle: () => void; setDucked: (ducked: boolean) => void };
const AudioContextState = createContext<AudioValue | null>(null);

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const duckedRef = useRef(false);

  const start = useCallback(async () => {
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
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      let brown = 0;
      for (let index = 0; index < noiseData.length; index += 1) {
        brown = (brown + 0.018 * (Math.random() * 2 - 1)) / 1.018;
        noiseData[index] = brown * 3.2;
      }
      const noise = context.createBufferSource();
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noise.loop = true;
      noise.buffer = noiseBuffer;
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 210;
      noiseFilter.Q.value = 0.45;
      noiseGain.gain.value = 0.13;
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
    if (gain) gain.gain.setTargetAtTime(duckedRef.current ? 0.035 : 0.11, context.currentTime, 0.7);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem("spw_ambient_enabled", next ? "1" : "0");
    if (next) void start().catch(() => setEnabled(false));
    else if (audioRef.current && gainRef.current) gainRef.current.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.35);
  }, [enabled, start]);

  const setDucked = useCallback((ducked: boolean) => {
    duckedRef.current = ducked;
    if (audioRef.current && gainRef.current && enabled) gainRef.current.gain.setTargetAtTime(ducked ? 0.035 : 0.11, audioRef.current.currentTime, 0.2);
  }, [enabled]);

  useEffect(() => {
    const stored = window.localStorage.getItem("spw_ambient_enabled") === "1";
    const startAfterLogin = window.localStorage.getItem("spw_ambient_start_on_login") === "1";
    if (startAfterLogin) window.localStorage.removeItem("spw_ambient_start_on_login");
    const startAfterLoginEvent = () => {
      window.localStorage.removeItem("spw_ambient_start_on_login");
      window.localStorage.setItem("spw_ambient_enabled", "1");
      window.setTimeout(() => setEnabled(true), 0);
      void start().catch(() => { setEnabled(false); window.localStorage.setItem("spw_ambient_enabled", "0"); });
    };
    window.addEventListener("spw:login-success", startAfterLoginEvent);
    if (stored || startAfterLogin) {
      window.localStorage.setItem("spw_ambient_enabled", "1");
      window.setTimeout(() => setEnabled(true), 0);
      void start().catch(() => { setEnabled(false); window.localStorage.setItem("spw_ambient_enabled", "0"); });
    }
    return () => { window.removeEventListener("spw:login-success", startAfterLoginEvent); if (audioRef.current) void audioRef.current.close(); audioRef.current = null; gainRef.current = null; };
  }, [start]);

  return <AudioContextState.Provider value={{ enabled, toggle, setDucked }}>{children}</AudioContextState.Provider>;
}

export function useAmbientAudio() {
  const value = useContext(AudioContextState);
  if (!value) throw new Error("useAmbientAudio must be used within AmbientAudioProvider");
  return value;
}
