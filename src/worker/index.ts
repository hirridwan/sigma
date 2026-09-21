import { Hono } from "hono";
import { cors } from "hono/cors";
import { marked } from "marked";
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
  PAKASIR_API_KEY: string;
}


const MODEL = "gemini-3.8-flash";
const MAX_REFERENCE_FILE_BYTES = 15 * 1024 * 1024;
const PAKASIR_SLUG = "sigma-sistem-generator-modul-ajar";
const PAKASIR_AMOUNT = 5000;

const app = new Hono<{ Bindings: Env }>();

app.use("/api", cors());
app.use("/api/*", cors());

app.get("/api", (c) => {
  return c.json({ success: true, message: "SIGMA API is running" });
});

app.get("/api/", (c) => {
  return c.json({ success: true, message: "SIGMA API is running" });
});


function inferMimeType(fileName: string, provided: string): string {
  if (provided) return provided;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

function isSupportedReferenceFile(file: File): boolean {
  const mime = inferMimeType(file.name, file.type);
  return [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ].includes(mime);
}

function removeModelReferenceSection(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const index = lines.findIndex((line) =>
    /^#{1,6}\s*(?:[A-Z]\.?\s*)?Sumber Referensi\b/i.test(line.trim()),
  );

  if (index === -1) return markdown.trim();
  return lines.slice(0, index).join("\n").trim();
}

function buildReferenceSection(referenceUrl: string, referenceFileName: string): string {
  const items: string[] = [];

  if (referenceUrl) {
    items.push(`- URL: ${referenceUrl}`);
  }

  if (referenceFileName) {
    items.push(`- File referensi pengguna: ${referenceFileName}`);
  }

  if (items.length === 0) {
    items.push("- Tidak ada sumber referensi yang diberikan pengguna.");
  }

  return `\n\n---\n\n## SUMBER REFERENSI\n\n${items.join("\n")}`;
}

function censorPreviewLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  if (/^#{1,6}\s+/.test(trimmed)) return line;
  if (/^-{3,}\s*$/.test(trimmed)) return line;
  if (/^[A-Z0-9][A-Z0-9\s/&().,:\-]{4,}$/.test(trimmed)) return line;
  if (/^[A-Z]\.?\s+.+$/.test(trimmed) && !trimmed.includes(":")) return line;
  if (/^\d+[.)]\s+.+$/.test(trimmed) && !trimmed.includes(":")) return line;

  if (trimmed.startsWith("|")) {
    if (/^\|[\s|:-]+\|$/.test(trimmed)) return line;
    const cells = trimmed.slice(1, -1).split("|");
    return `| ${cells.map(() => "••••••").join(" | ")} |`;
  }

  const bulletMatch = line.match(/^(\s*(?:[-*+]\s+|\d+[.)]\s+))/);
  if (bulletMatch) return `${bulletMatch[1]}••••••••••`;

  const labelMatch = line.match(/^(\s*(?:\*\*|__)?[^:\n]{1,80}(?:\*\*|__)?:)\s*/);
  if (labelMatch) return `${labelMatch[1]} ••••••••••`;

  if (/^>\s*/.test(trimmed)) return "> ••••••••••";

  return "••••••••••••••••";
}

function buildSensoredPreviewMarkdown(markdown: string): string {
  const clean = markdown.trim();
  const preview = clean
    .split(/\r?\n/)
    .map(censorPreviewLine)
    .join("\n")
    .trim();

  return `${preview}\n\n---\n\n## PEMBAYARAN UNTUK MELIHAT ISI LENGKAP\n\nPreview modul menampilkan seluruh struktur, tetapi isi detail **disensor**. Lakukan pembayaran **Rp5.000** untuk melihat isi lengkap dan mengunduh modul ajar dalam format Word.`;
}

const WORD_THEME_COLORS: Record<string, string> = {
  blue: "#1e3a8a",
  emerald: "#047857",
  purple: "#6d28d9",
  slate: "#334155",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugifyServer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "SIGMA";
}

function buildWordDocument(markdown: string, author: string, phase: string, theme: string): string {
  const colorHex = WORD_THEME_COLORS[theme] || WORD_THEME_COLORS.blue;
  const markdownHtml = marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string;

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Modul Ajar SIGMA</title>
<style>
@page WordSection1 { size: 21cm 29.7cm; margin: 2.5cm 2cm 2.5cm 3cm; mso-page-orientation: portrait; }
div.WordSection1 { page: WordSection1; }
html, body { margin:0 !important; padding:0 !important; font-family:'Times New Roman', Times, serif !important; font-size:12pt !important; line-height:150% !important; color:#000 !important; }
p, div, li { font-family:'Times New Roman', Times, serif !important; font-size:12pt; line-height:150%; margin:0 !important; padding:0 !important; margin-left:0 !important; margin-right:0 !important; text-indent:0 !important; mso-margin-top-alt:0 !important; mso-margin-bottom-alt:0 !important; mso-para-margin-left:0 !important; mso-para-margin-right:0 !important; }
p.SigmaBody { font-size:12pt !important; line-height:150% !important; margin:0 !important; padding:0 !important; text-indent:0 !important; }
p.SigmaHeading14 { font-size:14pt !important; font-weight:bold !important; line-height:150% !important; color:${colorHex} !important; margin:0 !important; padding:0 !important; text-indent:0 !important; border:0 !important; box-shadow:none !important; }
p.SigmaHeading12 { font-size:12pt !important; font-weight:bold !important; line-height:150% !important; color:${colorHex} !important; margin:0 !important; padding:0 !important; text-indent:0 !important; border:0 !important; box-shadow:none !important; }
.cover-page { page-break-after:always !important; break-after:page !important; text-align:center !important; margin:0 !important; padding:0 !important; min-height:230mm !important; border:0 !important; box-shadow:none !important; }
ul, ol { list-style:none !important; margin:0 !important; padding:0 !important; }
table { border-collapse:collapse; width:100%; margin:0 !important; padding:0 !important; page-break-inside:auto; }
tr { page-break-inside:avoid; page-break-after:auto; }
th, td { border:1px solid #000; padding:6pt; vertical-align:top; font-family:'Times New Roman', Times, serif !important; font-size:12pt !important; line-height:150% !important; margin:0 !important; text-indent:0 !important; }
a { color:#000 !important; text-decoration:none !important; }
</style>
</head>
<body>
<div class='WordSection1'>
  <div class='cover-page'>
    <p style='margin:0;padding-top:60mm;border:0;color:${colorHex};font-size:25pt;font-family:"Times New Roman",Times,serif;font-weight:bold;'>MODUL AJAR</p>
    <div style='margin:24mm auto 0;display:inline-block;min-width:260px;border-top:2px solid ${colorHex};padding-top:5mm;text-align:left;font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:150%;'>
      <p style='margin:0;padding:0;'><b>Nama Penyusun:</b> ${escapeHtml(author)}</p>
      <p style='margin:0;padding:0;'><b>Fase / Kelas / Jenjang Sekolah:</b> ${escapeHtml(phase)}</p>
    </div>
  </div>
  <div>${markdownHtml}</div>
</div>
</body>
</html>`;
}

async function verifyPakasirTransaction(c: any, orderId: string): Promise<boolean> {
  if (!c.env.PAKASIR_API_KEY) {
    throw new Error("PAKASIR_API_KEY belum tersedia di Cloudflare.");
  }

  const url = new URL("https://app.pakasir.com/api/transactiondetail");
  url.searchParams.set("project", PAKASIR_SLUG);
  url.searchParams.set("amount", String(PAKASIR_AMOUNT));
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("api_key", c.env.PAKASIR_API_KEY);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const result = await response.json().catch(() => null) as { transaction?: { status?: string; amount?: number; project?: string; order_id?: string } } | null;
  const transaction = result?.transaction;

  if (!response.ok || !transaction) return false;
  return (
    String(transaction.status || "").toLowerCase() === "completed" &&
    Number(transaction.amount) === PAKASIR_AMOUNT &&
    String(transaction.project || "") === PAKASIR_SLUG &&
    String(transaction.order_id || "") === orderId
  );
}

function buildDefaultStructure(): string {
  return `Gunakan urutan heading dan komponen berikut secara KETAT. Jangan mengubah urutan bagian utama:

INFORMASI UMUM
A. Identitas Modul
B. Identifikasi Kesiapan Peserta Didik
C. Karakteristik Mata Pelajaran
D. Dimensi Profil Lulusan

DESAIN PEMBELAJARAN
A. Capaian Pembelajaran
B. Lintas Disiplin Ilmu
C. Tujuan Pembelajaran
D. Topik Pembelajaran Kontekstual
E. Kerangka Pembelajaran
   1. Praktik Pedagogis
      - Praktik pedagogis utama yang dipilih pendidik
      - Metode/teknik pendukung yang digunakan
   2. Kemitraan Pembelajaran
   3. Lingkungan Pembelajaran
   4. Pemanfaatan Digital
F. Pembelajaran Mendalam
   1. Prinsip Pembelajaran: berkesadaran, bermakna, menggembirakan
   2. Pengalaman Belajar: memahami, mengaplikasi, merefleksi
G. Kegiatan Pembelajaran
   Gunakan tabel Markdown dengan kolom: No, Kegiatan, Langkah-Langkah, Alokasi Waktu.
   Wajib ada Pendahuluan, Kegiatan Inti, dan Penutup.
H. Asesmen
   1. Asesmen pada awal pembelajaran
   2. Asesmen selama proses pembelajaran
   3. Asesmen pada akhir pembelajaran

LAMPIRAN
A. Ringkasan Materi
B. Sumber Referensi

JANGAN membuat bagian sumber referensi sendiri. Bagian tersebut akan ditambahkan otomatis oleh aplikasi berdasarkan sumber yang benar-benar diberikan pengguna.`;
}

function buildPrompt(data: Record<string, string>, referenceContext: string): string {
  let structure = "";

  if (data.pilihan_template === "default") {
    structure = buildDefaultStructure();
  } else if (data.pilihan_template === "custom") {
    structure = `Gunakan struktur custom pengguna berikut secara ketat selama tidak bertentangan dengan data input:

${data.template_custom || "(Struktur custom kosong.)"}

Tetap masukkan bagian Pembelajaran Mendalam dan Asesmen awal/proses/akhir bila struktur custom tidak menyediakannya. Jangan membuat sumber referensi sendiri.`;
  } else {
    structure = `Tentukan struktur modul yang paling efektif untuk kebutuhan pengguna.
Tetap gunakan kerangka Pembelajaran Mendalam sebagai acuan: praktik pedagogis, kemitraan pembelajaran, lingkungan pembelajaran, pemanfaatan digital; prinsip berkesadaran, bermakna, menggembirakan; serta pengalaman belajar memahami, mengaplikasi, merefleksi.
Asesmen harus mempertimbangkan awal, proses, dan akhir pembelajaran.`;
  }

  return `Anda adalah asisten penyusun modul ajar profesional untuk pendidik di Indonesia.

KONTEKS KEBIJAKAN PEMBELAJARAN:
Gunakan istilah dan kerangka Pembelajaran Mendalam sesuai panduan pemerintah: Pembelajaran Mendalam merupakan pendekatan yang menekankan suasana belajar dan proses pembelajaran berkesadaran, bermakna, dan menggembirakan. Kerangka pembelajaran mencakup praktik pedagogis, kemitraan pembelajaran, lingkungan pembelajaran, dan pemanfaatan digital. Pengalaman belajar mencakup memahami, mengaplikasi, dan merefleksi. Jangan menyamakan pendekatan Pembelajaran Mendalam dengan model atau metode pembelajaran tertentu.

TUGAS UTAMA:
Susun satu modul ajar lengkap dalam Bahasa Indonesia berdasarkan seluruh data pengguna.

DATA PENGGUNA:
- Nama Penyusun: ${data.nama_penyusun}
- Identitas Sekolah: ${data.identitas_sekolah}
- Tahun Penyusunan: ${data.tahun_penyusunan}
- Kurikulum: ${data.kurikulum}
- Fase / Kelas / Jenjang Sekolah: ${data.fase_kelas_jenjang}
- Mata Pelajaran: ${data.mata_pelajaran}
- Bab / Tema / Elemen: ${data.bab_tema}
- Capaian Pembelajaran: ${data.capaian_pembelajaran}
- Materi Pembelajaran: ${data.materi_pembelajaran}
- Alokasi Waktu: ${data.alokasi_waktu}
- Praktik Pedagogis: ${data.praktik_pedagogis || data.model_pembelajaran || "Tidak ditentukan."}
- Metode / Teknik Pendukung: ${data.metode_pembelajaran || "Tidak ditentukan."}
- Pendekatan Pembelajaran: ${data.pendekatan_pembelajaran || "Pembelajaran Mendalam"}
- Prinsip Pembelajaran Mendalam: ${data.prinsip_pembelajaran_mendalam || "Berkesadaran, Bermakna, Menggembirakan"}
- Pengalaman Belajar: ${data.pengalaman_belajar || "Memahami, Mengaplikasi, Merefleksi"}
- Kemitraan Pembelajaran: ${data.kemitraan_pembelajaran || "Tidak ditentukan."}
- Lingkungan Pembelajaran: ${data.lingkungan_pembelajaran || "Tidak ditentukan."}
- Pemanfaatan Digital: ${data.pemanfaatan_digital || "Tidak ditentukan."}
- Asesmen Awal: ${data.asesmen_awal || "Diagnostik"}
- Asesmen Proses: ${data.asesmen_proses || "Formatif"}
- Asesmen Akhir: ${data.asesmen_akhir || "Sumatif"}

${referenceContext}

STRUKTUR YANG HARUS DIIKUTI:
${structure}

ATURAN KUALITAS:
1. Gunakan Markdown murni. Jangan gunakan blok kode dan jangan menghasilkan HTML.
2. Gunakan heading Markdown yang konsisten.
3. Pastikan kegiatan pembelajaran realistis terhadap alokasi waktu yang diberikan.
4. Selaraskan tujuan, kegiatan, dan asesmen dengan CP, materi, fase, praktik pedagogis, pendekatan, dan prinsip Pembelajaran Mendalam.
5. Praktik pedagogis boleh memuat model/strategi/metode yang dipilih guru; jangan membuat ketiganya seolah-olah kategori kebijakan yang wajib terpisah.
6. Jangan memaksa semua komponen opsional menjadi isian manual jika pengguna tidak mengisinya. AI boleh mengembangkan bagian opsional secara kontekstual.
7. Jangan mengarang regulasi, nomor dokumen, URL, ISBN, penulis, atau sumber bibliografi.
8. Jika pengguna memberikan sumber referensi, gunakan sumber tersebut sebagai konteks dan nyatakan hanya informasi yang didukung sumber.
9. Jangan membuat daftar pustaka sendiri. Aplikasi akan menambahkan sumber yang benar-benar diberikan pengguna.
10. Untuk kegiatan pembelajaran, tampilkan hubungan yang jelas antara memahami, mengaplikasi, dan merefleksi bila relevan.
11. Asesmen harus dibedakan menjadi awal, proses, dan akhir sesuai input pengguna.
12. Hasil akhir harus substantif, realistis, dan siap diekspor sebagai dokumen pembelajaran.`;
}

async function waitForFileReady(ai: GoogleGenAI, name: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await ai.files.get({ name });
    if (current.state === "ACTIVE") return;
    if (current.state === "FAILED") {
      throw new Error("File referensi gagal diproses oleh Gemini.");
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error("File referensi terlalu lama diproses oleh Gemini.");
}

app.post("/api/payment/create", async (c) => {
  try {
    const body = await c.req.json<{ form_hash?: string }>().catch(() => ({ form_hash: "" }));
    const formHash = body.form_hash?.trim().toLowerCase() || "";
    if (!/^[a-f0-9]{64}$/.test(formHash)) {
      return c.json({ success: false, message: "Form hash pembayaran tidak valid." }, 400);
    }

    const orderId = `SIGMA-${formHash.slice(0, 16)}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Jangan kirim parameter redirect ke Pakasir.
    // Setelah pembayaran selesai, halaman Pakasir tetap berada di dalam iframe
    // sementara SIGMA memeriksa status transaksi dari parent secara berkala.
    const paymentUrl = new URL(`https://app.pakasir.com/pay/${PAKASIR_SLUG}/${PAKASIR_AMOUNT}`);
    paymentUrl.searchParams.set("order_id", orderId);

    return c.json({
      success: true,
      order_id: orderId,
      amount: PAKASIR_AMOUNT,
      payment_url: paymentUrl.toString(),
    });
  } catch (error) {
    console.error("SIGMA /api/payment/create error", error);
    return c.json({ success: false, message: "Gagal membuat transaksi pembayaran." }, 500);
  }
});

app.get("/api/payment/callback", async (c) => {
  const orderId = c.req.query("order_id")?.trim() || "";
  const formHash = c.req.query("form_hash")?.trim().toLowerCase() || "";
  const origin = new URL(c.req.url).origin;

  const baseHtml = (title: string, message: string, success: boolean) => `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SIGMA - ${success ? "Pembayaran Berhasil" : "Verifikasi Pembayaran"}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
    .card { width: min(92vw, 560px); box-sizing: border-box; padding: 28px; border-radius: 18px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(15,23,42,.08); text-align: center; }
    .title { margin: 0 0 8px; font-size: 22px; font-weight: 800; color: ${success ? "#047857" : "#1e3a8a"}; }
    .message { margin: 0; color: #475569; line-height: 1.6; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">${title}</h1>
    <p class="message">${message}</p>
  </div>
  <script>
    const payload = ${JSON.stringify({
      source: "sigma-pakasir",
      type: success ? "SIGMA_PAYMENT_SUCCESS" : "SIGMA_PAYMENT_ERROR",
      orderId,
      formHash,
      message,
    })};
    const targetOrigin = ${JSON.stringify(origin)};
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, targetOrigin);
    } else if (${JSON.stringify(success)}) {
      window.location.replace(${JSON.stringify(`/modul-ajar?payment=success&order_id=${encodeURIComponent(orderId)}&form_hash=${encodeURIComponent(formHash)}`)});
    }
  </script>
</body>
</html>`;

  if (!orderId || !/^[a-f0-9]{64}$/.test(formHash)) {
    return c.html(baseHtml("Verifikasi pembayaran gagal", "Data transaksi tidak lengkap.", false), 400);
  }

  if (!orderId.startsWith(`SIGMA-${formHash.slice(0, 16)}-`)) {
    return c.html(baseHtml("Verifikasi pembayaran gagal", "Transaksi tidak cocok dengan modul ini.", false), 403);
  }

  try {
    const paid = await verifyPakasirTransaction(c, orderId);
    if (!paid) {
      return c.html(baseHtml("Pembayaran belum terverifikasi", "Silakan kembali ke SIGMA dan tunggu sampai status pembayaran selesai.", false), 402);
    }

    return c.html(
      baseHtml(
        "Pembayaran berhasil",
        "SIGMA sedang menyiapkan modul ajar dan akan mengunduh file Word secara otomatis.",
        true,
      ),
      200,
    );
  } catch (error) {
    console.error("SIGMA /api/payment/callback error", error);
    return c.html(
      baseHtml(
        "Verifikasi pembayaran gagal",
        error instanceof Error ? error.message : "Terjadi kesalahan saat memverifikasi pembayaran.",
        false,
      ),
      500,
    );
  }
});

app.get("/api/payment/verify", async (c) => {
  try {
    const orderId = c.req.query("order_id")?.trim();
    if (!orderId) return c.json({ success: false, message: "order_id wajib diisi." }, 400);

    const paid = await verifyPakasirTransaction(c, orderId);
    return c.json({ success: true, paid, order_id: orderId, amount: PAKASIR_AMOUNT });
  } catch (error) {
    console.error("SIGMA /api/payment/verify error", error);
    return c.json({ success: false, message: error instanceof Error ? error.message : "Gagal memverifikasi pembayaran." }, 500);
  }
});

app.post("/api/payment/download-word", async (c) => {
  try {
    const form = await c.req.formData();
    const data: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") data[key] = value;
    }

    const orderId = data.order_id?.trim() || "";
    const formHash = data.form_hash?.trim().toLowerCase() || "";
    const markdown = data.markdown || "";

    if (!orderId || !formHash || !markdown) {
      return c.json({ success: false, message: "Data download belum lengkap." }, 400);
    }

    if (!/^[a-f0-9]{64}$/.test(formHash) || !orderId.startsWith(`SIGMA-${formHash.slice(0, 16)}-`)) {
      return c.json({ success: false, message: "Transaksi tidak cocok dengan modul ini." }, 403);
    }

    const paid = await verifyPakasirTransaction(c, orderId);
    if (!paid) {
      return c.json({ success: false, message: "Pembayaran belum terverifikasi." }, 402);
    }

    const html = buildWordDocument(
      markdown,
      data.nama_penyusun || "",
      data.fase_kelas_jenjang || "",
      data.warna_tema || "blue",
    );
    const fileName = `Modul-Ajar-${slugifyServer(data.mata_pelajaran || "SIGMA")}.doc`;
    const encodedFileName = encodeURIComponent(fileName).replace(/['()]/g, "");

    return new Response("\ufeff" + html, {
      status: 200,
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("SIGMA /api/payment/download-word error", error);
    return c.json(
      { success: false, message: error instanceof Error ? error.message : "Gagal membuat file Word." },
      500,
    );
  }
});

app.post("/api/generate", async (c) => {
  let uploadedGeminiFileName: string | undefined;

  try {
    if (!c.env.GEMINI_API_KEY) {
      return c.json(
        {
          success: false,
          message: "GEMINI_API_KEY belum tersedia di Cloudflare.",
        },
        500,
      );
    }

    const contentType = c.req.header("content-type") || "";
    let data: Record<string, string> = {};
    let referenceFile: File | undefined;

    if (contentType.includes("application/json")) {
      data = await c.req.json<Record<string, string>>();
    } else {
      const form = await c.req.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") {
          data[key] = value.trim();
        } else if (key === "reference_file" && value instanceof File) {
          referenceFile = value;
        }
      }
    }

    const requiredFields = [
      "nama_penyusun",
      "identitas_sekolah",
      "tahun_penyusunan",
      "kurikulum",
      "fase_kelas_jenjang",
      "mata_pelajaran",
      "bab_tema",
      "capaian_pembelajaran",
      "materi_pembelajaran",
      "alokasi_waktu",
      "praktik_pedagogis",
      "metode_pembelajaran",
      "pendekatan_pembelajaran",
      "asesmen_awal",
      "asesmen_proses",
      "asesmen_akhir",
    ];

    const missing = requiredFields.filter((field) => !data[field]);
    if (missing.length > 0) {
      return c.json(
        {
          success: false,
          message: `Data wajib belum lengkap: ${missing.join(", ")}`,
        },
        400,
      );
    }

    const referenceUrl = data.sumber_referensi_url || "";
    const referenceFileName = data.reference_file_name || referenceFile?.name || "";

    if (referenceUrl) {
      try {
        new URL(referenceUrl);
      } catch {
        return c.json(
          { success: false, message: "URL materi tidak valid." },
          400,
        );
      }
    }

    if (referenceFile) {
      if (referenceFile.size > MAX_REFERENCE_FILE_BYTES) {
        return c.json(
          {
            success: false,
            message: "Ukuran file referensi maksimal 15 MB.",
          },
          400,
        );
      }

      if (!isSupportedReferenceFile(referenceFile)) {
        return c.json(
          {
            success: false,
            message: "Format file belum didukung. Gunakan PDF, DOC/DOCX, atau TXT.",
          },
          400,
        );
      }
    }

    const paidDownload = data.paid_download === "true";
    if (paidDownload) {
      const orderId = data.order_id?.trim();
      const formHash = data.form_hash?.trim().toLowerCase();
      if (!orderId || !formHash) {
        return c.json({ success: false, message: "order_id dan form_hash pembayaran wajib diisi." }, 400);
      }
      if (!/^[a-f0-9]{64}$/.test(formHash) || !orderId.startsWith(`SIGMA-${formHash.slice(0, 16)}-`)) {
        return c.json({ success: false, message: "Transaksi tidak cocok dengan modul yang sedang diunduh." }, 403);
      }

      const paid = await verifyPakasirTransaction(c, orderId);
      if (!paid) {
        return c.json({ success: false, message: "Pembayaran belum terverifikasi atau transaksi belum selesai." }, 402);
      }
    }

    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });

    const contextParts: string[] = [];
    if (referenceUrl) {
      contextParts.push(
        `Sumber URL dari pengguna (gunakan URL context untuk membaca isinya jika tersedia): ${referenceUrl}`,
      );
    }

    if (data.reference_text) {
      contextParts.push(
        `Isi teks dari file DOCX/TXT yang diberikan pengguna:\n---\n${data.reference_text.slice(0, 120000)}\n---`,
      );
    }

    const referenceContext = contextParts.length
      ? `SUMBER TAMBAHAN PENGGUNA:\n${contextParts.join("\n\n")}`
      : "SUMBER TAMBAHAN PENGGUNA:\nTidak ada sumber tambahan.";

    const prompt = buildPrompt(data, referenceContext);

    const tools = referenceUrl ? [{ urlContext: {} }] : undefined;

    let contents: any = prompt;

    if (referenceFile) {
      const referenceMime = inferMimeType(referenceFile.name, referenceFile.type);

      if (referenceMime === "application/msword") {
        throw new Error(
          "File .doc lama belum dapat dibaca langsung. Silakan simpan sebagai .docx atau PDF terlebih dahulu.",
        );
      }

      if (referenceMime === "application/pdf") {
        const bytes = await referenceFile.arrayBuffer();
        const blob = new Blob([bytes], { type: referenceMime });

        const uploadedFile = await ai.files.upload({
          file: blob,
          config: {
            mimeType: referenceMime,
            displayName: referenceFile.name,
          },
        });

        uploadedGeminiFileName = uploadedFile.name;

        if (!uploadedFile.uri || !uploadedFile.mimeType || !uploadedFile.name) {
          throw new Error("Gemini tidak mengembalikan metadata file PDF yang lengkap.");
        }

        await waitForFileReady(ai, uploadedFile.name);

        contents = createUserContent([
          createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
          prompt,
        ]);
      } else if (!data.reference_text) {
        throw new Error("Isi file DOCX/TXT tidak tersedia untuk diproses.");
      }
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction:
          "Jangan mengarang sumber referensi. Gunakan hanya informasi yang berasal dari data pengguna dan sumber yang benar-benar diberikan pengguna.",
        ...(tools ? { tools } : {}),
      },
    });

    const generated = response.text || "";
    const cleaned = removeModelReferenceSection(generated);
    const dataWithReferences = `${cleaned}${buildReferenceSection(
      referenceUrl,
      referenceFileName,
    )}`;
    const output = paidDownload ? dataWithReferences : buildSensoredPreviewMarkdown(dataWithReferences);

    return c.json({
      success: true,
      data: output,
      paid: paidDownload,
      amount: PAKASIR_AMOUNT,
      sources: {
        url: referenceUrl || null,
        file: referenceFileName || null,
      },
    });
  } catch (error) {
    console.error("SIGMA /api/generate error", error);

    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      500,
    );
  } finally {
    if (uploadedGeminiFileName) {
      try {
        const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
        await ai.files.delete({ name: uploadedGeminiFileName });
      } catch (cleanupError) {
        console.warn("Gagal menghapus file sementara Gemini", cleanupError);
      }
    }
  }
});

export default app;
