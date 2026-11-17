"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, MapPin, Wifi, WifiOff } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatWibDateTime } from "@/lib/datetime";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { DeviceRegistrationCard } from "@/components/devices/DeviceRegistrationCard";

type Device = { device_id: string; name: string; location?: string | null; is_online: boolean; last_seen: string | null };

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const response = await apiRequest<{ data: Device[] }>("/api/devices"); setDevices(response.data); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Daftar perangkat gagal dimuat."); }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const onAdded = () => void load();
    window.addEventListener("spw:device-added", onAdded);
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 10000);
    return () => { window.clearTimeout(initial); window.removeEventListener("spw:device-added", onAdded); window.clearInterval(timer); };
  }, [load]);

  return <>
    <PageHeader title="Perangkat" description="Daftarkan dan pantau ESP32 serta sensor PZEM-004T milikmu." />
    <div className="devices-page-stack">
      <DeviceRegistrationCard />
      <SectionCard title={`Perangkat tertaut (${devices.length})`}>
        {error && <p className="settings-status" role="alert">{error}</p>}
        {devices.length === 0 ? <div className="empty-state devices-empty"><Cpu size={28} /><strong>Belum ada perangkat tertaut</strong><span>Gunakan formulir di atas. Perangkat akan muncul di sini setelah berhasil didaftarkan.</span></div> :
          <div className="registered-device-list">{devices.map((device) => <article className="registered-device" key={device.device_id}>
            <div className="registered-device-main"><span className="registered-device-icon"><Cpu size={21} /></span><div><h3>{device.name}</h3><p><MapPin size={14} /> {device.location || "Lokasi belum diisi"}</p></div></div>
            <code className="registered-device-id">{device.device_id}</code>
            <div className={`registered-device-status ${device.is_online ? "is-online" : "is-offline"}`}>{device.is_online ? <Wifi size={16} /> : <WifiOff size={16} />}{device.is_online ? "Online" : "Offline"}</div>
            <small>Terakhir terlihat: {device.last_seen ? formatWibDateTime(device.last_seen) : "Belum pernah mengirim data"}</small>
          </article>)}</div>}
      </SectionCard>
    </div>
  </>;
}
