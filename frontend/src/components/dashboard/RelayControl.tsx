"use client";

import { useState } from "react";
import { Power } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function RelayControl() {
  const [connected, setConnected] = useState(true);
  return <SectionCard className="summary-card relay-card"><div className="summary-icon icon-blue"><Power size={18} /></div><h3>Status Relay</h3><div className="relay-status"><span className={`relay-indicator ${connected ? "active" : ""}`} />{connected ? "Terhubung" : "Terputus"}</div><button className={`toggle relay-toggle ${connected ? "on" : ""}`} onClick={() => setConnected((value) => !value)} aria-pressed={connected} aria-label="Ubah status relay"><span /></button><p>{connected ? "Beban dapat dikendalikan" : "Relay sedang diputus"}</p></SectionCard>;
}
