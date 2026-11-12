export const PLN_TARIFFS = {
  R1_900VA: { label: "R-1/TR 900 VA-RTM", tariff_per_kwh: 1352 },
  R1_1300VA: { label: "R-1/TR 1.300 VA", tariff_per_kwh: 1444.7 },
  R1_2200VA: { label: "R-1/TR 2.200 VA", tariff_per_kwh: 1444.7 },
  R2_3500_5500VA: { label: "R-2/TR 3.500-5.500 VA", tariff_per_kwh: 1699.53 },
  R3_6600VA: { label: "R-3/TR atau TM 6.600 VA ke atas", tariff_per_kwh: 1699.53 },
} as const;

export const TARIFF_SOURCE = "Tarif PLN Triwulan IV 2026; estimasi energi x tarif per kWh, di luar pajak/biaya lain.";
export const TARIFF_SOURCE_URL = "https://www.pln.co.id/tarif-listrik-triwulan-iv-2026-tetap";
export const TARIFF_REGULATION_URL = "https://jdih.esdm.go.id/storage/document/Permen%20ESDM%20Nomor%207%20Tahun%202024.pdf";
