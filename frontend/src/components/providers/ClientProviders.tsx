"use client";

import { I18nProvider } from "@/lib/i18n";
import { AmbientAudioProvider } from "@/components/audio/AmbientAudioProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider><AmbientAudioProvider>{children}</AmbientAudioProvider></I18nProvider>;
}
