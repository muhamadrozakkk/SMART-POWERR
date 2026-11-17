"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type Reading, type Settings } from "@/lib/api";

const tariffs = [
  { id: "R1_450VA_SUB", label: "R-1/TR 450 VA - subsidi", rate: 415 },
  { id: "R1_900VA_SUB", label: "R-1/TR 900 VA - subsidi", rate: 605 },
  { id: "R1_900VA", label: "R-1/TR 900 VA-RTM - nonsubsidi", rate: 1352 },
  { id: "R1_1300VA", label: "R-1/TR 1.300 VA", rate: 1444.7 },
  { id: "R1_2200VA", label: "R-1/TR 2.200 VA", rate: 1444.7 },
  { id: "R2_3500_5500VA", label: "R-2/TR 3.500-5.500 VA", rate: 1699.53 },
  { id: "R3_6600VA", label: "R-3 6.600 VA ke atas", rate: 1699.53 },
];

export function UserControls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [selected, setSelected] = useState(tariffs[3]);
  const [limit, setLimit] = useState("2200");
  const [currentLimit, setCurrentLimit] = useState("10");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSettings = useCallback(async () => {
    const results = await Promise.allSettled([apiRequest<Settings>("/api/settings"), apiRequest<Reading>("/api/telemetry/latest")]);
    const config = results[0];
    if (config.status === "fulfilled") {
      setSettings(config.value); setLimit(String(config.value.power_limit_w)); setCurrentLimit(String(config.value.max_current_limit_a));
      setSelected(tariffs.find((item) => item.id === config.value.tariff_class) ?? tariffs[3]); setNotice("");
    } else {
      setSettings(null);
      setNotice("Hubungkan perangkat terlebih dahulu untuk menyimpan pilihan tarif dan batas pemakaian.");
    }
    setLatest(results[1].status === "fulfilled" ? results[1].value : null);
  }, []);

  useEffect(() => {
    const onDeviceAdded = () => void loadSettings();
    const initial = window.setTimeout(() => void loadSettings(), 0);
    window.addEventListener("spw:device-added", onDeviceAdded);
    return () => { window.clearTimeout(initial); window.removeEventListener("spw:device-added", onDeviceAdded); };
  }, [loadSettings]);

  useEffect(() => {
    let active = true;
    const refreshReading = () => { if (!document.hidden) void apiRequest<Reading>("/api/telemetry/latest").then((value) => { if (active) setLatest(value); }).catch(() => { if (active) setLatest(null); }); };
    const initial = window.setTimeout(refreshReading, 0);
    const timer = window.setInterval(refreshReading, 60000);
    return () => { active = false; window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await apiRequest<Settings>("/api/settings", { method: "PUT", body: JSON.stringify({ tariff_class: selected.id, tariff_per_kwh: selected.rate, power_limit_w: Number(limit), max_current_limit_a: Number(currentLimit) }) });
      setSettings(result); setNotice("Golongan daya, tarif, dan batas pemakaian berhasil disimpan.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Pengaturan gagal disimpan"); }
    finally { setBusy(false); }
  }

  const isOverLimit = Boolean(latest && settings && latest.power > Number(limit || settings.power_limit_w));
  const isOverCurrent = Boolean(latest && settings && latest.current > Number(currentLimit || settings.max_current_limit_a));
  return <section className="panel-card user-controls-card">
    <div className="panel-heading"><div><h2>Tarif dan batas pemakaian</h2><p className="muted">Pilih daya PLN termasuk status subsidi, lalu atur ambang notifikasi.</p></div></div>
    {!settings && <p className="settings-status user-settings-note" role="status">{notice || "Daftarkan perangkat ESP32 terlebih dahulu untuk menyimpan pilihan tarif dan batas pemakaian. Pilihan di bawah belum tersimpan."}</p>}
    {settings && (isOverLimit || isOverCurrent) && <p className="login-error" role="alert">Peringatan pemakaian: {isOverLimit ? `daya ${latest?.power.toLocaleString("id-ID")} W melebihi batas ${Number(limit || settings.power_limit_w).toLocaleString("id-ID")} W` : ""}{isOverLimit && isOverCurrent ? "; " : ""}{isOverCurrent ? `arus ${latest?.current.toLocaleString("id-ID")} A melebihi batas ${Number(currentLimit || settings.max_current_limit_a).toLocaleString("id-ID")} A` : ""}. Sinyal buzzer dimasukkan ke antrean ESP32.</p>}
    {settings && notice && <p className="settings-status" role="status">{notice}</p>}
    <form className="form-grid user-controls-form" onSubmit={(event) => void save(event)}>
      <label className="form-field"><span>Daya terpasang &amp; golongan tarif</span><select className="input-control" value={selected.id} onChange={(event) => setSelected(tariffs.find((item) => item.id === event.target.value) ?? tariffs[3])}>{tariffs.map((item) => <option key={item.id} value={item.id}>{item.label} - Rp {item.rate.toLocaleString("id-ID")}/kWh</option>)}</select></label>
      <label className="form-field"><span>Batas maksimum daya (W)</span><input className="input-control" type="number" min="100" max="30000" step="50" value={limit} onChange={(event) => setLimit(event.target.value)} required /></label>
      <label className="form-field"><span>Batas maksimum arus (A)</span><input className="input-control" type="number" min="0.1" max="100" step="0.1" value={currentLimit} onChange={(event) => setCurrentLimit(event.target.value)} required /></label>
      <div><button className="primary-button" disabled={busy || !settings}>{busy ? "Menyimpan..." : "Simpan pengaturan"}</button><p className="muted user-controls-help">Estimasi memakai tarif energi dasar; pajak dan biaya administrasi belum termasuk. Pengaturan batas juga memicu alert dashboard.</p></div>
    </form>
  </section>;
}
