"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type Reading, type Settings } from "@/lib/api";

const tariffs = [
  { id: "R1_900VA", label: "R-1/TR 900 VA subsidi (prabayar)", rate: 605 },
  { id: "R1_900VA_RTM", label: "R-1/TR 900 VA-RTM", rate: 1352 },
  { id: "R1_1300VA", label: "R-1/TR 1.300 VA", rate: 1444.7 },
  { id: "R1_2200VA", label: "R-1/TR 2.200 VA", rate: 1444.7 },
  { id: "R2_3500VA", label: "R-2/TR 3.500–5.500 VA", rate: 1699.53 },
  { id: "R3_6600VA", label: "R-3 6.600 VA ke atas", rate: 1699.53 },
];

export function UserControls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [selected, setSelected] = useState(tariffs[2]);
  const [limit, setLimit] = useState("2200");
  const [currentLimit, setCurrentLimit] = useState("10");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSettings = useCallback(async () => {
    const results = await Promise.allSettled([apiRequest<Settings>("/api/settings"), apiRequest<Reading>("/api/telemetry/latest")]);
    const config = results[0];
    if (config.status === "fulfilled") {
      setSettings(config.value); setLimit(String(config.value.power_limit_w)); setCurrentLimit(String(config.value.max_current_limit_a));
      setSelected(tariffs.find((item) => item.id === config.value.tariff_class) ?? tariffs[2]); setNotice("");
    } else setNotice(config.reason instanceof Error ? config.reason.message : "Pengaturan pengguna gagal dimuat");
    setLatest(results[1].status === "fulfilled" ? results[1].value : null);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => { if (!active) return; await loadSettings(); };
    const onDeviceAdded = () => void load();
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 5000);
    window.addEventListener("spw:device-added", onDeviceAdded);
    return () => { active = false; window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("spw:device-added", onDeviceAdded); };
  }, [loadSettings]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await apiRequest<Settings>("/api/settings", { method: "PUT", body: JSON.stringify({ tariff_class: selected.id, tariff_per_kwh: selected.rate, power_limit_w: Number(limit), max_current_limit_a: Number(currentLimit) }) });
      setSettings(result); setNotice("Golongan tarif dan batas daya berhasil disimpan.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Pengaturan gagal disimpan"); }
    finally { setBusy(false); }
  }

  const isOverLimit = Boolean(latest && settings && latest.power > Number(limit || settings.power_limit_w));
  const isOverCurrent = Boolean(latest && settings && latest.current > Number(currentLimit || settings.max_current_limit_a));
  if (!settings) return <section className="panel-card user-settings-empty">
    <div className="panel-heading"><h2>Pengaturan pemakaian</h2></div>
    <p className="settings-status">{notice || "Daftarkan perangkat terlebih dahulu agar tarif dan batas pemakaian dapat diatur."}</p>
  </section>;

  return <section className="panel-card user-controls-card">
    <div className="panel-heading"><div><h2>Tarif dan batas pemakaian</h2><p className="muted">Atur estimasi biaya dan ambang notifikasi untuk perangkatmu.</p></div></div>
    {(isOverLimit || isOverCurrent) && <p className="login-error" role="alert">Peringatan pemakaian: {isOverLimit ? `daya ${latest?.power.toLocaleString("id-ID")} W melebihi batas ${Number(limit || settings?.power_limit_w).toLocaleString("id-ID")} W` : ""}{isOverLimit && isOverCurrent ? "; " : ""}{isOverCurrent ? `arus ${latest?.current.toLocaleString("id-ID")} A melebihi batas ${Number(currentLimit || settings?.max_current_limit_a).toLocaleString("id-ID")} A` : ""}. Sinyal buzzer dimasukkan ke antrean ESP32.</p>}
    {notice && <p className="settings-status" role="status">{notice}</p>}
    <form className="form-grid user-controls-form" onSubmit={save}>
      <label className="form-field"><span>Golongan tarif PLN</span><select className="input-control" value={selected.id} onChange={(event) => setSelected(tariffs.find((item) => item.id === event.target.value) ?? tariffs[2])}>{tariffs.map((item) => <option key={item.id} value={item.id}>{item.label} · Rp {item.rate.toLocaleString("id-ID")}/kWh</option>)}</select></label>
      <label className="form-field"><span>Batas maksimum daya (W)</span><input className="input-control" type="number" min="100" max="30000" step="50" value={limit} onChange={(event) => setLimit(event.target.value)} required /></label>
      <label className="form-field"><span>Batas maksimum arus (A)</span><input className="input-control" type="number" min="0.1" max="100" step="0.1" value={currentLimit} onChange={(event) => setCurrentLimit(event.target.value)} required /></label>
      <div><button className="primary-button" disabled={busy || !settings}>{busy ? "Menyimpan..." : "Simpan pengaturan"}</button><p className="muted" style={{ fontSize: 11 }}>Estimasi memakai tarif energi dasar dan belum termasuk pajak/biaya administrasi. Alert ditampilkan di dashboard saat daya melewati batas.</p></div>
    </form>
  </section>;
}
