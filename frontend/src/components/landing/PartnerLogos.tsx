import Image from "next/image";

const partnerLogos = [
  {
    src: "/partner-logos/ministry.png",
    alt: "Tut Wuri Handayani",
    width: 36,
    height: 36,
    className: "partner-logo--ministry",
  },
  {
    src: "/partner-logos/diktisaintek.png",
    alt: "Diktisaintek Berdampak",
    width: 110,
    height: 33,
    className: "partner-logo--diktisaintek",
  },
  {
    src: "/partner-logos/pkm.png",
    alt: "Program Kreativitas Mahasiswa",
    width: 88,
    height: 43,
    className: "partner-logo--pkm",
  },
  {
    src: "/partner-logos/untidar.png",
    alt: "Universitas Tidar",
    width: 40,
    height: 40,
    className: "partner-logo--untidar",
  },
  {
    src: "/partner-logos/blu.png",
    alt: "BLU Speed Universitas Tidar",
    width: 40,
    height: 40,
    className: "partner-logo--blu",
  },
];

export function PartnerLogos() {
  return (
    <div className="landing-header-partners" aria-label="Mitra dan identitas pendukung">
      {partnerLogos.map((logo) => (
        <span className={`partner-logo ${logo.className}`} key={logo.src}>
          <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} />
        </span>
      ))}
    </div>
  );
}
