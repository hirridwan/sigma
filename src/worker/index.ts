import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/api", cors());
app.use("/api/*", cors());

/* =========================
   API HEALTH CHECK
========================= */

app.get("/api", (c) => {
  return c.json({
    success: true,
    message: "SIGMA API is running",
  });
});

app.get("/api/", (c) => {
  return c.json({
    success: true,
    message: "SIGMA API is running",
  });
});

/* =========================
   GENERATE MODULE
========================= */

app.post("/api/generate", async (c) => {
  try {
    if (!c.env.GEMINI_API_KEY) {
      return c.json(
        {
          success: false,
          message: "GEMINI_API_KEY belum tersedia.",
        },
        500
      );
    }

    const body = await c.req.json<Record<string, string>>();

    const referensi = body.sumber_referensi_url
      ? `Gunakan referensi dari URL berikut: ${body.sumber_referensi_url}`
      : "Tidak ada referensi URL tambahan.";

    let strukturTemplate = "";

    if (body.pilihan_template === "default") {
      strukturTemplate = `
Gunakan struktur modul berikut secara teratur:

INFORMASI UMUM

A. Identitas Modul
1. Nama Penyusun
2. Identitas Sekolah
3. Tahun Penyusunan
4. Kurikulum
5. Fase / Kelas / Jenjang Sekolah
6. Mata Pelajaran
7. Bab / Tema / Elemen
8. Capaian Pembelajaran
9. Materi Pembelajaran
10. Alokasi Waktu

B. Identifikasi Kesiapan Peserta Didik

C. Karakteristik Mata Pelajaran

DESAIN PEMBELAJARAN

A. Capaian Pembelajaran

B. Tujuan Pembelajaran

C. Model dan Pendekatan Pembelajaran

D. Kegiatan Pembelajaran

E. Asesmen

LAMPIRAN

A. Ringkasan Materi
B. Sumber Referensi
`;
    } else if (body.pilihan_template === "custom") {
      strukturTemplate = `
Gunakan struktur custom berikut secara ketat:

${body.template_custom || ""}
`;
    } else {
      strukturTemplate = `
Buat struktur modul ajar secara bebas namun tetap sistematis,
komprehensif, dan sesuai konteks pendidikan.
`;
    }

    const prompt = `
Buatkan modul ajar dalam Bahasa Indonesia berdasarkan data berikut.

DATA:
- Nama Penyusun: ${body.nama_penyusun}
- Identitas Sekolah: ${body.identitas_sekolah}
- Tahun Penyusunan: ${body.tahun_penyusunan}
- Kurikulum: ${body.kurikulum}
- Fase / Kelas / Jenjang: ${body.fase_kelas_jenjang}
- Mata Pelajaran: ${body.mata_pelajaran}
- Bab / Tema / Elemen: ${body.bab_tema}
- Capaian Pembelajaran: ${body.capaian_pembelajaran}
- Materi Pembelajaran: ${body.materi_pembelajaran}
- Alokasi Waktu: ${body.alokasi_waktu}
- Model Pembelajaran: ${body.model_pembelajaran}
- Pendekatan Pembelajaran: ${body.pendekatan_pembelajaran}
- Jenis Asesmen: ${body.jenis_asesmen}

${referensi}

STRUKTUR:
${strukturTemplate}

ATURAN:
- Gunakan Bahasa Indonesia.
- Gunakan Markdown.
- Jangan gunakan blok kode.
- Jangan menghasilkan HTML.
- Buat isi yang lengkap dan relevan.
`;

    const ai = new GoogleGenAI({
      apiKey: c.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return c.json({
      success: true,
      data: response.text || "",
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      500
    );
  }
});

export default app;