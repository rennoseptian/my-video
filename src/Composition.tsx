import { Audio } from "@remotion/media";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {};

const FPS = 30;
const TOTAL_DETIK = 49;

// Warna diambil dari tampilan aplikasi Exambre
const C = {
  kartu: "#15191e",
  garis: "#2a3138",
  opsi: "#1b2026",
  teks: "#f4f6f6",
  redup: "#8b949a",
  aksen: "#4167f5",
  ungu: "#7b87f2",
  hijau: "#6fd3a5",
  hijauBg: "#14261f",
  hijauGaris: "#235544",
  merah: "#f2a0a0",
  merahBg: "#2a1a1a",
  merahGaris: "#5a2a2a",
  amber: "#fbbf24",
};
const FONT = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const KLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------- font (dari folder public/fonts) ---------------- */
const FONT_FILES = [
  ["IBM Plex Sans", "400", "fonts/IBMPlexSans-Regular.ttf"],
  ["IBM Plex Sans", "500", "fonts/IBMPlexSans-Medium.ttf"],
  ["IBM Plex Sans", "600", "fonts/IBMPlexSans-SemiBold.ttf"],
  ["IBM Plex Sans", "700", "fonts/IBMPlexSans-Bold.ttf"],
  ["IBM Plex Mono", "400", "fonts/IBMPlexMono-Regular.ttf"],
] as const;

const useFonts = () => {
  const [handle] = useState(() => delayRender("memuat font"));
  useEffect(() => {
    Promise.all(
      FONT_FILES.map(([fam, w, file]) =>
        new FontFace(fam, `url(${staticFile(file)})`, { weight: w }).load()
      )
    )
      .then((fs) => {
        fs.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
};

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

/* ---------------- helper animasi ---------------- */
const seg = (
  t: number,
  a: number,
  b: number,
  easing: (n: number) => number = Easing.out(Easing.cubic)
) => interpolate(t, [a, b], [0, 1], { ...KLAMP, easing });

const ketik = (teks: string, t: number, a: number, b: number) =>
  teks.slice(0, Math.round(teks.length * seg(t, a, b, Easing.linear)));

const pad2 = (n: number) => String(n).padStart(2, "0");

// t = detik absolut di video, pop(at) = animasi muncul (spring) pada detik "at"
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

/* ---------------- kerangka adegan ---------------- */
const Latar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const geser = Math.sin(frame / 60) * 6;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1000px 800px at ${70 + geser}% 45%, rgba(65,103,245,0.26), transparent 70%), radial-gradient(800px 600px at 10% 90%, rgba(123,135,242,0.14), transparent 70%), linear-gradient(135deg, #060a14, #0d1633)`,
        fontFamily: FONT,
        color: C.teks,
        opacity: o,
        transform: `scale(${0.97 + 0.03 * o})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
          backgroundSize: "48px 48px",
        }}
      />
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

const Tengah: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

// Panggung dengan sedikit kemiringan 3D supaya terasa berdimensi
const Panggung: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      transform: `perspective(2600px) rotateY(${Math.sin(t * 0.7) * 1.4}deg) rotateX(${Math.cos(t * 0.5) * 0.8}deg)`,
    }}
  >
    {children}
  </div>
);

// Pembungkus animasi muncul untuk elemen berposisi absolut
const Masuk: React.FC<{
  p: number;
  dx?: number;
  dy?: number;
  children: React.ReactNode;
}> = ({ p, dx = 0, dy = 40, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      opacity: Math.min(1, p * 1.5),
      transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px)`,
    }}
  >
    {children}
  </div>
);

/* ---------------- ikon ---------------- */
const Ikon: React.FC<{
  d: string;
  ukuran?: number;
  warna?: string;
  tebal?: number;
  isi?: boolean;
}> = ({ d, ukuran = 40, warna = C.teks, tebal = 2.4, isi = false }) => (
  <svg
    width={ukuran}
    height={ukuran}
    viewBox="0 0 24 24"
    fill={isi ? warna : "none"}
    stroke={warna}
    strokeWidth={tebal}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const D_CEK = "M5 13l4 4L19 7";
const D_SILANG = "M6 6l12 12M18 6L6 18";
const D_PETIR = "M13 2L4 14h7l-1 8 9-12h-7z";
const D_KILAU = "M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z";
const D_LINK = "M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1";

/* ---------------- kursor ---------------- */
type Titik = { t: number; x: number; y: number };

const Kursor: React.FC<{ jalur: Titik[]; klik?: number[]; t: number }> = ({
  jalur,
  klik = [],
  t,
}) => {
  const ts = jalur.map((j) => j.t);
  const xs = jalur.map((j) => j.x);
  const ys = jalur.map((j) => j.y);
  const opt = { ...KLAMP, easing: Easing.inOut(Easing.cubic) };
  const pos = (tt: number) => ({
    x: interpolate(tt, ts, xs, opt),
    y: interpolate(tt, ts, ys, opt),
  });
  const awal = ts[0];
  const akhir = ts[ts.length - 1] + 0.8;
  const o = interpolate(t, [awal - 0.2, awal, akhir - 0.2, akhir], [0, 1, 1, 0], KLAMP);
  if (o <= 0.01) return null;
  const { x, y } = pos(t);
  const tekan = klik.reduce(
    (m, c) => Math.max(m, interpolate(t, [c - 0.08, c, c + 0.2], [0, 1, 0], KLAMP)),
    0
  );
  return (
    <>
      {klik.map((c, i) => {
        const r = seg(t, c, c + 0.45);
        if (t < c || r >= 1) return null;
        const p = pos(c);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x - 60,
              top: p.y - 60,
              width: 120,
              height: 120,
              borderRadius: 60,
              border: "5px solid rgba(255,255,255,0.85)",
              opacity: 1 - r,
              transform: `scale(${0.2 + 0.8 * r})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          opacity: o,
          transform: `scale(${1 - 0.18 * tekan})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))",
        }}
      >
        <svg width={46} height={56} viewBox="0 0 24 29">
          <path
            d="M2 2 L2 22 L7.5 17 L11.5 26 L15 24.5 L11 15.5 L18.5 15.5 Z"
            fill="#ffffff"
            stroke="#0b0f14"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};

/* ---------------- konfeti sederhana ---------------- */
const Letup: React.FC<{ t: number; at: number; x: number; y: number; warna: string }> = ({
  t,
  at,
  x,
  y,
  warna,
}) => {
  const r = seg(t, at, at + 0.9);
  if (t < at || r >= 1) return null;
  return (
    <>
      {Array.from({ length: 18 }, (_, i) => {
        const sudut = (i / 18) * Math.PI * 2;
        const jarak = (i % 2 === 0 ? 300 : 200) * r;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(sudut) * jarak - 8,
              top: y + Math.sin(sudut) * jarak - 8,
              width: i % 3 === 0 ? 20 : 14,
              height: i % 3 === 0 ? 20 : 14,
              borderRadius: i % 3 === 0 ? 4 : 10,
              background: i % 4 === 0 ? C.amber : warna,
              opacity: 1 - r,
              transform: `rotate(${r * 240}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

/* ---------------- kartu soal (meniru UI aplikasi) ---------------- */
const CARD_W = 880;
const PAD = 32;
const HEAD = 52;
const TANYA = 96;
const OPT_H = 74;
const OPT_GAP = 10;
const FB_H = 190;
const optY = (i: number, top: number) =>
  top + PAD + HEAD + TANYA + i * (OPT_H + OPT_GAP) + OPT_H / 2;

type GayaOpsi = "netral" | "pilih" | "benar" | "salah";
const GAYA: Record<GayaOpsi, { bg: string; br: string; tx: string }> = {
  netral: { bg: C.opsi, br: C.garis, tx: C.teks },
  pilih: { bg: "#1a2140", br: C.aksen, tx: C.teks },
  benar: { bg: C.hijauBg, br: C.hijauGaris, tx: C.hijau },
  salah: { bg: C.merahBg, br: C.merahGaris, tx: C.merah },
};

const Pil: React.FC<{ warna: string; children: React.ReactNode }> = ({ warna, children }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 16px",
      borderRadius: 10,
      border: `2px solid ${C.garis}`,
      background: "#12161a",
      color: warna,
      fontSize: 24,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const KartuSoal: React.FC<{
  left: number;
  top: number;
  kat: string;
  warnaKat: string;
  sub: string;
  no: string;
  tanya: string;
  opsi: string[];
  pilih: number | null;
  terjawab: boolean;
  benar: number;
  umpan: number;
  penjelasan: string;
  xp: string;
  ulangi: string;
}> = (p) => {
  const betul = p.pilih === p.benar;
  const huruf = ["A", "B", "C", "D", "E"];
  const gaya = (i: number): GayaOpsi => {
    if (p.terjawab) {
      if (i === p.benar) return "benar";
      if (i === p.pilih) return "salah";
      return "netral";
    }
    return i === p.pilih ? "pilih" : "netral";
  };
  return (
    <div
      style={{
        position: "absolute",
        left: p.left,
        top: p.top,
        width: CARD_W,
        boxSizing: "border-box",
        padding: PAD,
        borderRadius: 30,
        background: C.kartu,
        border: `2px solid ${C.garis}`,
        boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ height: HEAD, display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: p.warnaKat,
            border: "4px solid #fff",
            boxSizing: "border-box",
          }}
        />
        <span style={{ fontSize: 30, fontWeight: 600 }}>{p.kat}</span>
        <span style={{ fontSize: 28, color: C.redup }}>· {p.sub}</span>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 26, color: C.redup }}>
          {p.no}
        </span>
      </div>
      <div style={{ height: TANYA, display: "flex", alignItems: "center", fontSize: 40, fontWeight: 600 }}>
        {p.tanya}
      </div>
      {p.opsi.map((o, i) => {
        const g = GAYA[gaya(i)];
        return (
          <div
            key={i}
            style={{
              height: OPT_H,
              marginBottom: i < 4 ? OPT_GAP : 0,
              borderRadius: 20,
              background: g.bg,
              border: `2px solid ${g.br}`,
              color: g.tx,
              display: "flex",
              alignItems: "center",
              padding: "0 30px",
              fontSize: 34,
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontFamily: MONO, width: 58, color: g.tx === C.teks ? C.redup : g.tx }}>
              {huruf[i]}
            </span>
            {o}
          </div>
        );
      })}
      <div style={{ height: p.umpan * FB_H, opacity: p.umpan, overflow: "hidden" }}>
        <div
          style={{
            marginTop: 16,
            height: FB_H - 16,
            boxSizing: "border-box",
            padding: "16px 24px",
            borderRadius: 20,
            background: "#1d2227",
            border: `2px solid ${C.garis}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: betul ? C.hijau : C.merah }}>
              {betul ? "Benar." : `Kurang tepat. Jawaban benar: ${huruf[p.benar]}.`}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 14px",
                borderRadius: 10,
                border: `2px solid ${C.garis}`,
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              <Ikon d={D_PETIR} ukuran={22} />
              {p.xp}
            </span>
          </div>
          <div style={{ fontSize: 27, marginTop: 10, color: "#d6dbdb", lineHeight: 1.3 }}>
            {p.penjelasan}
          </div>
          <div style={{ fontSize: 23, marginTop: 8, color: C.redup }}>{p.ulangi}</div>
        </div>
      </div>
    </div>
  );
};

/* ================= 1. HOOK (0 - 3.95 s) ================= */
const bez = (s: number) => {
  const P = [
    [60, 50],
    [330, 60],
    [470, 250],
    [1160, 275],
  ];
  const u = 1 - s;
  const f = (k: number) =>
    u * u * u * P[0][k] + 3 * u * u * s * P[1][k] + 3 * u * s * s * P[2][k] + s * s * s * P[3][k];
  return { x: f(0), y: f(1) };
};

const Hook: React.FC = () => {
  const { t, pop } = useWaktu(0);
  const garis = seg(t, 0.3, 3.4, Easing.inOut(Easing.cubic));
  const lupa = interpolate(t, [3.3, 3.9], [1, 0.4], KLAMP);
  const N = 60;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const q = bez((garis * i) / N);
    d += `${i === 0 ? "M" : "L"} ${q.x.toFixed(1)} ${q.y.toFixed(1)} `;
  }
  const ujung = bez(garis);
  const ret = Math.round(100 - 88 * garis);
  const muncul = (p: number): React.CSSProperties => ({
    opacity: Math.min(1, p * 1.5),
    transform: `translateY(${(1 - p) * 40}px)`,
  });
  return (
    <Tengah>
      <div style={{ width: 1400, textAlign: "center" }}>
        <div style={{ fontSize: 52, color: "#cbd5e1", ...muncul(pop(0.05)) }}>Pernah nggak sih,</div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 8, ...muncul(pop(1.1)) }}>
          capek-capek belajar,
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: C.merah,
            marginTop: 8,
            transform: `translateY(${(1 - pop(2.82)) * 40}px)`,
            opacity: lupa * Math.min(1, pop(2.82) * 1.5),
          }}
        >
          tapi besoknya lupa?
        </div>
        <svg width={1300} height={340} viewBox="0 0 1300 340" style={{ marginTop: 24 }}>
          <line x1={60} y1={300} x2={1240} y2={300} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
          <line x1={60} y1={20} x2={60} y2={300} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
          <path d={d} fill="none" stroke={C.merah} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={ujung.x} cy={ujung.y} r={34} fill={C.merah} opacity={0.25} />
          <circle cx={ujung.x} cy={ujung.y} r={16} fill={C.merah} />
          <text x={ujung.x + 30} y={ujung.y - 24} fill={C.merah} fontSize={46} fontWeight={700}>
            {ret}%
          </text>
          <text x={60} y={332} fill="#94a3b8" fontSize={28}>
            Hari ini
          </text>
          <text x={1240} y={332} fill="#94a3b8" fontSize={28} textAnchor="end">
            Besok
          </text>
        </svg>
      </div>
    </Tengah>
  );
};

/* ================= 2. MASALAH (3.95 - 7.9 s) ================= */
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
  const guncang = t > 6.9 && t < 7.3 ? Math.sin(t * 120) * 14 * (1 - seg(t, 6.9, 7.3)) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        transform: `translate(${guncang}px, ${guncang * 0.6}px)`,
      }}
    >
      {KERTAS.map((k, i) => {
        const p = pop(k.at);
        const apung = Math.sin(t * 1.5 + i) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + k.x - 230,
              top: 420 + k.y - 170 + apung,
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
            fontWeight: 700,
            color: C.merah,
            border: `12px solid ${C.merah}`,
            borderRadius: 24,
            background: "rgba(7,11,22,0.6)",
            opacity: Math.min(1, pop(6.9) * 1.5),
            transform: `rotate(-10deg) scale(${0.6 + 0.4 * pop(6.9)})`,
          }}
        >
          UJIAN
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 76,
          fontWeight: 700,
          opacity: Math.min(1, cap * 1.5),
          transform: `translateY(${(1 - cap) * 40}px)`,
        }}
      >
        {kata}
      </div>
    </div>
  );
};

/* ---------------- elemen mini UI yang melayang ---------------- */
const MINI = [
  { x: 70, y: 90, r: -6, k: "soal" },
  { x: 1430, y: 100, r: 5, k: "skor" },
  { x: 110, y: 790, r: 4, k: "xp" },
  { x: 1480, y: 820, r: -5, k: "dikuasai" },
  { x: 1560, y: 460, r: 3, k: "timer" },
];

const MiniIsi: React.FC<{ k: string }> = ({ k }) => {
  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 30px",
    borderRadius: 999,
    background: C.kartu,
    border: `2px solid ${C.garis}`,
    fontSize: 34,
    fontWeight: 600,
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
  };
  if (k === "soal")
    return (
      <div style={{ width: 400, padding: 26, borderRadius: 26, background: C.kartu, border: `2px solid ${C.garis}`, boxShadow: "0 20px 60px rgba(0,0,0,0.45)", boxSizing: "border-box" }}>
        <div style={{ fontSize: 22, color: C.redup, marginBottom: 8 }}>Matematika · Aritmetika</div>
        <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 14 }}>Hasil dari 12 × 8 adalah ...</div>
        <div style={{ height: 40, borderRadius: 12, background: C.opsi, border: `2px solid ${C.garis}`, marginBottom: 8 }} />
        <div style={{ height: 40, borderRadius: 12, background: C.hijauBg, border: `2px solid ${C.hijauGaris}` }} />
      </div>
    );
  if (k === "skor")
    return (
      <div style={{ width: 290, padding: 26, borderRadius: 26, background: C.kartu, border: `2px solid ${C.garis}`, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", boxSizing: "border-box" }}>
        <div style={{ fontSize: 22, color: C.redup }}>Simulasi selesai</div>
        <div style={{ fontSize: 80, fontWeight: 700, color: C.hijau }}>93%</div>
      </div>
    );
  if (k === "xp")
    return (
      <div style={pill}>
        <Ikon d={D_PETIR} ukuran={36} warna={C.ungu} />
        +10 XP
      </div>
    );
  if (k === "dikuasai")
    return (
      <div style={{ ...pill, color: C.hijau, borderColor: C.hijauGaris }}>
        <Ikon d={D_CEK} ukuran={36} warna={C.hijau} />
        Dikuasai
      </div>
    );
  return (
    <div style={pill}>
      <span style={{ color: C.redup, fontSize: 26 }}>Sisa waktu</span>
      <span style={{ fontFamily: MONO, fontWeight: 700 }}>11:55</span>
    </div>
  );
};

const Melayang: React.FC<{ t: number; at: number; redup?: number }> = ({ t, at, redup = 1 }) => (
  <>
    {MINI.map((m, i) => {
      const mulai = at + i * 0.15;
      const p = t < mulai ? 0 : spring({ frame: Math.round((t - mulai) * FPS), fps: FPS, config: { damping: 13 } });
      const dari = m.x < 960 ? -500 : 500;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: m.x,
            top: m.y + Math.sin(t * 1.1 + i * 1.7) * 14,
            opacity: Math.min(1, p * 1.5) * redup,
            transform: `translateX(${(1 - p) * dari}px) rotate(${m.r}deg) scale(${0.85 + 0.15 * p})`,
          }}
        >
          <MiniIsi k={m.k} />
        </div>
      );
    })}
  </>
);

const Logo: React.FC<{ t: number; at: number; size: number }> = ({ t, at, size }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    {"EXAMBRE".split("").map((h, i) => {
      const mulai = at + i * 0.06;
      const p = t < mulai ? 0 : spring({ frame: Math.round((t - mulai) * FPS), fps: FPS, config: { damping: 11 } });
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            fontSize: size,
            fontWeight: 700,
            color: "#6b8afd",
            letterSpacing: size * 0.02,
            lineHeight: 1,
            opacity: Math.min(1, p * 1.5),
            transform: `translateY(${(1 - p) * -90}px) scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -12}deg)`,
            textShadow: "0 0 60px rgba(65,103,245,0.55)",
          }}
        >
          {h}
        </span>
      );
    })}
  </div>
);

/* ================= 3. BRAND (7.9 - 12.55 s) ================= */
const Brand: React.FC = () => {
  const { t, pop } = useWaktu(7.9);
  return (
    <>
      <Melayang t={t} at={9.81} />
      <Tengah>
        <div style={{ fontSize: 56, color: "#cbd5e1", marginBottom: 12, opacity: Math.min(1, pop(8.19) * 1.5), transform: `translateY(${(1 - pop(8.19)) * 40}px)` }}>
          Kenalin,
        </div>
        <Logo t={t} at={8.86} size={220} />
        <div
          style={{
            fontSize: 58,
            fontWeight: 600,
            marginTop: 28,
            textAlign: "center",
            lineHeight: 1.25,
            opacity: Math.min(1, pop(9.81) * 1.5),
            transform: `translateY(${(1 - pop(9.81)) * 40}px)`,
          }}
        >
          Satu aplikasi untuk latihan soal apa pun
        </div>
      </Tengah>
    </>
  );
};

/* ================= 4. ULANG SOAL (12.55 - 19.38 s) ================= */
const Lencana: React.FC<{
  warna: string;
  label: string;
  sub?: string;
  p: number;
  children: React.ReactNode;
}> = ({ warna, label, sub, p, children }) => (
  <div
    style={{
      position: "absolute",
      left: 1560 - 190,
      top: 520 - 210,
      width: 380,
      textAlign: "center",
      opacity: Math.min(1, p * 1.5),
      transform: `scale(${0.6 + 0.4 * p})`,
    }}
  >
    <div
      style={{
        width: 240,
        height: 240,
        margin: "0 auto",
        borderRadius: 120,
        border: `10px solid ${warna}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.04)",
        boxShadow: `0 0 90px ${warna}66`,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
    <div style={{ fontSize: 62, fontWeight: 700, color: warna, marginTop: 28 }}>{label}</div>
    {sub && <div style={{ fontSize: 30, color: C.redup, marginTop: 6 }}>{sub}</div>}
  </div>
);

const IkonUlang: React.FC<{ t: number }> = ({ t }) => (
  <svg width={130} height={130} viewBox="0 0 24 24" fill="none" stroke="#6b8afd" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${t * 360}deg)` }}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v5h-5" />
  </svg>
);

const Ulang: React.FC = () => {
  const { t, pop } = useWaktu(12.55);
  const T = 110;
  const L = 300;
  const px = L + CARD_W / 2;
  const in1 = seg(t, 12.6, 13.1);
  const out1 = seg(t, 14.5, 14.9, Easing.in(Easing.cubic));
  const in2 = seg(t, 14.75, 15.25);
  const rings = seg(t, 16.63, 17.9, Easing.inOut(Easing.cubic));

  let lencana: React.ReactNode = null;
  if (t >= 18.0)
    lencana = (
      <Lencana p={pop(18.0)} warna={C.hijau} label="Dikuasai">
        <Ikon d={D_CEK} ukuran={130} warna={C.hijau} tebal={2.6} />
      </Lencana>
    );
  else if (t >= 16.63)
    lencana = (
      <Lencana p={pop(16.63)} warna={C.amber} label="Stabil" sub="hampir hafal">
        <svg width={170} height={170} viewBox="0 0 170 170">
          <circle cx={85} cy={85} r={70} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={16} />
          <circle cx={85} cy={85} r={70} fill="none" stroke={C.amber} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${440 * 0.85 * rings} 440`} transform="rotate(-90 85 85)" />
        </svg>
      </Lencana>
    );
  else if (t >= 15.92)
    lencana = (
      <Lencana p={pop(15.92)} warna={C.hijau} label="Benar" sub="+10 XP">
        <Ikon d={D_CEK} ukuran={130} warna={C.hijau} tebal={2.6} />
      </Lencana>
    );
  else if (t >= 14.6)
    lencana = (
      <Lencana p={pop(14.6)} warna="#6b8afd" label="Muncul lagi" sub="dilatih ulang">
        <IkonUlang t={t} />
      </Lencana>
    );
  else if (t >= 13.7)
    lencana = (
      <Lencana p={pop(13.7)} warna={C.merah} label="Salah" sub="+2 XP">
        <Ikon d={D_SILANG} ukuran={120} warna={C.merah} tebal={2.6} />
      </Lencana>
    );

  const komun = {
    kat: "Bahasa Indonesia",
    warnaKat: "#f87171",
    sub: "Kosakata",
    tanya: "Sinonim dari kata “cerdas” adalah ...",
    opsi: ["cerdik", "malas", "ramah", "ragu", "lambat"],
    benar: 0,
    penjelasan: "“Cerdas” bersinonim dengan cerdik, yaitu tajam pikiran.",
    left: L,
    top: T,
  };

  return (
    <Panggung t={t}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: in1 * (1 - out1),
          transform: `translate(${-out1 * 420}px, ${(1 - in1) * 70}px) scale(${1 - 0.06 * out1})`,
        }}
      >
        <KartuSoal
          {...komun}
          no="04 / 16"
          pilih={t >= 13.5 ? 1 : null}
          terjawab={t >= 13.62}
          umpan={seg(t, 13.62, 13.95)}
          xp="+2 XP"
          ulangi="Kartu ini akan muncul lagi sebentar lagi untuk dilatih ulang."
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: in2,
          transform: `translate(${(1 - in2) * 520}px, 0px)`,
        }}
      >
        <KartuSoal
          {...komun}
          no="07 / 18"
          pilih={t >= 15.8 ? 0 : null}
          terjawab={t >= 15.92}
          umpan={seg(t, 15.92, 16.25)}
          xp="+10 XP"
          ulangi="Direview lagi dalam 1 hari."
        />
      </div>
      {lencana}
      <Letup t={t} at={18.0} x={1560} y={520} warna={C.hijau} />
      <Kursor
        t={t}
        jalur={[
          { t: 12.9, x: 1250, y: 840 },
          { t: 13.45, x: px + 60, y: optY(1, T) },
          { t: 14.6, x: px + 140, y: optY(1, T) + 40 },
          { t: 15.75, x: px + 70, y: optY(0, T) },
        ]}
        klik={[13.5, 15.8]}
      />
    </Panggung>
  );
};

/* ================= 5. SIMULASI (19.38 - 24.35 s) ================= */
const HASIL_KAT: [string, string, number][] = [
  ["IPS", "3/3 (100%)", 100],
  ["Matematika", "2/3 (67%)", 67],
  ["IPA", "3/3 (100%)", 100],
  ["Bahasa Inggris", "3/3 (100%)", 100],
  ["Bahasa Indonesia", "3/3 (100%)", 100],
];

const Simulasi: React.FC = () => {
  const { t, pop } = useWaktu(19.38);
  const sisa = Math.max(0, 720 - Math.floor(Math.max(0, t - 19.6) * 50));
  const waktu = `${pad2(Math.floor(sisa / 60))}:${pad2(sisa % 60)}`;
  const hilang = seg(t, 23.15, 23.45, Easing.in(Easing.cubic));
  const hasilP = seg(t, 23.4, 23.9);
  const sel = (i: number) => 21.9 + i * 0.09;
  const terisi = Array.from({ length: 15 }, (_, i) => (t >= sel(i) ? 1 : 0)).reduce<number>((a, b) => a + b, 0);
  const opsi = ["17 Agustus 1945", "28 Oktober 1928", "1 Juni 1945", "10 November 1945", "18 Agustus 1945"];
  const kartuKiri: React.CSSProperties = {
    position: "absolute",
    boxSizing: "border-box",
    borderRadius: 28,
    background: C.kartu,
    border: `2px solid ${C.garis}`,
    boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
  };
  const skor = Math.round(93 * seg(t, 23.55, 24.1, Easing.out(Easing.cubic)));
  return (
    <Panggung t={t}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 1 - hilang, transform: `scale(${1 - 0.05 * hilang})` }}>
        {/* timer */}
        <Masuk p={pop(19.54)} dy={-80}>
          <div style={{ ...kartuKiri, left: 250, top: 80, width: 800, height: 90, padding: "0 34px", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 30, color: C.redup }}>Sisa waktu</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 50, fontWeight: 700 }}>{waktu}</span>
            <div style={{ position: "absolute", left: 34, right: 34, bottom: 10, height: 8, borderRadius: 4, background: "#0b0f14" }}>
              <div style={{ width: `${(sisa / 720) * 100}%`, height: 8, borderRadius: 4, background: C.aksen }} />
            </div>
          </div>
        </Masuk>
        {/* kartu ujian */}
        <Masuk p={pop(19.7)} dy={80}>
          <div style={{ ...kartuKiri, left: 250, top: 200, width: 800, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
              <span style={{ padding: "6px 18px", borderRadius: 10, background: "#fff1d6", color: "#9a5b00", fontSize: 26, fontWeight: 700 }}>IPS</span>
              <Pil warna={C.teks}>Sejarah</Pil>
              <span style={{ marginLeft: "auto", fontSize: 26, color: C.redup }}>{terisi}/15 dijawab</span>
            </div>
            <div style={{ height: 110, display: "flex", alignItems: "center", fontSize: 38, fontWeight: 600, lineHeight: 1.25 }}>
              Proklamasi Kemerdekaan Indonesia dibacakan pada tanggal ...
            </div>
            {opsi.map((o, i) => {
              const g = GAYA[i === 0 && t >= 20.9 ? "pilih" : "netral"];
              return (
                <div key={i} style={{ height: 66, marginBottom: i < 4 ? 10 : 0, borderRadius: 18, background: g.bg, border: `2px solid ${g.br}`, display: "flex", alignItems: "center", padding: "0 26px", fontSize: 32, boxSizing: "border-box" }}>
                  <span style={{ fontFamily: MONO, width: 54, color: C.redup }}>{"ABCDE"[i]}</span>
                  {o}
                </div>
              );
            })}
          </div>
        </Masuk>
        {/* grid nomor */}
        <Masuk p={seg(t, 21.42, 21.9)} dx={300} dy={0}>
          <div style={{ ...kartuKiri, left: 1230, top: 200, width: 500, padding: 28 }}>
            <div style={{ fontSize: 28, color: C.redup, marginBottom: 18 }}>Navigasi nomor</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
              {Array.from({ length: 15 }, (_, i) => {
                const aktif = t >= sel(i);
                const denyut = aktif ? 1 + 0.25 * (1 - seg(t, sel(i), sel(i) + 0.25)) : 1;
                return (
                  <div
                    key={i}
                    style={{
                      height: 76,
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                      fontWeight: 700,
                      background: aktif ? C.aksen : C.opsi,
                      border: `2px solid ${aktif ? C.aksen : C.garis}`,
                      color: aktif ? "#fff" : C.teks,
                      transform: `scale(${denyut})`,
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </Masuk>
        <Kursor t={t} jalur={[{ t: 20.2, x: 1150, y: 800 }, { t: 20.8, x: 640, y: 200 + 28 + 56 + 110 + 33 }]} klik={[20.9]} />
      </div>
      {/* hasil */}
      {t >= 23.4 && (
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: Math.min(1, hasilP * 1.5), transform: `scale(${0.92 + 0.08 * hasilP})` }}>
          <div style={{ ...kartuKiri, left: 200, top: 190, width: 600, height: 520, textAlign: "center", paddingTop: 50 }}>
            <div style={{ fontSize: 34, color: C.redup }}>Simulasi selesai</div>
            <div style={{ fontSize: 200, fontWeight: 700, color: C.hijau, lineHeight: 1.1 }}>{skor}%</div>
            <div style={{ fontSize: 30, color: C.redup }}>14 benar · 1 salah · 0 kosong dari 15 soal</div>
            <div style={{ fontSize: 26, color: C.redup, marginTop: 14 }}>Waktu terpakai: 1:12</div>
          </div>
          <div style={{ ...kartuKiri, left: 860, top: 130, width: 860, padding: "30px 40px" }}>
            <div style={{ fontSize: 38, fontWeight: 700, marginBottom: 18 }}>Per Kategori</div>
            {HASIL_KAT.map(([nama, nilai, persen], i) => {
              const w = seg(t, 23.6 + i * 0.1, 24.2);
              const warna = persen === 100 ? C.hijau : C.ungu;
              return (
                <div key={nama} style={{ marginBottom: 26 }}>
                  <div style={{ display: "flex", fontSize: 34, marginBottom: 10 }}>
                    <span>{nama}</span>
                    <span style={{ marginLeft: "auto", color: warna, fontWeight: 600 }}>{nilai}</span>
                  </div>
                  <div style={{ height: 14, borderRadius: 7, background: "#0b0f14" }}>
                    <div style={{ height: 14, borderRadius: 7, width: `${persen * w}%`, background: warna }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panggung>
  );
};

/* ================= 6. INPUT SOAL (24.35 - 30.75 s) ================= */
const InputSoal: React.FC = () => {
  const { t, pop } = useWaktu(24.35);
  const mode = t < 27.3 ? 0 : t < 28.45 ? 1 : 2;
  const vis = (a: number, b: number) => interpolate(t, [a, a + 0.2, b - 0.2, b], [0, 1, 1, 0], KLAMP);
  const kotak: React.CSSProperties = {
    position: "absolute",
    left: 410,
    top: 300,
    width: 1100,
    height: 560,
    boxSizing: "border-box",
  };
  const teksPaste = ["Hasil dari 12 × 8 adalah ...", "A. 86   B. 96   C. 104   D. 112   E. 98"];
  const baris1 = ketik(teksPaste[0], t, 26.3, 26.7);
  const baris2 = ketik(teksPaste[1], t, 26.7, 27.15);
  const pembahasan = "12 × 8 = 96. Kalikan 10 × 8 = 80, lalu 2 × 8 = 16, sehingga 80 + 16 = 96.";
  const tab = (nama: string, aktif: boolean) => (
    <div
      style={{
        padding: "14px 34px",
        borderRadius: 999,
        fontSize: 34,
        fontWeight: 600,
        background: aktif ? C.aksen : C.opsi,
        border: `2px solid ${aktif ? C.aksen : C.garis}`,
        color: aktif ? "#fff" : C.redup,
        transform: `scale(${aktif ? 1.06 : 1})`,
      }}
    >
      {nama}
    </div>
  );
  const kunci: React.CSSProperties = {
    padding: "10px 26px",
    borderRadius: 14,
    background: "#1f252c",
    border: "2px solid #36404c",
    fontFamily: MONO,
    fontSize: 32,
    boxShadow: "0 5px 0 #36404c",
  };
  return (
    <Panggung t={t}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontSize: 70, fontWeight: 700, opacity: Math.min(1, pop(24.49) * 1.5), transform: `translateY(${(1 - pop(24.49)) * 40}px)` }}>
        Input soal cepat
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", gap: 24, opacity: Math.min(1, pop(24.7) * 1.5) }}>
        {tab("Tempel", mode === 0)}
        {tab("Scan foto", mode === 1)}
        {tab("Pembahasan AI", mode === 2)}
      </div>

      {/* Tempel */}
      <div style={{ ...kotak, opacity: vis(24.5, 27.3) * Math.min(1, pop(24.8) * 1.5) }}>
        <div style={{ height: 500, borderRadius: 30, border: "3px dashed #3a4350", background: "#12161a", padding: "40px 50px", boxSizing: "border-box", position: "relative" }}>
          {t < 26.3 && (
            <div style={{ fontSize: 36, color: C.redup, lineHeight: 1.5 }}>
              Ctrl+V untuk paste soal dari Ruangguru atau website lain.
            </div>
          )}
          {t >= 26.3 && (
            <>
              <div style={{ fontSize: 44, fontWeight: 600, marginTop: 40 }}>{baris1}</div>
              <div style={{ fontSize: 38, color: "#d6dbdb", marginTop: 20, fontFamily: MONO }}>{baris2}</div>
            </>
          )}
          <div style={{ position: "absolute", right: 50, top: 36, display: "flex", gap: 14, alignItems: "center", opacity: seg(t, 26.1, 26.3), transform: `translateY(${t >= 26.18 && t < 26.3 ? 5 : 0}px)` }}>
            <span style={kunci}>Ctrl</span>
            <span style={{ fontSize: 30, color: C.redup }}>+</span>
            <span style={kunci}>V</span>
          </div>
          {t >= 27.05 && (
            <div style={{ position: "absolute", left: 50, bottom: 36, opacity: Math.min(1, pop(27.05) * 1.5), transform: `scale(${0.7 + 0.3 * pop(27.05)})`, transformOrigin: "0 100%" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 28px", borderRadius: 999, border: `3px solid ${C.hijauGaris}`, background: C.hijauBg, color: C.hijau, fontSize: 34, fontWeight: 600 }}>
                <Ikon d={D_CEK} ukuran={34} warna={C.hijau} tebal={3} />
                Soal terbaca
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scan */}
      <div style={{ ...kotak, opacity: vis(27.3, 28.45) }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 90, height: 500 }}>
          <div style={{ position: "relative", width: 480, height: 440, borderRadius: 14, background: "#eef1f4", transform: "rotate(-3deg)", boxShadow: "0 30px 80px rgba(0,0,0,0.55)", overflow: "hidden", padding: "36px 40px", boxSizing: "border-box" }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ height: i % 4 === 0 ? 18 : 12, width: `${i % 3 === 0 ? 70 : 92 - (i % 2) * 14}%`, borderRadius: 6, background: "rgba(15,23,42,0.28)", marginBottom: 24 }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 440 * seg(t, 27.4, 28.1, Easing.linear), background: "rgba(65,103,245,0.22)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 440 * seg(t, 27.4, 28.1, Easing.linear) - 3, height: 6, background: C.aksen, boxShadow: `0 0 30px 8px ${C.aksen}` }} />
          </div>
          <div style={{ width: 360 }}>
            {t < 28.15 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 30px", borderRadius: 999, background: C.opsi, border: `2px solid ${C.garis}`, color: C.redup, fontSize: 34, fontWeight: 600 }}>
                <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.redup} strokeWidth={3} strokeLinecap="round" style={{ transform: `rotate(${t * 540}deg)` }}>
                  <path d="M12 3a9 9 0 1 0 9 9" />
                </svg>
                Memindai...
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 30px", borderRadius: 999, border: `3px solid ${C.hijauGaris}`, background: C.hijauBg, color: C.hijau, fontSize: 34, fontWeight: 600, opacity: Math.min(1, pop(28.15) * 1.5) }}>
                <Ikon d={D_CEK} ukuran={34} warna={C.hijau} tebal={3} />
                3 soal terbaca
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pembahasan AI */}
      <div style={{ ...kotak, opacity: mode === 2 ? Math.min(1, seg(t, 28.45, 28.7) * 1.5) : 0 }}>
        <div style={{ borderRadius: 30, background: C.kartu, border: `2px solid ${C.garis}`, padding: "44px 56px", boxShadow: "0 30px 90px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <Ikon d={D_KILAU} ukuran={52} warna={C.ungu} />
            <span style={{ fontSize: 44, fontWeight: 700 }}>Pembahasan</span>
            <span style={{ marginLeft: "auto", padding: "6px 20px", borderRadius: 999, border: `2px solid ${C.ungu}`, color: C.ungu, fontSize: 28, fontWeight: 600 }}>AI</span>
          </div>
          <div style={{ fontSize: 44, lineHeight: 1.45, minHeight: 260, color: "#e6ebeb" }}>
            {ketik(pembahasan, t, 28.6, 30.3)}
            <span style={{ display: "inline-block", width: 4, height: 46, background: C.ungu, marginLeft: 4, verticalAlign: "middle", opacity: Math.floor(t * 3) % 2 }} />
          </div>
        </div>
      </div>

    </Panggung>
  );
};

/* ================= 7. CATATAN -> SOAL -> STATISTIK (30.75 - 36.43 s) ================= */
const KAT_STAT: [string, number, string][] = [
  ["Matematika", 50, C.amber],
  ["Bahasa Indonesia", 60, C.ungu],
  ["IPA", 100, C.hijau],
  ["IPS", 100, C.hijau],
  ["Bahasa Inggris", 100, C.hijau],
];

const CatatanStatistik: React.FC = () => {
  const { t, pop } = useWaktu(30.75);
  const aKeluar = seg(t, 33.1, 33.45, Easing.in(Easing.cubic));
  const bMasuk = seg(t, 33.32, 33.8);
  const modal = interpolate(t, [31.7, 32.0, 32.55, 32.8], [0, 1, 1, 0], KLAMP);
  const kartuDasar: React.CSSProperties = {
    position: "absolute",
    boxSizing: "border-box",
    borderRadius: 28,
    background: C.kartu,
    border: `2px solid ${C.garis}`,
    boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
  };
  const denyut = 1 + 0.25 * (1 - seg(t, 31.6, 31.9));
  const hitung = (n: number, a: number) => Math.round(n * seg(t, a, a + 0.7, Easing.out(Easing.cubic)));
  const cincin = 80 * seg(t, 35.5, 36.3, Easing.out(Easing.cubic));
  return (
    <Panggung t={t}>
      {/* Bagian A: catatan -> soal */}
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 1 - aKeluar, transform: `translateX(${-aKeluar * 200}px)` }}>
        <Masuk p={pop(30.88)} dx={-200} dy={40}>
          <div style={{ ...kartuDasar, left: 220, top: 320, width: 740, height: 280, padding: 40 }}>
            <div style={{ fontSize: 42, fontWeight: 700 }}>Catatan</div>
            <div style={{ fontSize: 28, color: C.redup, marginTop: 24 }}>14 Nov 2026</div>
            <div style={{ fontSize: 40, marginTop: 14, color: "#e6ebeb" }}>Luas lingkaran = π × r²</div>
            <div style={{ position: "absolute", right: 36, top: 32, width: 76, height: 76, borderRadius: 18, border: `3px solid ${C.ungu}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${denyut})`, boxShadow: t >= 31.6 && t < 32.6 ? `0 0 40px ${C.ungu}` : "none" }}>
              <Ikon d={D_KILAU} ukuran={40} warna={C.ungu} />
            </div>
          </div>
        </Masuk>
        {/* modal Buat Soal dari Catatan */}
        <div style={{ position: "absolute", left: 0, top: 0, opacity: modal, transform: `scale(${0.9 + 0.1 * modal})`, transformOrigin: "1380px 560px" }}>
          <div style={{ ...kartuDasar, left: 1060, top: 330, width: 640, padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 38, fontWeight: 700 }}>
              <Ikon d={D_KILAU} ukuran={40} warna={C.ungu} />
              Buat Soal dari Catatan
            </div>
            <div style={{ fontSize: 26, color: C.redup, marginTop: 12, lineHeight: 1.3 }}>
              AI akan menyusun soal latihan berdasarkan isi catatan ini, lengkap dengan pembahasan.
            </div>
            {[["Jumlah soal", "5 soal"], ["Kategori tujuan", "Matematika"]].map(([a, b]) => (
              <div key={a} style={{ marginTop: 22 }}>
                <div style={{ fontSize: 26, color: C.redup, marginBottom: 8 }}>{a}</div>
                <div style={{ height: 64, borderRadius: 16, background: C.opsi, border: `2px solid ${C.garis}`, display: "flex", alignItems: "center", padding: "0 24px", fontSize: 32 }}>{b}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 28 }}>
              <div style={{ padding: "14px 36px", borderRadius: 999, background: C.opsi, fontSize: 30, fontWeight: 600 }}>Batal</div>
              <div style={{ padding: "14px 36px", borderRadius: 999, background: C.aksen, fontSize: 30, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, transform: `scale(${t >= 32.5 && t < 32.65 ? 0.94 : 1})` }}>
                <Ikon d={D_KILAU} ukuran={28} warna="#fff" />
                Generate
              </div>
            </div>
          </div>
        </div>
        {/* soal hasil generate */}
        {Array.from({ length: 5 }, (_, i) => {
          const p = pop(32.6 + i * 0.08);
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, p * 1.5), transform: `translate(${(1 - p) * -500}px, ${(1 - p) * -80}px) rotate(${-6 + i * 3 + (1 - p) * -20}deg)` }}>
              <div style={{ ...kartuDasar, left: 1060 + i * 135, top: 640 + (i % 2) * 30, width: 250, height: 160, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, fontWeight: 600 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, border: "4px solid #fff", background: C.aksen, boxSizing: "border-box" }} />
                  Matematika
                </div>
                <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.2)", marginTop: 18, width: "90%" }} />
                <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.12)", marginTop: 12, width: "60%" }} />
                <div style={{ fontSize: 22, color: C.redup, marginTop: 14 }}>Soal {i + 1}</div>
              </div>
            </div>
          );
        })}
        <Kursor
          t={t}
          jalur={[
            { t: 30.95, x: 1300, y: 860 },
            { t: 31.5, x: 920, y: 372 },
            { t: 31.95, x: 920, y: 372 },
            { t: 32.45, x: 1545, y: 735 },
          ]}
          klik={[31.6, 32.5]}
        />
      </div>

      {/* Bagian B: dashboard statistik */}
      {t >= 33.3 && (
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: Math.min(1, bMasuk * 1.5), transform: `translateX(${(1 - bMasuk) * 120}px)` }}>
          {[
            ["20", "Total Soal", C.teks, 160, 170, 33.5],
            ["0", "Dikuasai", C.hijau, 514, 170, 33.6],
            ["0", "Jatuh Tempo", C.ungu, 160, 344, 33.7],
            ["80%", "Akurasi", C.teks, 514, 344, 33.8],
          ].map(([n, l, w, x, y, at]) => (
            <div key={String(l)} style={{ ...kartuDasar, left: Number(x), top: Number(y), width: 330, height: 150, textAlign: "center", paddingTop: 20, borderColor: l === "Akurasi" && t >= 35.5 ? C.hijau : C.garis }}>
              <div style={{ fontSize: 68, fontWeight: 700, color: String(w) }}>
                {l === "Total Soal" ? hitung(20, Number(at)) : l === "Akurasi" ? `${hitung(80, Number(at))}%` : n}
              </div>
              <div style={{ fontSize: 30, color: C.redup }}>{l}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 352, top: 570, width: 300, textAlign: "center", opacity: seg(t, 35.3, 35.6) }}>
            <svg width={300} height={300} viewBox="0 0 300 300">
              <circle cx={150} cy={150} r={116} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={26} />
              <circle cx={150} cy={150} r={116} fill="none" stroke={C.hijau} strokeWidth={26} strokeLinecap="round" strokeDasharray={`${(729 * cincin) / 100} 729`} transform="rotate(-90 150 150)" />
              <text x={150} y={168} textAnchor="middle" fill={C.teks} fontSize={76} fontWeight={700}>{Math.round(cincin)}%</text>
            </svg>
            <div style={{ fontSize: 34, color: C.redup, marginTop: 6, opacity: seg(t, 35.4, 35.7) }}>Kesiapan ujianmu</div>
          </div>
          <div style={{ ...kartuDasar, left: 940, top: 130, width: 820, padding: "30px 40px" }}>
            <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 20 }}>Akurasi per kategori</div>
            {KAT_STAT.map(([nama, persen, warna], i) => {
              const lemah = i === 0 && t >= 34.8;
              return (
                <div key={nama} style={{ marginBottom: 26, transform: `scale(${lemah ? 1.03 : 1})`, transformOrigin: "0 50%" }}>
                  <div style={{ display: "flex", fontSize: 34, marginBottom: 10 }}>
                    <span style={{ fontWeight: lemah ? 700 : 500 }}>{nama}</span>
                    <span style={{ marginLeft: "auto", color: warna, fontWeight: 700 }}>{Math.round(persen * seg(t, 33.6 + i * 0.12, 34.3))}%</span>
                  </div>
                  <div style={{ height: 16, borderRadius: 8, background: "#0b0f14" }}>
                    <div style={{ height: 16, borderRadius: 8, width: `${persen * seg(t, 33.6 + i * 0.12, 34.3)}%`, background: warna, boxShadow: lemah ? `0 0 24px ${warna}` : "none" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Masuk p={pop(34.8)} dy={40}>
            <div style={{ ...kartuDasar, left: 940, top: 830, width: 820, padding: "24px 36px", display: "flex", alignItems: "center", gap: 20, borderColor: C.amber, background: "#1d1a10" }}>
              <Ikon d={D_KILAU} ukuran={44} warna={C.amber} />
              <div style={{ fontSize: 32, lineHeight: 1.3 }}>
                Fokuskan review ke <b>Matematika</b> — akurasi kamu di sana baru 50%.
              </div>
            </div>
          </Masuk>
        </div>
      )}
    </Panggung>
  );
};

/* ================= 8. PRIVASI (36.43 - 42.2 s) ================= */
const gambar = (prog: number, a: number, b: number) => 1 - seg(prog, a, b, Easing.inOut(Easing.cubic));

const IkonAkun: React.FC<{ prog: number }> = ({ prog }) => (
  <svg width={200} height={200} viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={60} cy={40} r={20} pathLength={1} strokeDasharray={1} strokeDashoffset={gambar(prog, 0, 0.5)} />
    <path d="M 22 100 C 22 70, 98 70, 98 100" pathLength={1} strokeDasharray={1} strokeDashoffset={gambar(prog, 0.2, 0.7)} />
    <line x1={18} y1={108} x2={102} y2={12} stroke={C.merah} pathLength={1} strokeDasharray={1} strokeDashoffset={gambar(prog, 0.6, 1)} />
  </svg>
);

const IkonPerangkat: React.FC<{ prog: number }> = ({ prog }) => (
  <svg width={200} height={200} viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <rect x={32} y={8} width={56} height={104} rx={12} pathLength={1} strokeDasharray={1} strokeDashoffset={gambar(prog, 0, 0.55)} />
    <g transform={`translate(0 ${-14 * (1 - seg(prog, 0.45, 0.85))})`} opacity={seg(prog, 0.35, 0.55)}>
      <path d="M 52 58 v -8 a 8 8 0 0 1 16 0 v 8" stroke={C.hijau} />
    </g>
    <rect x={46} y={58} width={28} height={24} rx={5} stroke={C.hijau} opacity={seg(prog, 0.4, 0.7)} />
  </svg>
);

const IkonOffline: React.FC<{ prog: number }> = ({ prog }) => (
  <svg width={200} height={200} viewBox="0 0 120 120" fill="none" stroke="white" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 12 46 a 68 68 0 0 1 96 0" opacity={seg(prog, 0, 0.3)} />
    <path d="M 28 64 a 44 44 0 0 1 64 0" opacity={seg(prog, 0.15, 0.45)} />
    <path d="M 44 80 a 20 20 0 0 1 32 0" opacity={seg(prog, 0.3, 0.6)} />
    <circle cx={60} cy={96} r={4} fill="white" opacity={seg(prog, 0.4, 0.7)} />
    <line x1={18} y1={108} x2={102} y2={12} stroke={C.amber} pathLength={1} strokeDasharray={1} strokeDashoffset={gambar(prog, 0.6, 1)} />
  </svg>
);

const KartuIkon: React.FC<{ p: number; label: string; children: React.ReactNode }> = ({ p, label, children }) => (
  <div
    style={{
      width: 420,
      height: 440,
      boxSizing: "border-box",
      borderRadius: 32,
      background: C.kartu,
      border: `2px solid ${C.garis}`,
      boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + 0.1 * p})`,
    }}
  >
    {children}
    <div style={{ fontSize: 40, fontWeight: 600, textAlign: "center" }}>{label}</div>
  </div>
);

const Privasi: React.FC = () => {
  const { t, pop } = useWaktu(36.43);
  return (
    <Tengah>
      <div style={{ fontSize: 60, color: "#cbd5e1", marginBottom: 44, opacity: Math.min(1, pop(36.54) * 1.5), transform: `translateY(${(1 - pop(36.54)) * 40}px)` }}>
        Yang paling penting
      </div>
      <div style={{ display: "flex", gap: 50 }}>
        <KartuIkon p={pop(37.99)} label="Tanpa akun">
          <IkonAkun prog={seg(t, 38.1, 39.0, Easing.linear)} />
        </KartuIkon>
        <KartuIkon p={pop(38.84)} label="Data di perangkatmu">
          <IkonPerangkat prog={seg(t, 38.95, 39.9, Easing.linear)} />
        </KartuIkon>
        <KartuIkon p={pop(40.4)} label="Bisa offline">
          <IkonOffline prog={seg(t, 40.5, 41.4, Easing.linear)} />
        </KartuIkon>
      </div>
    </Tengah>
  );
};

/* ================= 9. PENUTUP (42.2 - 49 s) ================= */
const Penutup: React.FC = () => {
  const { t, pop } = useWaktu(42.2);
  const tekan = t >= 46.0 && t < 46.2 ? 0.94 : 1;
  const nafas = 1 + Math.sin(t * 3) * 0.015 * seg(t, 46.5, 47);
  return (
    <>
      <Melayang t={t} at={43.3} redup={0.55} />
      <Tengah>
        <Logo t={t} at={42.36} size={190} />
        <div style={{ fontSize: 70, fontWeight: 700, marginTop: 40, opacity: Math.min(1, pop(43.32) * 1.5), transform: `translateY(${(1 - pop(43.32)) * 40}px)` }}>
          Belajar lebih cerdas,
        </div>
        <div style={{ fontSize: 70, fontWeight: 700, color: C.amber, opacity: Math.min(1, pop(44.45) * 1.5), transform: `translateY(${(1 - pop(44.45)) * 40}px)` }}>
          bukan lebih lama.
        </div>
        <div style={{ marginTop: 56, opacity: Math.min(1, pop(45.73) * 1.5), transform: `scale(${(0.7 + 0.3 * pop(45.73)) * tekan * nafas})` }}>
          <div style={{ padding: "22px 64px", borderRadius: 999, background: C.aksen, fontSize: 54, fontWeight: 700, boxShadow: "0 0 80px rgba(65,103,245,0.6)" }}>
            Coba sekarang
          </div>
        </div>
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 14, fontSize: 46, color: "#cbd5e1", opacity: Math.min(1, pop(46.59) * 1.5), transform: `translateY(${(1 - pop(46.59)) * 30}px)` }}>
          <Ikon d={D_LINK} ukuran={46} warna="#cbd5e1" />
          Link di bio
        </div>
      </Tengah>
      <Kursor t={t} jalur={[{ t: 45.3, x: 1350, y: 960 }, { t: 45.95, x: 1000, y: 790 }]} klik={[46.05]} />
    </>
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
  useFonts();
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
    </AbsoluteFill>
  );
};
