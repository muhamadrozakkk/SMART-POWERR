"use client";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Reading } from "@/lib/api";
import { SectionCard } from "@/components/ui/SectionCard";

const headers = ["Waktu", "Tegangan (V)", "Arus (A)", "Daya (W)", "Energi (kWh)", "Biaya (Rp)"];
export function DataHistory({ readings = [], tariffPerKwh = 0 }: { readings?: Reading[]; tariffPerKwh?: number }) {
  const router = useRouter();
  return <SectionCard title="Riwayat Data Terakhir" className="history-panel" action={<button className="text-button" onClick={() => router.push("/riwayat")}>Lihat Semua <ChevronRight size={15} /></button>}><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{readings.map((row) => <tr key={row.timestamp}><td>{new Date(row.timestamp).toLocaleTimeString("id-ID")}</td><td>{row.voltage}</td><td>{row.current}</td><td>{row.power}</td><td>{row.energy}</td><td>{(row.energy * tariffPerKwh).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</td></tr>)}</tbody></table></div>{!readings.length && <p className="muted">Belum ada pembacaan pada periode ini.</p>}<div className="table-footer"><span>Menampilkan {readings.length} data terbaru</span><div className="pagination"><button aria-label="Halaman sebelumnya" disabled><ArrowLeft size={14} /></button><span>Data sensor aktual</span><button aria-label="Halaman berikutnya" disabled><ArrowRight size={14} /></button></div></div></SectionCard>;
}
