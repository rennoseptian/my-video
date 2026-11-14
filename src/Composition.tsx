import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {};

const FPS = 30;
const TOTAL_DETIK = 60;
const BIRU = "#38bdf8";
const HIJAU = "#22c55e";
const MERAH = "#f87171";
const AMBER = "#fbbf24";
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

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
        background: "linear-gradient(135deg, #0b1020, #16224a)",
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

// 1. Hook
const Hook: React.FC = () => {
  const { t, pop } = useWaktu(0);
  const lupa = interpolate(t, [4.9, 5.6], [1, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ textAlign: "center" }}>
      <Muncul p={pop(0.2)} style={{ fontSize: 56, color: "#cbd5e1" }}>
        Pernah nggak sih,
      </Muncul>
      <Muncul p={pop(1.52)} style={{ fontSize: 96, fontWeight: 800, marginTop: 16 }}>
        capek-capek belajar...
      </Muncul>
      <Muncul
        p={pop(4.21)}
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: MERAH,
          marginTop: 24,
          opacity: lupa * Math.min(1, pop(4.21) * 1.5),
        }}
      >
        tapi besoknya lupa?
      </Muncul>
    </div>
  );
};

// 2. Masalah
const Masalah: React.FC = () => {
  const { pop } = useWaktu(5.83);
  const item = (teks: string, at: number, rot: number, warna?: string) => (
    <Muncul
      p={pop(at)}
      style={{
        ...kartu,
        fontSize: 46,
        fontWeight: 700,
        borderColor: warna ?? "rgba(255,255,255,0.18)",
        transform: `translateY(${(1 - pop(at)) * 40}px) rotate(${rot}deg)`,
      }}
    >
      {teks}
    </Muncul>
  );
  return (
    <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
      {item("Catatan berantakan", 6.1, -4)}
      {item("Materi numpuk", 7.72, 3)}
      {item("Ujian makin dekat", 8.91, -2, AMBER)}
    </div>
  );
};

// 3. Brand
const Brand: React.FC = () => {
  const { pop } = useWaktu(10.2);
  return (
    <div style={{ textAlign: "center" }}>
      <Muncul p={pop(10.37)} style={{ fontSize: 56, color: "#cbd5e1" }}>
        Kenalin,
      </Muncul>
      <Muncul
        p={pop(10.95)}
        style={{
          fontSize: 190,
          fontWeight: 900,
          color: BIRU,
          letterSpacing: 6,
          transform: `scale(${0.8 + 0.2 * pop(10.95)})`,
        }}
      >
        EXAMBRE
      </Muncul>
      <Muncul p={pop(12.06)} style={{ fontSize: 56, fontWeight: 600, marginTop: 8 }}>
        Satu aplikasi untuk latihan soal apa pun
      </Muncul>
    </div>
  );
};

// 4. Ulang soal sampai dikuasai
const Ulang: React.FC = () => {
  const { t, pop } = useWaktu(15.1);
  const kartuSoal = (label: string, at: number, benar: boolean) => (
    <Muncul p={pop(at)} style={{ ...kartu, width: 420, textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 20 }}>{label}</div>
      <Chip warna={benar ? HIJAU : MERAH}>{benar ? "INGAT" : "SALAH"}</Chip>
    </Muncul>
  );
  return (
    <div style={{ textAlign: "center" }}>
      <Muncul p={pop(15.23)} style={{ fontSize: 56, fontWeight: 700, marginBottom: 48 }}>
        Soal yang salah muncul lagi
      </Muncul>
      <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
        {kartuSoal("Soal salah", 15.23, false)}
        {kartuSoal("Muncul lagi", 16.0, false)}
        {kartuSoal("Muncul lagi", 17.33, t >= 18.3)}
      </div>
      <div
        style={{
          display: "flex",
          gap: 32,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 56,
          height: 90,
        }}
      >
        {t >= 19.56 && (
          <Muncul p={pop(19.56)}>
            <Chip warna={AMBER} besar>
              Stabil
            </Chip>
          </Muncul>
        )}
        {t >= 21.06 && (
          <Muncul p={pop(21.06)} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Centang />
            <Chip warna={HIJAU} besar>
              Dikuasai
            </Chip>
          </Muncul>
        )}
      </div>
    </div>
  );
};

// 5. Simulasi ujian
const Simulasi: React.FC = () => {
  const { t, pop } = useWaktu(22.55);
  const sisa = Math.max(0, 3600 - Math.floor((t - 22.71) * 40));
  const mm = String(Math.floor(sisa / 60)).padStart(2, "0");
  const ss = String(sisa % 60).padStart(2, "0");
  const terjawab = Math.floor(
    interpolate(t, [24.2, 29], [0, 22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const bar = (label: string, persen: number, at: number) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{label}</div>
      <div style={{ height: 22, background: "rgba(255,255,255,0.12)", borderRadius: 11 }}>
        <div
          style={{
            height: 22,
            borderRadius: 11,
            background: BIRU,
            width: `${persen * Math.min(1, pop(at))}%`,
          }}
        />
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 48, alignItems: "stretch" }}>
      <Muncul p={pop(22.71)} style={{ ...kartu, textAlign: "center", width: 440 }}>
        <div style={{ fontSize: 30, color: "#cbd5e1" }}>Sisa waktu</div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: AMBER,
            fontVariantNumeric: "tabular-nums",
          }}
        >{`${mm}:${ss}`}</div>
      </Muncul>
      <Muncul p={pop(23.96)} style={{ ...kartu, width: 560 }}>
        <div style={{ fontSize: 30, color: "#cbd5e1", marginBottom: 20 }}>
          Navigasi nomor
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              style={{
                height: 64,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                background: i < terjawab ? BIRU : "rgba(255,255,255,0.1)",
                color: i < terjawab ? "#0b1020" : "white",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </Muncul>
      <Muncul p={pop(26.09)} style={{ ...kartu, width: 520 }}>
        <div style={{ fontSize: 30, color: "#cbd5e1", marginBottom: 24 }}>
          Hasil per kategori
        </div>
        {bar("Kategori A", 82, 26.5)}
        {bar("Kategori B", 64, 27.3)}
        {bar("Kategori C", 91, 28.1)}
      </Muncul>
    </div>
  );
};

// 6. Input soal
const InputSoal: React.FC = () => {
  const { pop } = useWaktu(29.7);
  const opsi = (judul: string, sub: string, at: number, warna: string) => (
    <Muncul
      p={pop(at)}
      style={{ ...kartu, width: 500, textAlign: "center", borderTop: `10px solid ${warna}` }}
    >
      <div style={{ fontSize: 52, fontWeight: 800 }}>{judul}</div>
      <div style={{ fontSize: 30, color: "#cbd5e1", marginTop: 12 }}>{sub}</div>
    </Muncul>
  );
  return (
    <div style={{ textAlign: "center" }}>
      <Muncul p={pop(29.98)} style={{ fontSize: 72, fontWeight: 800, marginBottom: 56 }}>
        Input soal cepat
      </Muncul>
      <div style={{ display: "flex", gap: 40 }}>
        {opsi("Tempel", "dari tryout", 31.43, BIRU)}
        {opsi("Scan foto", "soal dari foto", 32.87, AMBER)}
        {opsi("Pembahasan AI", "AI yang membuatkan", 34.0, HIJAU)}
      </div>
    </div>
  );
};

// 7. Catatan jadi soal + statistik
const CatatanStatistik: React.FC = () => {
  const { pop } = useWaktu(36.35);
  const persen = 72 * Math.min(1, pop(41.3));
  const lingkar = 2 * Math.PI * 70;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 70, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <Muncul p={pop(36.52)} style={{ ...kartu, fontSize: 48, fontWeight: 700 }}>
          Catatan
        </Muncul>
        <Muncul p={pop(37.3)} style={{ fontSize: 80, color: BIRU }}>
          →
        </Muncul>
        <Muncul
          p={pop(37.8)}
          style={{ ...kartu, fontSize: 48, fontWeight: 700, borderColor: BIRU }}
        >
          Soal
        </Muncul>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <Muncul p={pop(39.26)} style={{ fontSize: 64, fontWeight: 800 }}>
          Statistik
        </Muncul>
        <Muncul p={pop(40.4)} style={{ ...kartu, fontSize: 44, fontWeight: 700, borderColor: MERAH }}>
          Kelemahan
        </Muncul>
        <Muncul p={pop(41.3)} style={{ ...kartu, display: "flex", alignItems: "center", gap: 28 }}>
          <svg width={170} height={170} viewBox="0 0 170 170">
            <circle cx={85} cy={85} r={70} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={16} />
            <circle
              cx={85}
              cy={85}
              r={70}
              fill="none"
              stroke={HIJAU}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={`${(lingkar * persen) / 100} ${lingkar}`}
              transform="rotate(-90 85 85)"
            />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 700 }}>Kesiapan ujian</div>
        </Muncul>
      </div>
    </div>
  );
};

// 8. Privasi
const Privasi: React.FC = () => {
  const { pop } = useWaktu(42.9);
  const baris = (teks: string, at: number) => (
    <Muncul
      p={pop(at)}
      style={{
        ...kartu,
        display: "flex",
        alignItems: "center",
        gap: 28,
        fontSize: 52,
        fontWeight: 700,
        width: 1200,
      }}
    >
      <Centang ukuran={64} />
      {teks}
    </Muncul>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
      <Muncul p={pop(43.18)} style={{ fontSize: 60, color: "#cbd5e1", marginBottom: 16 }}>
        Yang paling penting
      </Muncul>
      {baris("Tanpa akun", 45.11)}
      {baris("Data tersimpan di perangkatmu", 45.75)}
      {baris("Latihan tetap bisa offline", 48.64)}
    </div>
  );
};

// 9. Penutup
const Penutup: React.FC = () => {
  const { pop } = useWaktu(50.87);
  return (
    <div style={{ textAlign: "center" }}>
      <Muncul
        p={pop(51.03)}
        style={{ fontSize: 170, fontWeight: 900, color: BIRU, letterSpacing: 6 }}
      >
        EXAMBRE
      </Muncul>
      <Muncul p={pop(52.18)} style={{ fontSize: 68, fontWeight: 700 }}>
        Belajar lebih cerdas,
      </Muncul>
      <Muncul p={pop(53.84)} style={{ fontSize: 68, fontWeight: 700, color: AMBER }}>
        bukan lebih lama.
      </Muncul>
      <Muncul p={pop(55.46)} style={{ marginTop: 56 }}>
        <Chip warna={HIJAU} besar>
          Coba sekarang
        </Chip>
      </Muncul>
      <Muncul p={pop(57.03)} style={{ fontSize: 44, color: "#cbd5e1", marginTop: 24 }}>
        Link di bio
      </Muncul>
    </div>
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
      <Adegan mulai={0} selesai={5.83}><Hook /></Adegan>
      <Adegan mulai={5.83} selesai={10.2}><Masalah /></Adegan>
      <Adegan mulai={10.2} selesai={15.1}><Brand /></Adegan>
      <Adegan mulai={15.1} selesai={22.55}><Ulang /></Adegan>
      <Adegan mulai={22.55} selesai={29.7}><Simulasi /></Adegan>
      <Adegan mulai={29.7} selesai={36.35}><InputSoal /></Adegan>
      <Adegan mulai={36.35} selesai={42.9}><CatatanStatistik /></Adegan>
      <Adegan mulai={42.9} selesai={50.87}><Privasi /></Adegan>
      <Adegan mulai={50.87} selesai={TOTAL_DETIK}><Penutup /></Adegan>
    </AbsoluteFill>
  );
};
