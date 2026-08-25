"use client";

import { useEffect, useState } from "react";
import { Bell, Save, SlidersHorizontal } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

type SettingsState = {
  powerLimit: number;
  monthlyCostTarget: number;
  monitoringIntervalSeconds: number;
  highUsageNotifications: boolean;
  dailySummary: boolean;
};

const defaults: SettingsState = { powerLimit: 1500, monthlyCostTarget: 250000, monitoringIntervalSeconds: 5, highUsageNotifications: true, dailySummary: true };

export default function SettingsPage() {
  const [values, setValues] = useState<SettingsState>(defaults);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    apiRequest<{ data: SettingsState }>("/api/settings").then((payload) => { setValues(payload.data); setApiConnected(true); }).catch(() => { setApiConnected(false); setStatus("Backend belum terhubung — memakai pengaturan lokal."); });
  }, []);

  function updateValue<Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = await apiRequest<{ data: SettingsState }>("/api/settings", { method: "PATCH", body: JSON.stringify(values) });
      setValues(payload.data);
      setApiConnected(true);
      setStatus("Perubahan tersimpan ke backend.");
    } catch {
      setApiConnected(false);
      setStatus("Perubahan tersimpan di sesi ini. Hubungkan NEXT_PUBLIC_API_URL untuk penyimpanan backend.");
    } finally {
      setSaving(false);
    }
  }

  return <><PageHeader title="Pengaturan" description="Sesuaikan batas penggunaan dan preferensi notifikasi Anda." action={<button className="primary-button" onClick={handleSave} disabled={saving}><Save size={15} />{saving ? "Menyimpan..." : status.startsWith("Perubahan") ? "Tersimpan" : "Simpan perubahan"}</button>} />{status ? <p className="settings-status">{status}</p> : null}<div className="two-column"><SectionCard title="Batas penggunaan"><div className="form-grid"><div className="form-field"><label htmlFor="limit">Batas daya konsumsi</label><input id="limit" type="number" value={values.powerLimit} onChange={(event) => updateValue("powerLimit", Number(event.target.value))} /><small className="muted">Watt</small></div><div className="form-field"><label htmlFor="target">Target biaya bulanan</label><input id="target" type="number" value={values.monthlyCostTarget} onChange={(event) => updateValue("monthlyCostTarget", Number(event.target.value))} /><small className="muted">Rupiah</small></div><div className="form-field"><label htmlFor="interval">Interval monitoring</label><select id="interval" value={values.monitoringIntervalSeconds} onChange={(event) => updateValue("monitoringIntervalSeconds", Number(event.target.value))}><option value={5}>5 detik</option><option value={10}>10 detik</option><option value={30}>30 detik</option></select></div></div></SectionCard><SectionCard title="Preferensi notifikasi"><div className="toggle-row"><span><Bell size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Notifikasi penggunaan tinggi</span><button className={`toggle ${values.highUsageNotifications ? "on" : ""}`} onClick={() => updateValue("highUsageNotifications", !values.highUsageNotifications)} aria-label="Toggle notifikasi" /></div><div className="toggle-row"><span><SlidersHorizontal size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Ringkasan harian</span><button className={`toggle ${values.dailySummary ? "on" : ""}`} onClick={() => updateValue("dailySummary", !values.dailySummary)} aria-label="Toggle ringkasan harian" /></div><p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>Pengaturan dapat disimpan ke endpoint backend dan tetap memiliki fallback lokal.</p></SectionCard></div><SectionCard title="Informasi integrasi" className="data-panel"><div className="info-list"><div className="info-row"><span>Sumber data saat ini</span><strong>Mock data</strong></div><div className="info-row"><span>Backend API</span><strong style={{ color: apiConnected ? "#34dc6c" : "#ffc13c" }}>{apiConnected ? "Tersedia" : "Belum terhubung"}</strong></div><div className="info-row"><span>Integrasi ESP32</span><strong style={{ color: "#ffc13c" }}>Tahap desain</strong></div></div></SectionCard></>;
}
