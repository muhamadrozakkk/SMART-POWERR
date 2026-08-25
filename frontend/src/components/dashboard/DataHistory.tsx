"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { recentReadings } from "@/data/dummyData";
import { SectionCard } from "@/components/ui/SectionCard";

const headers = ["Waktu", "Tegangan (V)", "Arus (A)", "Daya (W)", "Energi (kWh)", "Biaya (Rp)"];

export function DataHistory() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = 58;
  function changePage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount));
  }
  return <SectionCard title="Riwayat Data Terakhir" className="history-panel" action={<button className="text-button" onClick={() => router.push("/riwayat")}>Lihat Semua <ChevronRight size={15} /></button>}><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{recentReadings.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div><div className="table-footer"><span>Menampilkan 5 dari 288 data · Halaman {currentPage}</span><div className="pagination"><button aria-label="Halaman sebelumnya" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}><ArrowLeft size={14} /></button>{[1, 2, 3, 4, 5].map((page) => <button key={page} className={currentPage === page ? "selected" : ""} onClick={() => changePage(page)} aria-label={`Halaman ${page}`}>{page}</button>)}<span>...</span><button className={currentPage === pageCount ? "selected" : ""} onClick={() => changePage(pageCount)}>58</button><button aria-label="Halaman berikutnya" onClick={() => changePage(currentPage + 1)} disabled={currentPage === pageCount}><ArrowRight size={14} /></button></div></div></SectionCard>;
}
