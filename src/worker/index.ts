import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

app.get("/api/", (c) => {
  return c.json({ success: true, message: "SIGMA API is running" });
});

app.post("/api/generate", async (c) => {
  try {
    if (!c.env.GEMINI_API_KEY) {
      return c.json({ success: false, message: "GEMINI_API_KEY belum dikonfigurasi di Cloudflare." }, 500);
    }

    const body = await c.req.json<Record<string, string>>();
    const referensi = body.sumber_referensi_url
      ? `Gunakan referensi dari URL berikut sebagai salah satu bahan: ${body.sumber_referensi_url}`
      : "Tidak ada URL referensi tambahan.";

    let strukturTemplate = "";
    if (body.pilihan_template === "default") {
      strukturTemplate = `Gunakan secara KETAT format kerangka berikut untuk menyusun modul:\n\nINFORMASI UMUM\nA. Identitas Modul\n1. Nama Penyusun: ${body.nama_penyusun}\n2. Identitas Sekolah: ${body.identitas_sekolah}\n3. Tahun Penyusunan: ${body.tahun_penyusunan}\n4. Fase / Kelas / Jenjang Sekolah: ${body.fase_kelas_jenjang}\n5. Mata Pelajaran: ${body.mata_pelajaran}\n6. Bab / Tema / Elemen: ${body.bab_tema}\n7. Materi Pembelajaran: ${body.materi_pembelajaran}\n8. Alokasi Waktu: ${body.alokasi_waktu}\nB. Identifikasi Kesiapan Peserta Didik\n1. Pengetahuan Awal\n2. Minat\n3. Latar Belakang\n4. Kebutuhan Belajar\nC. Karakteristik Mata Pelajaran\n1. Jenis Pengetahuan yang akan Dicapai\na. Konseptual\nb. Prosedural\nc. Pemecahan Masalah\n2. Relevansi dengan Kehidupan Nyata Peserta Didik\n3. Tingkat Kesulitan\n4. Struktur Materi\n5. Integrasi Nilai dan Karakter\nD. Dimensi Profil Lulusan\n\nDESAIN PEMBELAJARAN\nA. Capaian Pembelajaran\n1. Capaian Umum\n2. Capaian per Elemen\nB. Lintas Disiplin Ilmu\nC. Tujuan Pembelajaran\nD. Topik Pembelajaran Kontekstual\nE. Kerangka Pembelajaran\n1. Praktik Pedagogi\na. Model Pembelajaran\nb. Pendekatan Pembelajaran\nc. Metode Pembelajaran\n2. Kemitraan Pembelajaran\na. Lingkungan Sekolah\nb. Lingkungan Luar Sekolah\nc. Masyarakat\n3. Lingkungan Belajar\na. Ruang Fisik\nb. Ruang Virtual\nc. Budaya Belajar\n4. Pemanfaatan Digital\na. Perangkat Digital\nb. Aplikasi Pembelajaran\nF. Kegiatan Pembelajaran\nG. Asesmen\n\nLAMPIRAN\nA. Ringkasan Materi\nB. Sumber Referensi (Optional)";
    } else if (body.pilihan_template === "custom") {
      strukturTemplate = `Gunakan secara ketat FORMAT STRUKTUR CUSTOM berikut ini seperti yang diminta pengguna:\n${body.template_custom || "Buat struktur yang rapi."}`;
    } else {
      strukturTemplate = "Buat struktur dan kerangka modul secara bebas oleh AI dengan format terbaik, komprehensif, dan memenuhi standar pendidikan modern.";
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
6. Pastikan tabel kegiatan pembelajaran menggunakan Markdown table jika diperlukan.
7. Hasil harus siap dirender sebagai dokumen pembelajaran.`;

    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return c.json({ success: true, data: response.text || "" });
  } catch (error) {
    console.error(error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan sistem.",
    }, 500);
  }
});

export default app;
