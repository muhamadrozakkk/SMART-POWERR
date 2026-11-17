import { Activity, Clock3, Lightbulb } from "lucide-react";

export function EnergyRecommendations() {
  return <section className="energy-recommendations" aria-label="Rekomendasi hemat energi">
    <div className="energy-recommendations-heading"><span><Lightbulb size={19} /></span><div><small>SMART POWER INSIGHT</small><h2>Rekomendasi penggunaan energi</h2></div></div>
    <p className="energy-recommendations-intro">Saran praktis untuk pemantauan satu meter pada jalur masuk rumah.</p>
    <div className="energy-recommendation-grid">
      <article><Activity size={17} /><div><strong>Perhatikan daya puncak</strong><span>Bandingkan grafik daya pada jam berbeda untuk mengenali waktu pemakaian tertinggi.</span></div></article>
      <article><Clock3 size={17} /><div><strong>Atur waktu pemakaian</strong><span>Jika memungkinkan, sebarkan penggunaan beban besar agar tidak menyala bersamaan.</span></div></article>
      <article><Lightbulb size={17} /><div><strong>Gunakan data kWh</strong><span>Tinjau histori harian dan estimasi biaya untuk mengevaluasi perubahan konsumsi rumah.</span></div></article>
    </div>
    <small className="energy-recommendations-note">Saran umum; insight berdasarkan pola pembacaan akan tersedia setelah data sensor masuk. Sistem memantau total rumah dan tidak memisahkan tiap peralatan.</small>
  </section>;
}
