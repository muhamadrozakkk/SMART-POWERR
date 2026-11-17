"use client";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Reading } from "@/lib/api";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatWibDateTime } from "@/lib/datetime";
import { useI18n } from "@/lib/i18n";

const headers = ["Waktu (WIB)", "Tegangan (V)", "Arus (A)", "Daya (W)", "Energi (kWh)", "Biaya (Rp)"];
export function DataHistory({ readings = [], tariffPerKwh = 0 }: { readings?: Reading[]; tariffPerKwh?: number }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  return <SectionCard title="Riwayat Data Terakhir" className="history-panel" action={<button className="text-button" onClick={() => router.push("/riwayat")}>{t("Lihat Semua")} <ChevronRight size={15} /></button>}><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{t(header)}</th>)}</tr></thead><tbody>{readings.map((row) => <tr key={row.timestamp}><td>{formatWibDateTime(row.timestamp, locale === "EN" ? "en-US" : "id-ID")}</td><td>{row.voltage}</td><td>{row.current}</td><td>{row.power}</td><td>{row.energy}</td><td>{(row.energy * tariffPerKwh).toLocaleString(locale === "EN" ? "en-US" : "id-ID", { maximumFractionDigits: 0 })}</td></tr>)}</tbody></table></div>{!readings.length && <p className="muted">{t("Belum ada pembacaan pada periode ini.")}</p>}<div className="table-footer"><span>{t("Menampilkan")} {readings.length} {t("data terbaru")}</span><div className="pagination"><button aria-label={t("Halaman sebelumnya")} disabled><ArrowLeft size={14} /></button><span>{t("Data sensor aktual")}</span><button aria-label={t("Halaman berikutnya")} disabled><ArrowRight size={14} /></button></div></div></SectionCard>;
}
