"use client";

import { FormEvent, useState } from "react";
import { Check, Copy, Cpu, KeyRound, Link2, Router } from "lucide-react";
import { apiBaseUrl, apiRequest } from "@/lib/api";
import { SectionCard } from "@/components/ui/SectionCard";

type Registration = { device_id: string; name: string; location: string; api_key: string };

export function DeviceRegistrationCard() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice(""); setRegistration(null);
    try {
      const result = await apiRequest<{ data: { device_id: string; name: string; location: string }; api_key: string; message: string }>("/api/devices", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), location: location.trim() }),
      });
      setRegistration({ ...result.data, api_key: result.api_key });
      setNotice(result.message);
      setName(""); setLocation("");
      window.dispatchEvent(new CustomEvent("spw:device-added", { detail: result.data }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Perangkat gagal didaftarkan.");
    } finally { setBusy(false); }
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch { setError("Clipboard tidak tersedia. Salin teks secara manual."); }
  }

  const endpoint = `${apiBaseUrl}/api/telemetry`;
  return <SectionCard title="Daftarkan perangkat ESP32" className="device-registration-card">
    <p className="muted device-registration-intro">Perangkat yang kamu daftarkan akan otomatis ditautkan ke akun ini. Setelah itu, masukkan kredensialnya ke firmware ESP32.</p>
    <form className="device-registration-form" onSubmit={(event) => void submit(event)}>
      <label className="form-field"><span>Nama perangkat</span><input className="input-control" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="Contoh: ESP32 ruang tamu" required /></label>
      <label className="form-field"><span>Lokasi</span><input className="input-control" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={240} placeholder="Contoh: Rumah · ruang tamu" required /></label>
      <button className="primary-button" disabled={busy}>{busy ? "Mendaftarkan…" : "Daftarkan perangkat"}</button>
    </form>
    {notice && <p className="settings-status" role="status">{notice}</p>}
    {error && <p className="settings-status" role="alert">{error}</p>}
    {registration && <div className="device-credentials" aria-live="polite">
      <h3><Check size={18} /> Perangkat siap dikonfigurasi</h3>
      <p>API key hanya ditampilkan sekarang. Salin dan simpan sebelum menutup atau memuat ulang halaman.</p>
      <div className="device-credential-row"><span><Cpu size={15} /> Device ID</span><code>{registration.device_id}</code><button type="button" className="secondary-button" onClick={() => void copy("id", registration.device_id)}>{copied === "id" ? <Check size={14} /> : <Copy size={14} />}{copied === "id" ? "Tersalin" : "Salin"}</button></div>
      <div className="device-credential-row"><span><KeyRound size={15} /> API Key</span><code>{registration.api_key}</code><button type="button" className="secondary-button" onClick={() => void copy("key", registration.api_key)}>{copied === "key" ? <Check size={14} /> : <Copy size={14} />}{copied === "key" ? "Tersalin" : "Salin"}</button></div>
      <div className="device-credential-row"><span><Link2 size={15} /> Endpoint</span><code>{endpoint}</code><button type="button" className="secondary-button" onClick={() => void copy("endpoint", endpoint)}>{copied === "endpoint" ? <Check size={14} /> : <Copy size={14} />}{copied === "endpoint" ? "Tersalin" : "Salin"}</button></div>
      <div className="device-setup-note"><Router size={17} /><span>Masukkan Device ID dan API Key ini ke firmware, lalu upload ke ESP32 lewat USB satu kali. Perangkat akan muncul online setelah mengirim data.</span></div>
    </div>}
  </SectionCard>;
}
