import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

app.get("/api/", (c) => {
  return c.json({
    success: true,
    message: "SIGMA API is running",
  });
});

app.post("/api/generate", async (c) => {
  try {
    if (!c.env.GEMINI_API_KEY) {
      return c.json(
        {
          success: false,
          message: "GEMINI_API_KEY belum dikonfigurasi di Cloudflare.",
        },
        500,
      );
    }

    const body = await c.req.json<Record<string, string>>();

    const referensi = body.sumber_referensi_url
      ? `Gunakan referensi dari URL berikut sebagai salah satu bahan: ${body.sumber_referensi_url}`
      : "Tidak ada URL referensi tambahan.";

    let strukturTemplate = "";

    if (body.pilihan_template === "default") {
      strukturTemplate = `Gunakan secara KETAT format kerangka berikut untuk menyusun modul:

INFORMASI UMUM

A. Identitas Modul
1. Nama Penyusun: ${body.nama_penyusun}
2. Identitas Sekolah: ${body.identitas_sekolah}
3. Tahun Penyusunan: ${body.tahun_penyusunan}
4. Kurikulum: ${body.kurikulum}
5. Fase / Kelas / Jenjang Sekolah: ${body.fase_kelas_jenjang}
6. Mata Pelajaran: ${body.mata_pelajaran}
7. Bab / Tema / Elemen: ${body.bab_tema}
8. Capaian Pembelajaran: ${body.capaian_pembelajaran}
9. Materi Pembelajaran: ${body.materi_pembelajaran}
10. Alokasi Waktu: ${body.alokasi_waktu}

B. Identifikasi Kesiapan Peserta Didik
1. Pengetahuan Awal
2. Minat
3. Latar Belakang
4. Kebutuhan Belajar

C. Karakteristik Mata Pelajaran
1. Jenis Pengetahuan yang akan Dicapai
   a. Konseptual
   b. Prosedural
   c. Pemecahan Masalah
2. Relevansi dengan Kehidupan Nyata Peserta Didik
3. Tingkat Kesulitan
4. Struktur Materi
5. Integrasi Nilai dan Karakter

D. Dimensi Profil Lulusan

DESAIN PEMBELAJARAN

A. Capaian Pembelajaran
1. Capaian Umum
2. Capaian per Elemen

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

G. Asesmen

LAMPIRAN

A. Ringkasan Materi
B. Sumber Referensi (Optional)`;
    } else if (body.pilihan_template === "custom") {
      strukturTemplate = `Gunakan secara ketat FORMAT STRUKTUR CUSTOM berikut ini seperti yang diminta pengguna:

${body.template_custom || "Buat struktur yang rapi dan sesuai kebutuhan pengguna."}`;
    } else {
      strukturTemplate =
        "Buat struktur dan kerangka modul secara bebas oleh AI dengan format terbaik, komprehensif, dan memenuhi standar pendidikan modern.";
    }

    const prompt = `Buatkan modul ajar dalam Bahasa Indonesia berdasarkan data berikut.

DATA UTAMA:
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
- Warna Tema: ${body.warna_tema}

${referensi}

PANDUAN STRUKTUR MODUL:
${strukturTemplate}

ATURAN OUTPUT:
1. Gunakan Markdown murni.
2. Jangan bungkus jawaban dalam blok kode.
3. Jangan membuat HTML.
4. Isi setiap bagian dengan konten yang relevan dengan mata pelajaran, materi, fase, model, pendekatan, dan asesmen yang diberikan.
5. Jangan mengarang sumber atau URL spesifik jika tidak diberikan pengguna.
6. Gunakan tabel Markdown jika tabel diperlukan.
7. Hasil harus siap dirender sebagai dokumen pembelajaran.`;

    const ai = new GoogleGenAI({
      apiKey: c.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return c.json({
      success: true,
      data: response.text ?? "",
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan sistem.",
      },
      500,
    );
  }
});

export default app;
