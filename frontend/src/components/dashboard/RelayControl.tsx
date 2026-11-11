"use client";

import { useEffect, useState } from "react";
import { Power } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { apiRequest } from "@/lib/api";

export function RelayControl() {
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void apiRequest<{ state: boolean }>("/api/user/relay").then((result) => { if (active) { setConnected(result.state); setLoaded(true); } }).catch((reason) => { if (active) { setError(reason instanceof Error ? reason.message : "Relay tidak dapat dimuat"); setLoaded(true); } }); return () => { active = false; }; }, []);
  async function toggleRelay() { const state = !connected; setError(""); try { await apiRequest("/api/user/relay", { method: "PUT", body: JSON.stringify({ state }) }); setConnected(state); } catch (reason) { setError(reason instanceof Error ? reason.message : "Perintah relay gagal"); } }
  return <SectionCard className="summary-card relay-card"><div className="summary-icon icon-blue"><Power size={18} /></div><h3>Status Relay</h3><div className="relay-status"><span className={`relay-indicator ${connected ? "active" : ""}`} />{loaded ? connected ? "Beban tersambung" : "Beban terputus" : "Memuat status..."}</div><button className={`toggle relay-toggle ${connected ? "on" : ""}`} onClick={() => void toggleRelay()} disabled={!loaded} aria-pressed={connected} aria-label="Ubah status relay"><span /></button><p>{error || "Perintah relay dikirim ke antrean ESP32."}</p></SectionCard>;
}
