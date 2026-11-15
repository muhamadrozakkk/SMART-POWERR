"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, apiBaseUrl } from "@/lib/api";

type User = { id: number; name: string; email: string; role: "DEVELOPER" | "USER"; devices: Array<{ device_id: string; last_seen: string | null }> };
type Hardware = { device_id: string; name: string; is_online: boolean; ts: string | null; voltage: number | null; current: number | null; power: number | null; energy: number | null; frequency: number | null; power_factor: number | null };
type Log = { id: number; level: string; message: string; created_at: string };
type Device = { device_id: string; name: string; location: string; last_seen: string | null; user_id: number | null; owner_name?: string | null; owner_email?: string | null; is_online?: boolean };

export default function DeveloperDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [tariff, setTariff] = useState("1444.70");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [globalRelay, setGlobalRelay] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceName, setDeviceName] = useState("");
  const [deviceLocation, setDeviceLocation] = useState("");
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [userRows, deviceRows, logRows, rate, registered] = await Promise.all([
        apiRequest<{ data: User[] }>("/api/admin/users"),
        apiRequest<{ data: Hardware[] }>("/api/admin/hardware/latest"),
        apiRequest<{ data: Log[] }>("/api/admin/system/logs"),
        apiRequest<{ tariff_per_kwh: number }>("/api/admin/config/tariff"),
        apiRequest<{ data: Device[] }>("/api/admin/devices"),
      ]);
      setUsers(userRows.data); setHardware(deviceRows.data); setLogs(logRows.data); setDevices(registered.data); setTariff(String(rate.tariff_per_kwh)); setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Data developer tidak dapat dimuat"); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); const refresh = window.setInterval(() => { if (!document.hidden) void load(); }, 10000); return () => { window.clearTimeout(timer); window.clearInterval(refresh); }; }, [load]);

  async function changeRole(user: User, role: User["role"]) {
    setBusy(true); setNotice("");
    try { await apiRequest(`/api/admin/users/${user.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Role gagal diubah"); }
    finally { setBusy(false); }
  }

  async function saveTariff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const result = await apiRequest<{ tariff_per_kwh: number }>("/api/admin/config/tariff", { method: "PUT", body: JSON.stringify({ tariff_per_kwh: Number(tariff) }) }); setTariff(String(result.tariff_per_kwh)); setNotice("Tarif global tersimpan."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Tarif gagal disimpan"); }
    finally { setBusy(false); }
  }

  async function rotateToken(deviceId: string) {
    setBusy(true); setNotice("");
    try { const result = await apiRequest<{ token: string; message: string }>(`/api/admin/devices/${encodeURIComponent(deviceId)}/reset-token`, { method: "POST" }); setNewKeys((current) => ({ ...current, [deviceId]: result.token })); setNotice(`${result.message} Perbarui firmware agar memakai key baru.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Token gagal dirotasi"); }
    finally { setBusy(false); }
  }

  async function addDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await apiRequest<{ data: Device; api_key: string; message: string }>("/api/devices", { method: "POST", body: JSON.stringify({ name: deviceName, location: deviceLocation }) });
      setNewKeys((current) => ({ ...current, [result.data.device_id]: result.api_key })); setDeviceName(""); setDeviceLocation(""); setNotice(`${result.message} Salin key dan simpan ke firmware ESP32.`); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Perangkat gagal didaftarkan"); }
    finally { setBusy(false); }
  }

  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setNotice("Tersalin ke clipboard."); } catch { setNotice("Clipboard tidak tersedia di browser ini."); } }
  const payload = (deviceId: string) => JSON.stringify({ device_id: deviceId, voltage: 220.1, current: 0.52, power: 112.4, energy: 1.234, frequency: 50, power_factor: 0.98 }, null, 2);

  async function setAllRelays() {
    setBusy(true); setNotice(""); const state = !globalRelay;
    try { const result = await apiRequest<{ queued: number; state: boolean; message: string }>("/api/admin/relay", { method: "POST", body: JSON.stringify({ state }) }); setGlobalRelay(result.state); setNotice(`${result.message} ${result.queued} perangkat.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Perintah relay gagal dibuat"); }
    finally { setBusy(false); }
  }

  async function assignDevice(deviceId: string, userId: string) {
    if (!userId) return;
    setBusy(true); setNotice("");
    try { await apiRequest(`/api/admin/devices/${encodeURIComponent(deviceId)}/owner`, { method: "PUT", body: JSON.stringify({ user_id: Number(userId) }) }); setNotice(`Perangkat ${deviceId} berhasil ditautkan ke pengguna.`); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Perangkat gagal ditautkan"); }
    finally { setBusy(false); }
  }

  return <main style={{ display: "grid", gap: 18 }}>
    <header className="page-heading"><div><h1>Dashboard Developer</h1><p>Kontrol administrasi, status perangkat, dan konfigurasi sistem.</p></div></header>
    {notice && <p className="settings-status" role="status">{notice}</p>}
    <section className="stat-grid">
      <article className="panel-card"><span>Perangkat online</span><strong>{hardware.filter((device) => device.is_online).length} / {hardware.length}</strong></article>
      <article className="panel-card"><span>Pengguna terdaftar</span><strong>{users.length}</strong></article>
      <article className="panel-card"><span>Error log</span><strong>{logs.length}</strong></article>
    </section>
    <section className="panel-card"><div className="panel-heading"><h2>Kontrol relay global</h2><button className="primary-button" disabled={busy || hardware.length === 0} onClick={() => void setAllRelays()}>{globalRelay ? "Putus semua relay" : "Sambungkan semua relay"}</button></div><p className="muted">Perintah dikirim ke antrean hardware untuk semua perangkat terdaftar.</p></section>
    <section className="panel-card"><div className="panel-heading"><h2>Tambah Perangkat</h2></div><form className="filters" onSubmit={(event) => void addDevice(event)}><label>Nama perangkat<input className="input-control" value={deviceName} onChange={(event) => setDeviceName(event.target.value)} maxLength={120} required /></label><label>Lokasi<input className="input-control" value={deviceLocation} onChange={(event) => setDeviceLocation(event.target.value)} maxLength={240} required /></label><button className="primary-button" disabled={busy}>{busy ? "Menyimpan..." : "Daftarkan perangkat"}</button></form></section>
    <section className="panel-card"><div className="panel-heading"><h2>Perangkat terdaftar &amp; konfigurasi ESP32</h2></div>{devices.length === 0 ? <p className="muted">Belum ada perangkat terdaftar.</p> : devices.map((device) => <article key={device.device_id} className="data-highlight" style={{ marginTop: 12, display: "block" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><strong>{device.name} · {device.location}</strong><span>{device.is_online ? "Online" : "Offline"} · {device.owner_name ?? "Belum ditautkan"}</span></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}><code>{device.device_id}</code><button className="secondary-button" onClick={() => void copy(device.device_id)}>Copy Device ID</button><button className="secondary-button" onClick={() => void copy(`${apiBaseUrl}/api/readings`)}>Copy Endpoint URL</button><button className="secondary-button" disabled={busy} onClick={() => void rotateToken(device.device_id)}>Regenerate API Key</button></div>{newKeys[device.device_id] && <div style={{ marginTop: 10 }}><p className="settings-status">API key hanya ditampilkan di browser ini. Simpan sekarang dan perbarui firmware.</p><code style={{ wordBreak: "break-all" }}>{newKeys[device.device_id]}</code> <button className="secondary-button" onClick={() => void copy(newKeys[device.device_id])}>Copy API Key</button></div>}<details style={{ marginTop: 12 }}><summary>Contoh JSON payload ESP32</summary><pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>{payload(device.device_id)}</pre><button className="secondary-button" onClick={() => void copy(payload(device.device_id))}>Copy JSON Payload</button><p className="muted">Kirim POST ke {apiBaseUrl}/api/readings dengan header <code>x-api-key: API_KEY_PERANGKAT</code>.</p></details></article>)}</section>
    <section className="panel-card"><div className="panel-heading"><h2>Health perangkat &amp; payload sensor</h2></div>
      {!hardware.length ? <p className="muted">Belum ada perangkat atau data sensor.</p> : hardware.map((device) => <article key={device.device_id} className="data-highlight" style={{ marginTop: 12, display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><strong>{device.name} · {device.device_id}</strong><span>{device.is_online ? "Online" : "Offline"} · {device.ts ? new Date(device.ts).toLocaleString("id-ID") : "Belum ada payload"}</span></div>
        <pre style={{ overflowX: "auto", marginTop: 12, color: "#dbeafa", fontSize: 12 }}>{JSON.stringify({ voltage_V: device.voltage, current_A: device.current, power_W: device.power, energy_kWh: device.energy, frequency_Hz: device.frequency, power_factor: device.power_factor }, null, 2)}</pre>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><button className="secondary-button" disabled={busy} onClick={() => void rotateToken(device.device_id)}>Reset token hardware</button><select className="input-control" defaultValue="" disabled={busy} onChange={(event) => void assignDevice(device.device_id, event.target.value)}><option value="" disabled>Tautkan perangkat ke pengguna...</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}</select></div>
      </article>)}
    </section>
    <section className="panel-card"><div className="panel-heading"><h2>Pengguna &amp; role</h2></div><div className="table-scroll"><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Perangkat</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td><select className="input-control" value={user.role} disabled={busy} onChange={(event) => void changeRole(user, event.target.value as User["role"])}><option value="USER">USER</option><option value="DEVELOPER">DEVELOPER</option></select></td><td>{user.devices.map((item) => item.device_id).join(", ") || "Belum ditautkan"}</td></tr>)}</tbody></table></div></section>
    <section className="two-column"><article className="panel-card"><div className="panel-heading"><h2>Tarif dasar global</h2></div><form onSubmit={saveTariff} className="filters"><label htmlFor="global-tariff">Tarif (Rp/kWh)</label><input id="global-tariff" className="input-control" type="number" min="0" step="0.01" value={tariff} onChange={(event) => setTariff(event.target.value)} /><button className="primary-button" disabled={busy}>Simpan tarif</button></form><small className="muted">Nilai awal mengikuti tabel tarif dalam Permen ESDM 7/2024 untuk golongan rumah tangga nonsubsidi.</small></article>
      <article className="panel-card"><div className="panel-heading"><h2>System error logs</h2></div>{logs.length ? logs.slice(0, 12).map((log) => <p key={log.id} style={{ borderBottom: "1px solid #1d456e", padding: "8px 0", margin: 0 }}><strong>{log.level.toUpperCase()}</strong> · {log.message}<small className="muted"> · {new Date(log.created_at).toLocaleString("id-ID")}</small></p>) : <p className="muted">Belum ada error yang tercatat.</p>}</article></section>
    <p className="muted">Kontrol relay fisik dan buzzer perlu didukung firmware ESP32 serta protokol command/polling; endpoint telemetry yang ada belum mengirim perintah ke perangkat.</p>
  </main>;
}
