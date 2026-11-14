import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {};

const FPS = 30;
const TOTAL_DETIK = 49;

const BIRU = "#6b8afd";
const HIJAU = "#34d399";
const MERAH = "#f87171";
const AMBER = "#fbbf24";
const FONT =
  "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Ukuran layar HP (screenshot sudah dipotong jadi 720x1508)
const PW = 440;
const PH = 922;

const KLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const kartu: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "2px solid rgba(255,255,255,0.18)",
  borderRadius: 28,
  padding: "36px 48px",
  boxSizing: "border-box",
};

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

// t = detik absolut di video, pop(at) = animasi muncul pada detik "at"
const useWaktu = (mulai: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + mulai;
  const pop = (at: number) =>
    t < at
      ? 0
      : spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 14 } });
  return { t, pop };
};

const Latar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(900px 700px at 78% 50%, rgba(65,103,245,0.30), transparent 70%), linear-gradient(135deg, #070b16, #0f1a3d)",
        fontFamily: FONT,
        color: "white",
        justifyContent: "center",
        alignItems: "center",
        opacity: o,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Adegan: React.FC<{
  mulai: number;
  selesai: number;
  children: React.ReactNode;
}> = ({ mulai, selesai, children }) => {
  const from = Math.round(mulai * FPS);
  const dur = Math.round(selesai * FPS) - from;
  return (
    <Sequence from={from} durationInFrames={dur}>
      <Latar>{children}</Latar>
    </Sequence>
  );
};

const Muncul: React.FC<{
  p: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ p, children, style }) => (
  <div
    style={{
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 40}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Chip: React.FC<{
  warna: string;
  children: React.ReactNode;
  besar?: boolean;
}> = ({ warna, children, besar }) => (
  <div
    style={{
      display: "inline-block",
      padding: besar ? "16px 40px" : "8px 22px",
      borderRadius: 999,
      border: `3px solid ${warna}`,
      color: warna,
      fontSize: besar ? 48 : 28,
      fontWeight: 800,
      background: "rgba(7,11,22,0.5)",
    }}
  >
    {children}
  </div>
);

const Centang: React.FC<{ ukuran?: number; warna?: string }> = ({
  ukuran = 48,
  warna = HIJAU,
}) => (
  <svg
    width={ukuran}
    height={ukuran}
    viewBox="0 0 24 24"
    fill="none"
    stroke={warna}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

// Kolom teks di sisi kiri (HP ada di sisi kanan)
const Kiri: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: 160,
      top: 0,
      bottom: 0,
      width: 980,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: 30,
    }}
  >
    {children}
  </div>
);

/* ---------------- HP + kamera virtual ---------------- */

type Kunci = { t: number; x: number; y: number; z: number };
type Layar = {
  src: string;
  tinggi?: number; // tinggi gambar saat lebar = PW (untuk screenshot panjang)
  dari: number;
  kunci: Kunci[];
};

// Kamera: zoom z, titik fokus (x, y) dalam pecahan 0..1 dari layar
const kamera = (t: number, kunci: Kunci[], H: number) => {
  const ts = kunci.map((k) => k.t);
  const opt = { ...KLAMP, easing: Easing.inOut(Easing.cubic) };
  const z = interpolate(t, ts, kunci.map((k) => k.z), opt);
  const x = interpolate(t, ts, kunci.map((k) => k.x), opt);
  const y = interpolate(t, ts, kunci.map((k) => k.y), opt);
  const tx = Math.min(0, Math.max(PW - z * PW, PW / 2 - z * x * PW));
  const ty = Math.min(0, Math.max(PH - z * H, PH / 2 - z * y * H));
  return `translate(${tx}px, ${ty}px) scale(${z})`;
};

// Urutan layar HP sepanjang video (waktu absolut dalam detik)
const LAYAR: Layar[] = [
  {
    src: "screens/soal-list.jpg",
    dari: 8.5,
    kunci: [
      { t: 8.5, x: 0.5, y: 0.5, z: 1 },
      { t: 12.4, x: 0.5, y: 0.42, z: 1.15 },
    ],
  },
  {
    src: "screens/latih-salah.jpg",
    dari: 12.55,
    kunci: [
      { t: 12.55, x: 0.5, y: 0.5, z: 1 },
      { t: 13.3, x: 0.5, y: 0.67, z: 1.9 },
      { t: 14.4, x: 0.5, y: 0.67, z: 1.9 },
    ],
  },
  {
    src: "screens/latih-benar.jpg",
    dari: 14.45,
    kunci: [
      { t: 14.45, x: 0.5, y: 0.5, z: 1 },
      { t: 15.4, x: 0.5, y: 0.66, z: 1.9 },
      { t: 17.6, x: 0.5, y: 0.66, z: 1.9 },
      { t: 18.4, x: 0.5, y: 0.5, z: 1 },
    ],
  },
  {
    src: "screens/simulasi-soal.jpg",
    dari: 19.38,
    kunci: [
      { t: 19.38, x: 0.5, y: 0.2, z: 1 },
      { t: 19.8, x: 0.5, y: 0.17, z: 2.2 },
      { t: 21.5, x: 0.5, y: 0.17, z: 2.2 },
      { t: 22.1, x: 0.45, y: 0.86, z: 1.8 },
      { t: 23.3, x: 0.45, y: 0.86, z: 1.8 },
    ],
  },
  {
    src: "screens/hasil.jpg",
    dari: 23.35,
    kunci: [
      { t: 23.35, x: 0.5, y: 0.3, z: 1 },
      { t: 23.9, x: 0.5, y: 0.5, z: 1.6 },
    ],
  },
  {
    src: "screens/tambah-soal.jpg",
    dari: 24.35,
    kunci: [
      { t: 24.35, x: 0.5, y: 0.5, z: 1 },
      { t: 25.0, x: 0.5, y: 0.46, z: 1.6 },
      { t: 26.0, x: 0.5, y: 0.46, z: 1.6 },
    ],
  },
  {
    src: "screens/scan-soal.jpg",
    dari: 26.1,
    kunci: [
      { t: 26.1, x: 0.5, y: 0.84, z: 1.6 },
      { t: 27.15, x: 0.5, y: 0.84, z: 1.6 },
      { t: 27.7, x: 0.5, y: 0.4, z: 1.5 },
      { t: 28.4, x: 0.5, y: 0.4, z: 1.5 },
    ],
  },
  {
    src: "screens/soal-list.jpg",
    dari: 28.46,
    kunci: [
      { t: 28.46, x: 0.5, y: 0.5, z: 1 },
      { t: 29.0, x: 0.5, y: 0.76, z: 1.8 },
      { t: 30.7, x: 0.5, y: 0.76, z: 1.8 },
    ],
  },
  {
    src: "screens/catatan.jpg",
    dari: 30.75,
    kunci: [
      { t: 30.75, x: 0.5, y: 0.4, z: 1 },
      { t: 31.4, x: 0.8, y: 0.34, z: 2.2 },
      { t: 32.3, x: 0.8, y: 0.34, z: 2.2 },
    ],
  },
  {
    src: "screens/buat-soal.jpg",
    dari: 32.4,
    kunci: [
      { t: 32.4, x: 0.5, y: 0.35, z: 1 },
      { t: 32.9, x: 0.5, y: 0.25, z: 1.4 },
      { t: 33.3, x: 0.5, y: 0.25, z: 1.4 },
    ],
  },
  {
    src: "screens/statistik.jpg",
    dari: 33.32,
    kunci: [
      { t: 33.32, x: 0.5, y: 0.5, z: 1 },
      { t: 34.6, x: 0.5, y: 0.58, z: 1.12 },
    ],
  },
  {
    src: "screens/statistik-panjang.jpg",
    tinggi: 1460,
    dari: 34.7,
    kunci: [
      { t: 34.7, x: 0.5, y: 0.15, z: 1 },
      { t: 35.4, x: 0.5, y: 0.6, z: 1.5 },
      { t: 36.4, x: 0.5, y: 0.78, z: 1.2 },
    ],
  },
  {
    src: "screens/hasil.jpg",
    dari: 42.3,
    kunci: [
      { t: 42.3, x: 0.5, y: 0.3, z: 1 },
      { t: 48, x: 0.5, y: 0.4, z: 1.2 },
    ],
  },
];

// Satu HP yang menetap di sisi kanan: muncul di adegan 3-7 dan 9
const Telepon: React.FC = () => {
  const { t, pop } = useWaktu(0);
  let p = 0;
  if (t >= 42.3) {
    p = pop(42.3);
  } else if (t >= 8.5 && t < 36.6) {
    p = Math.min(pop(8.5), interpolate(t, [36.1, 36.5], [1, 0], KLAMP));
  }
  if (p <= 0.001) return null;
  const awal = t >= 42.3 ? 42.3 : 8.5;
  const apung = Math.sin(t * 1.4) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: 1230,
        top: 65,
        width: PW + 28,
        height: PH + 28,
        borderRadius: 68,
        background: "#1a1f2b",
        padding: 14,
        boxSizing: "border-box",
        boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 3px #2b3142",
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 260 + apung}px) scale(${0.92 + 0.08 * p})`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: PW,
          height: PH,
          borderRadius: 54,
          overflow: "hidden",
          background: "#0b0f14",
        }}
      >
        {LAYAR.filter((l) => l.dari >= awal && t >= l.dari).map((l, i) => {
          const o = interpolate(t, [l.dari, l.dari + 0.2], [0, 1], KLAMP);
          const H = l.tinggi ?? PH;
          return (
            <div
              key={i}
              style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, opacity: o, overflow: "hidden" }}
            >
              <div
                style={{
                  width: PW,
                  height: H,
                  transformOrigin: "0 0",
                  transform: kamera(t, l.kunci, H),
                }}
              >
                <Img
                  src={staticFile(l.src)}
                  style={{ width: PW, height: H, display: "block" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 22,
          left: "50%",
          width: 14,
          height: 14,
          marginLeft: -7,
          borderRadius: 7,
          background: "#05070b",
        }}
      />
    </div>
  );
};

/* ---------------- Adegan ---------------- */

// 1. Hook (0 - 3.95 s)
const Hook: React.FC = () => {
  const { t, pop } = useWaktu(0);
  const garis = interpolate(t, [0.3, 3.4], [0, 1], {
    ...KLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const lupa = interpolate(t, [3.3, 3.9], [1, 0.35], KLAMP);
  return (
    <div style={{ width: 1400, textAlign: "center" }}>
      <Muncul p={pop(0.05)} style={{ fontSize: 52, color: "#cbd5e1" }}>
        Pernah nggak sih,
      </Muncul>
      <Muncul p={pop(1.1)} style={{ fontSize: 88, fontWeight: 800, marginTop: 8 }}>
        capek-capek belajar,
      </Muncul>
      <Muncul
        p={pop(2.82)}
        style={{
          fontSize: 88,
          fontWeight: 800,
          color: MERAH,
          marginTop: 8,
          opacity: lupa * Math.min(1, pop(2.82) * 1.5),
        }}
      >
        tapi besoknya lupa?
      </Muncul>
      <svg width={1200} height={330} viewBox="0 0 1200 330" style={{ marginTop: 24 }}>
        <line x1={60} y1={290} x2={1160} y2={290} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        <line x1={60} y1={20} x2={60} y2={290} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        <path
          d="M 60 50 C 330 60, 470 250, 1160 275"
          pathLength={1}
          fill="none"
          stroke={MERAH}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - garis}
        />
        <text x={60} y={322} fill="#94a3b8" fontSize={28}>
          Hari ini
        </text>
        <text x={1160} y={322} fill="#94a3b8" fontSize={28} textAnchor="end">
          Besok
        </text>
      </svg>
    </div>
  );
};

// 2. Masalah (3.95 - 7.9 s): tumpukan catatan
const KERTAS = [
  { at: 4.18, x: -420, y: -150, r: -8, w: "#fde68a" },
  { at: 4.4, x: 380, y: -110, r: 6, w: "#bfdbfe" },
  { at: 5.43, x: -170, y: 90, r: -3, w: "#fbcfe8" },
  { at: 5.6, x: 430, y: 130, r: 9, w: "#bbf7d0" },
  { at: 5.8, x: -500, y: 170, r: 5, w: "#e9d5ff" },
  { at: 6.73, x: 10, y: -30, r: -5, w: "#f8fafc" },
];

const Masalah: React.FC = () => {
  const { t, pop } = useWaktu(3.95);
  const kata =
    t < 5.43 ? "Catatan berantakan" : t < 6.73 ? "Materi numpuk" : "Ujian makin dekat!";
  const cap = t < 5.43 ? pop(4.18) : t < 6.73 ? pop(5.43) : pop(6.73);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
      {KERTAS.map((k, i) => {
        const p = pop(k.at);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + k.x - 230,
              top: 420 + k.y - 170,
              width: 460,
              height: 340,
              background: k.w,
              borderRadius: 14,
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
              padding: 30,
              boxSizing: "border-box",
              opacity: Math.min(1, p * 1.6),
              transform: `translateY(${(1 - p) * -500}px) rotate(${k.r + (1 - p) * 20}deg) scale(${0.9 + 0.1 * p})`,
            }}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  height: 14,
                  width: `${90 - n * 12}%`,
                  background: "rgba(15,23,42,0.18)",
                  borderRadius: 7,
                  marginBottom: 22,
                }}
              />
            ))}
          </div>
        );
      })}
      {t >= 6.9 && (
        <div
          style={{
            position: "absolute",
            left: 960 - 250,
            top: 350,
            width: 500,
            textAlign: "center",
            fontSize: 150,
            fontWeight: 900,
            color: MERAH,
            border: `12px solid ${MERAH}`,
            borderRadius: 24,
            background: "rgba(7,11,22,0.6)",
            opacity: Math.min(1, pop(6.9) * 1.5),
            transform: `rotate(-10deg) scale(${0.6 + 0.4 * pop(6.9)})`,
          }}
        >
          UJIAN
        </div>
      )}
      <Muncul
        p={cap}
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 76,
          fontWeight: 800,
        }}
      >
        {kata}
      </Muncul>
    </div>
  );
};

// 3. Brand (7.9 - 12.55 s)
const Brand: React.FC = () => {
  const { pop } = useWaktu(7.9);
  return (
    <Kiri>
      <Muncul p={pop(8.19)} style={{ fontSize: 56, color: "#cbd5e1" }}>
        Kenalin,
      </Muncul>
      <Muncul
        p={pop(8.86)}
        style={{
          fontSize: 160,
          fontWeight: 900,
          color: BIRU,
          letterSpacing: 4,
          lineHeight: 1,
          transformOrigin: "left center",
          transform: `scale(${0.85 + 0.15 * pop(8.86)})`,
        }}
      >
        EXAMBRE
      </Muncul>
      <Muncul p={pop(9.81)} style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.25 }}>
        Satu aplikasi untuk
        <br />
        latihan soal apa pun
      </Muncul>
    </Kiri>
  );
};

// 4. Ulang soal sampai dikuasai (12.55 - 19.38 s)
const Ulang: React.FC = () => {
  const { pop } = useWaktu(12.55);
  return (
    <Kiri>
      <Muncul p={pop(12.66)}>
        <Chip warna={MERAH} besar>
          Salah → muncul lagi
        </Chip>
      </Muncul>
      <Muncul p={pop(14.45)}>
        <Chip warna={BIRU} besar>
          Diulang sampai ingat
        </Chip>
      </Muncul>
      <Muncul p={pop(16.63)}>
        <Chip warna={AMBER} besar>
          Stabil
        </Chip>
      </Muncul>
      <Muncul p={pop(18.0)} style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Centang ukuran={80} />
        <Chip warna={HIJAU} besar>
          Dikuasai
        </Chip>
      </Muncul>
    </Kiri>
  );
};

// 5. Simulasi (19.38 - 24.35 s)
const Simulasi: React.FC = () => {
  const { pop } = useWaktu(19.38);
  return (
    <Kiri>
      <Muncul p={pop(19.8)} style={{ fontSize: 72, fontWeight: 800 }}>
        Simulasi ujian
      </Muncul>
      <Muncul p={pop(20.7)}>
        <Chip warna={AMBER} besar>
          Ber-timer
        </Chip>
      </Muncul>
      <Muncul p={pop(22.2)}>
        <Chip warna={BIRU} besar>
          Navigasi nomor
        </Chip>
      </Muncul>
      <Muncul p={pop(23.35)}>
        <Chip warna={HIJAU} besar>
          Hasil per kategori
        </Chip>
      </Muncul>
    </Kiri>
  );
};

// 6. Input soal (24.35 - 30.75 s)
const InputSoal: React.FC = () => {
  const { pop } = useWaktu(24.35);
  return (
    <Kiri>
      <Muncul p={pop(24.49)} style={{ fontSize: 72, fontWeight: 800 }}>
        Input soal cepat
      </Muncul>
      <Muncul p={pop(26.18)}>
        <Chip warna={BIRU} besar>
          Tempel dari tryout
        </Chip>
      </Muncul>
      <Muncul p={pop(27.34)}>
        <Chip warna={AMBER} besar>
          Scan foto
        </Chip>
      </Muncul>
      <Muncul p={pop(28.46)}>
        <Chip warna={HIJAU} besar>
          Pembahasan AI
        </Chip>
      </Muncul>
    </Kiri>
  );
};

// 7. Catatan jadi soal + statistik (30.75 - 36.43 s)
const CatatanStatistik: React.FC = () => {
  const { pop } = useWaktu(30.75);
  return (
    <Kiri>
      <Muncul p={pop(30.88)}>
        <Chip warna={BIRU} besar>
          Catatan → Soal
        </Chip>
      </Muncul>
      <Muncul p={pop(33.32)} style={{ fontSize: 72, fontWeight: 800 }}>
        Statistik
      </Muncul>
      <Muncul p={pop(34.8)}>
        <Chip warna={MERAH} besar>
          Kelemahan
        </Chip>
      </Muncul>
      <Muncul p={pop(35.5)}>
        <Chip warna={HIJAU} besar>
          Kesiapan ujian
        </Chip>
      </Muncul>
    </Kiri>
  );
};

// 8. Privasi (36.43 - 42.2 s): ikon, tanpa HP
const IkonAkun: React.FC = () => (
  <svg width={200} height={200} viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={60} cy={40} r={20} />
    <path d="M 22 100 C 22 70, 98 70, 98 100" />
    <line x1={18} y1={108} x2={102} y2={12} stroke={MERAH} />
  </svg>
);

const IkonPerangkat: React.FC = () => (
  <svg width={200} height={200} viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <rect x={32} y={8} width={56} height={104} rx={12} />
    <rect x={46} y={58} width={28} height={24} rx={5} stroke={HIJAU} />
    <path d="M 52 58 v -8 a 8 8 0 0 1 16 0 v 8" stroke={HIJAU} />
  </svg>
);

const IkonOffline: React.FC = () => (
  <svg width={200} height={200} viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 12 46 a 68 68 0 0 1 96 0" />
    <path d="M 28 64 a 44 44 0 0 1 64 0" />
    <path d="M 44 80 a 20 20 0 0 1 32 0" />
    <circle cx={60} cy={96} r={4} fill="white" />
    <line x1={18} y1={108} x2={102} y2={12} stroke={AMBER} />
  </svg>
);

const KartuIkon: React.FC<{
  p: number;
  label: string;
  children: React.ReactNode;
}> = ({ p, label, children }) => (
  <Muncul
    p={p}
    style={{
      ...kartu,
      width: 420,
      height: 420,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
      padding: 30,
    }}
  >
    {children}
    <div style={{ fontSize: 40, fontWeight: 700, textAlign: "center" }}>{label}</div>
  </Muncul>
);

const Privasi: React.FC = () => {
  const { pop } = useWaktu(36.43);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <Muncul p={pop(36.54)} style={{ fontSize: 60, color: "#cbd5e1" }}>
        Yang paling penting
      </Muncul>
      <div style={{ display: "flex", gap: 50 }}>
        <KartuIkon p={pop(37.99)} label="Tanpa akun">
          <IkonAkun />
        </KartuIkon>
        <KartuIkon p={pop(38.84)} label="Data di perangkatmu">
          <IkonPerangkat />
        </KartuIkon>
        <KartuIkon p={pop(40.4)} label="Bisa offline">
          <IkonOffline />
        </KartuIkon>
      </div>
    </div>
  );
};

// 9. Penutup (42.2 - 49 s)
const Penutup: React.FC = () => {
  const { pop } = useWaktu(42.2);
  return (
    <Kiri>
      <Muncul
        p={pop(42.36)}
        style={{ fontSize: 150, fontWeight: 900, color: BIRU, letterSpacing: 4, lineHeight: 1 }}
      >
        EXAMBRE
      </Muncul>
      <Muncul p={pop(43.32)} style={{ fontSize: 66, fontWeight: 700 }}>
        Belajar lebih cerdas,
      </Muncul>
      <Muncul p={pop(44.45)} style={{ fontSize: 66, fontWeight: 700, color: AMBER }}>
        bukan lebih lama.
      </Muncul>
      <Muncul p={pop(45.73)} style={{ marginTop: 20 }}>
        <Chip warna={HIJAU} besar>
          Coba sekarang
        </Chip>
      </Muncul>
      <Muncul p={pop(46.59)} style={{ fontSize: 44, color: "#cbd5e1" }}>
        Link di bio
      </Muncul>
    </Kiri>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComponent}
      durationInFrames={Math.round(TOTAL_DETIK * FPS)}
      fps={FPS}
      width={1920}
      height={1080}
      calculateMetadata={calculateMetadata}
    />
  );
};

export const MyComponent: React.FC<Props> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile("vo.mp3")} />
      <Adegan mulai={0} selesai={3.95}><Hook /></Adegan>
      <Adegan mulai={3.95} selesai={7.9}><Masalah /></Adegan>
      <Adegan mulai={7.9} selesai={12.55}><Brand /></Adegan>
      <Adegan mulai={12.55} selesai={19.38}><Ulang /></Adegan>
      <Adegan mulai={19.38} selesai={24.35}><Simulasi /></Adegan>
      <Adegan mulai={24.35} selesai={30.75}><InputSoal /></Adegan>
      <Adegan mulai={30.75} selesai={36.43}><CatatanStatistik /></Adegan>
      <Adegan mulai={36.43} selesai={42.2}><Privasi /></Adegan>
      <Adegan mulai={42.2} selesai={TOTAL_DETIK}><Penutup /></Adegan>
      <Telepon />
    </AbsoluteFill>
  );
};
