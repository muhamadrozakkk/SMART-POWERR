"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type AudioValue = { setDucked: (ducked: boolean) => void };
const AudioContextState = createContext<AudioValue | null>(null);

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
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
      filter.frequency.value = 820;
      filter.Q.value = 0.7;
      master.gain.value = 0;
      filter.connect(master);
      master.connect(context.destination);
      const drone = context.createGain();
      drone.gain.value = 0.5;
      drone.connect(filter);
      for (const [frequency, level, pan] of [[146.83, 0.18, -0.3], [220, 0.15, 0.25], [293.66, 0.12, -0.12], [369.99, 0.08, 0.3], [440, 0.06, 0]] as const) {
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
      const slowLfo = context.createOscillator();
      const lfoGain = context.createGain();
      slowLfo.frequency.value = 0.055;
      lfoGain.gain.value = 170;
      slowLfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      slowLfo.start();
      audioRef.current = context;
      gainRef.current = master;
    }
    await context.resume();
    const gain = gainRef.current;
    if (gain) {
      gain.gain.setTargetAtTime(duckedRef.current ? 0.028 : 0.14, context.currentTime, 1.2);
    }
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    duckedRef.current = ducked;
    if (audioRef.current && gainRef.current) gainRef.current.gain.setTargetAtTime(ducked ? 0.028 : 0.14, audioRef.current.currentTime, 0.2);
  }, []);

  useEffect(() => {
    const startFromGesture = () => { void start().catch(() => undefined); window.removeEventListener("pointerdown", startFromGesture); window.removeEventListener("keydown", startFromGesture); };
    const startAfterLogin = () => { void start().catch(() => undefined); };
    window.addEventListener("spw:login-success", startAfterLogin);
    window.addEventListener("pointerdown", startFromGesture);
    window.addEventListener("keydown", startFromGesture);
    return () => { window.removeEventListener("spw:login-success", startAfterLogin); window.removeEventListener("pointerdown", startFromGesture); window.removeEventListener("keydown", startFromGesture); if (audioRef.current) void audioRef.current.close(); audioRef.current = null; gainRef.current = null; };
  }, [start]);

  return <AudioContextState.Provider value={{ setDucked }}>{children}</AudioContextState.Provider>;
}

export function useAmbientAudio() {
  const value = useContext(AudioContextState);
  if (!value) throw new Error("useAmbientAudio must be used within AmbientAudioProvider");
  return value;
}
