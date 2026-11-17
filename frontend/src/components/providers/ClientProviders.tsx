"use client";

import { I18nProvider } from "@/lib/i18n";
import { AmbientAudioProvider } from "@/components/audio/AmbientAudioProvider";
import { AnimatedAuroraBackground } from "@/components/layout/AnimatedAuroraBackground";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider><AmbientAudioProvider><AnimatedAuroraBackground />{children}</AmbientAudioProvider></I18nProvider>;
}
