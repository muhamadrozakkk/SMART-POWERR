"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [config, reading] = await Promise.all([apiRequest<Settings>("/api/settings"), apiRequest<Reading>("/api/readings/latest")]);
        if (!active) return;
        setSettings(config); setLatest(reading); setLimit(String(config.power_limit_w)); setCurrentLimit(String(config.max_current_limit_a));
        setSelected(tariffs.find((item) => item.id === config.tariff_class) ?? tariffs[2]);
        setNotice("");
      } catch (error) { if (active) setNotice(error instanceof Error ? error.message : "Pengaturan pengguna gagal dimuat"); }
    };
    void load(); const timer = window.setInterval(() => { if (!document.hidden) void apiRequest<Reading>("/api/readings/latest").then((reading) => { if (active) setLatest(reading); }).catch(() => undefined); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

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
  return <section className="panel-card" style={{ marginBottom: 18 }}>
    <div className="panel-heading"><h2>Tarif, batas daya, dan alert</h2></div>
    {(isOverLimit || isOverCurrent) && <p className="login-error" role="alert">Peringatan pemakaian: {isOverLimit ? `daya ${latest?.power.toLocaleString("id-ID")} W melebihi batas ${Number(limit || settings?.power_limit_w).toLocaleString("id-ID")} W` : ""}{isOverLimit && isOverCurrent ? "; " : ""}{isOverCurrent ? `arus ${latest?.current.toLocaleString("id-ID")} A melebihi batas ${Number(currentLimit || settings?.max_current_limit_a).toLocaleString("id-ID")} A` : ""}. Sinyal buzzer dimasukkan ke antrean ESP32.</p>}
    {notice && <p className="settings-status" role="status">{notice}</p>}
    <form className="form-grid" onSubmit={save}>
      <label className="form-field"><span>Golongan tarif PLN</span><select className="input-control" value={selected.id} onChange={(event) => setSelected(tariffs.find((item) => item.id === event.target.value) ?? tariffs[2])}>{tariffs.map((item) => <option key={item.id} value={item.id}>{item.label} · Rp {item.rate.toLocaleString("id-ID")}/kWh</option>)}</select></label>
      <label className="form-field"><span>Batas maksimum daya (W)</span><input className="input-control" type="number" min="100" max="30000" step="50" value={limit} onChange={(event) => setLimit(event.target.value)} required /></label>
      <label className="form-field"><span>Batas maksimum arus (A)</span><input className="input-control" type="number" min="0.1" max="100" step="0.1" value={currentLimit} onChange={(event) => setCurrentLimit(event.target.value)} required /></label>
      <div><button className="primary-button" disabled={busy || !settings}>{busy ? "Menyimpan..." : "Simpan pengaturan"}</button><p className="muted" style={{ fontSize: 11 }}>Estimasi memakai tarif energi dasar dan belum termasuk pajak/biaya administrasi. Alert ditampilkan di dashboard saat daya melewati batas.</p></div>
    </form>
  </section>;
}
