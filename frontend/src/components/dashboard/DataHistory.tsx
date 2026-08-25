import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { recentReadings } from "@/data/dummyData";
import { SectionCard } from "@/components/ui/SectionCard";

const headers = ["Waktu", "Tegangan (V)", "Arus (A)", "Daya (W)", "Energi (kWh)", "Biaya (Rp)"];
export function DataHistory() {
  return <SectionCard title="Riwayat Data Terakhir" className="history-panel" action={<button className="text-button">Lihat Semua <ChevronRight size={15} /></button>}><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{recentReadings.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div><div className="table-footer"><span>Menampilkan 5 dari 288 data</span><div className="pagination"><button aria-label="Halaman sebelumnya"><ArrowLeft size={14} /></button><button className="selected">1</button><button>2</button><button>3</button><button>4</button><button>5</button><span>...</span><button>58</button><button aria-label="Halaman berikutnya"><ArrowRight size={14} /></button></div></div></SectionCard>;
}
