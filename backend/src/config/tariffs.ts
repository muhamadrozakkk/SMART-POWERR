/**
 * Nilai di bawah sengaja 0 sampai dikonfirmasi dari tarif PLN resmi.
 * Jangan menganggap placeholder ini sebagai tarif komersial yang berlaku.
 */
export const PLN_TARIFFS = {
  CUSTOM: { tariff_per_kwh: 0, note: "VERIFIKASI DENGAN TARIF RESMI PLN" },
  R1_900VA: { tariff_per_kwh: 0, note: "VERIFIKASI DENGAN TARIF RESMI PLN" },
  R1_1300VA: { tariff_per_kwh: 0, note: "VERIFIKASI DENGAN TARIF RESMI PLN" },
  R1_2200VA: { tariff_per_kwh: 0, note: "VERIFIKASI DENGAN TARIF RESMI PLN" },
} as const;
