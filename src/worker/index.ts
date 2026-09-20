import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
}

const MODEL = "gemini-3.8-flash";
const MAX_REFERENCE_FILE_BYTES = 15 * 1024 * 1024;

const app = new Hono<{ Bindings: Env }>();

app.use("/api", cors());
app.use("/api/*", cors());

app.get("/api", (c) => {
  return c.json({ success: true, message: "SIGMA API is running" });
});

app.get("/api/", (c) => {
  return c.json({ success: true, message: "SIGMA API is running" });
});

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

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

function buildDefaultStructure(): string {
  return `Gunakan urutan heading dan komponen berikut secara KETAT. Jangan menambah, menghapus, atau menukar urutan bagian utama:

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
   1. Praktik Pedagogi
      a. Model Pembelajaran
      b. Pendekatan Pembelajaran
      c. Metode Pembelajaran
   2. Kemitraan Pembelajaran
      a. Lingkungan Sekolah
      b. Lingkungan Luar Sekolah
      c. Masyarakat
   3. Lingkungan Belajar
      a. Ruang Fisik
      b. Ruang Virtual
      c. Budaya Belajar
   4. Pemanfaatan Digital
      a. Perangkat Digital
      b. Aplikasi Pembelajaran
F. Kegiatan Pembelajaran
   Gunakan tabel Markdown dengan kolom: No, Kegiatan, Langkah-Langkah, Alokasi Waktu.
   Wajib ada Pendahuluan, Kegiatan Inti, dan Penutup.
G. Asesmen

LAMPIRAN
A. Ringkasan Materi

JANGAN membuat bagian Sumber Referensi sendiri. Bagian tersebut akan ditambahkan otomatis oleh aplikasi berdasarkan sumber yang benar-benar diberikan pengguna.`;
}

function buildPrompt(data: Record<string, string>, referenceContext: string): string {
  let structure = "";

  if (data.pilihan_template === "default") {
    structure = buildDefaultStructure();
  } else if (data.pilihan_template === "custom") {
    structure = `Gunakan struktur custom pengguna berikut secara ketat selama tidak bertentangan dengan data input:

${data.template_custom || "(Struktur custom kosong.)"}

Jangan membuat bagian Sumber Referensi sendiri. Bagian tersebut ditambahkan otomatis oleh aplikasi.`;
  } else {
    structure = `Tentukan struktur modul yang paling efektif untuk kebutuhan pengguna.
Tetap pertahankan komponen inti yang relevan: identitas, kesiapan peserta didik, karakteristik mata pelajaran, tujuan, kegiatan pembelajaran, asesmen, dan lampiran.
Jangan membuat bagian Sumber Referensi sendiri. Bagian tersebut ditambahkan otomatis oleh aplikasi.`;
  }

  return `Anda adalah asisten penyusun modul ajar profesional untuk pendidik di Indonesia.

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
- Model Pembelajaran: ${data.model_pembelajaran}
- Pendekatan Pembelajaran: ${data.pendekatan_pembelajaran}
- Jenis Asesmen: ${data.jenis_asesmen}

${referenceContext}

STRUKTUR YANG HARUS DIIKUTI:
${structure}

ATURAN KUALITAS:
1. Gunakan Markdown murni. Jangan gunakan blok kode dan jangan menghasilkan HTML.
2. Gunakan heading Markdown yang konsisten: # untuk judul besar, ## untuk bagian utama, ###/#### untuk subbagian.
3. Pastikan kegiatan pembelajaran realistis terhadap alokasi waktu yang diberikan.
4. Selaraskan tujuan, kegiatan, dan asesmen dengan CP, materi, fase, model, dan pendekatan pembelajaran.
5. Jangan mengarang regulasi, nomor dokumen, URL, ISBN, penulis, atau sumber bibliografi.
6. Jika data pengguna tidak menyediakan detail tertentu, tulis secara masuk akal tanpa membuat klaim faktual spesifik yang tidak didukung.
7. Jangan membuat daftar pustaka atau sumber referensi sendiri. Aplikasi akan menambahkan sumber yang diberikan pengguna.
8. Pastikan seluruh bagian yang diminta oleh struktur memiliki isi yang substantif, bukan sekadar satu kalimat generik.
9. Untuk Kegiatan Pembelajaran, gunakan tabel Markdown jika struktur default meminta tabel.
10. Hasil akhir harus siap dibaca dan diekspor sebagai dokumen pembelajaran.
`;
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
      "model_pembelajaran",
      "pendekatan_pembelajaran",
      "jenis_asesmen",
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

    return c.json({
      success: true,
      data: dataWithReferences,
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
