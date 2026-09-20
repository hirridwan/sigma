import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import html2pdf from "html2pdf.js";

const DEFAULT_TEMPLATE = `INFORMASI UMUM

A. Identitas Modul
1. Nama Penyusun:
2. Identitas Sekolah:
3. Tahun Penyusunan:
4. Fase / Kelas / Jenjang Sekolah:
5. Mata Pelajaran:
6. Bab / Tema / Elemen:
7. Materi Pembelajaran:
8. Alokasi Waktu: … x … menit
B. Identifikasi Kesiapan Peserta Didik
1. Pengetahuan Awal
2. Minat
3. Latar Belakang
4. Kebutuhan Belajar
C. Karakteristik Mata Pelajaran
1. Jenis Pengetahuan yang akan Dicapai
a. Konseptual:
b. Prosedural:
c. Pemecahan Masalah:
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
a. Lingkungan Sekolah:
b. Lingkungan Luar Sekolah:
c. Masyarakat:
3. Lingkungan Belajar
a. Ruang Fisik:
b. Ruang Virtual:
c. Budaya Belajar:
4. Pemanfaatan Digital
a. Perangkat Digital:
b. Aplikasi Pembelajaran:
F. Kegiatan Pembelajaran
Tabel terdiri dari No, Kegiatan, Langkah-Langkah, Alokasi Waktu. Dan ada Pendahuluan, Inti, dan Penutup
G. Asesmen

LAMPIRAN

A. Ringkasan Materi
B. Sumber Referensi (Optional)`;

const THEME_COLORS = {
  blue: "#1e3a8a",
  emerald: "#047857",
  purple: "#6d28d9",
  slate: "#334155",
};

type GeneratorForm = {
  pilihan_template: string;
  warna_tema: keyof typeof THEME_COLORS;
  template_custom: string;
  nama_penyusun: string;
  identitas_sekolah: string;
  tahun_penyusunan: string;
  kurikulum: string;
  fase_kelas_jenjang: string;
  mata_pelajaran: string;
  bab_tema: string;
  capaian_pembelajaran: string;
  materi_pembelajaran: string;
  alokasi_waktu: string;
  model_pembelajaran: string;
  pendekatan_pembelajaran: string;
  jenis_asesmen: string;
  sumber_referensi_url: string;
};

const initialForm: GeneratorForm = {
  pilihan_template: "default",
  warna_tema: "blue",
  template_custom: "",
  nama_penyusun: "",
  identitas_sekolah: "",
  tahun_penyusunan: "2026",
  kurikulum: "",
  fase_kelas_jenjang: "",
  mata_pelajaran: "",
  bab_tema: "",
  capaian_pembelajaran: "",
  materi_pembelajaran: "",
  alokasi_waktu: "",
  model_pembelajaran: "",
  pendekatan_pembelajaran: "",
  jenis_asesmen: "",
  sumber_referensi_url: "",
};

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (path === "/modul-ajar" || path === "/modul-ajar.html") {
    return <GeneratorPage />;
  }

  if (path === "/preview-dummy" || path === "/preview-dummy.html") {
    return <DummyPreviewPage />;
  }

  return <HomePage />;
}

function Header({ back = false }: { back?: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-blue-900 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xl font-bold transition hover:opacity-90"
        >
          <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          SIGMA
        </button>
        {back && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1 rounded-lg border border-blue-700 bg-blue-800 px-3 py-1.5 text-sm font-medium opacity-90 transition hover:opacity-100"
          >
            ← Kembali ke Beranda
          </button>
        )}
      </div>
    </header>
  );
}

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-bold text-blue-900">
            <span className="text-blue-600">▣</span>
            SIGMA
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-12 lg:py-0">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6 text-left">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
              Didukung oleh Artificial Intelligence
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Buat Modul Ajar Terstruktur Hanya dalam <span className="mt-2 block text-blue-600">Hitungan Detik</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              Permudah penyusunan perangkat pembelajaran Kurikulum Merdeka secara otomatis, rapi, dan siap diunduh dalam format Word atau PDF.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate("/modul-ajar")}
                className="inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
              >
                Mulai Buat Modul Sekarang <span>→</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-4 lg:pl-12">
            <Feature icon="⚡" title="Instan & Cepat" description="Cukup isi parameter materi, draf langsung selesai." />
            <Feature icon="📝" title="Format Standar" description="Sesuai komponen inti panduan pembelajaran." />
            <Feature icon="💾" title="Ekspor Mudah" description="Unduh hasil modul dalam format Microsoft Word atau PDF." />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm font-medium text-slate-500">
        © 2026 SIGMA. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      <div>
        <div className="mb-1 text-lg font-bold text-blue-900">{title}</div>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function GeneratorPage() {
  const [form, setForm] = useState<GeneratorForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState("");
  const [fileName, setFileName] = useState("");

  const colorHex = THEME_COLORS[form.warna_tema];

  const renderedResult = useMemo(() => {
    if (!resultMarkdown) return "";
    const markdownHtml = marked.parse(resultMarkdown);
    return DOMPurify.sanitize(markdownHtml);
  }, [resultMarkdown]);

  const update = (key: keyof GeneratorForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function generateModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sumber_referensi_file: fileName }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal membuat modul.");
      }

      setResultMarkdown(result.data || "");
      setTimeout(() => document.getElementById("hasil")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Koneksi API gagal.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf() {
    const element = document.getElementById("hasil-content");
    if (!element) return;
    html2pdf()
      .set({
        margin: [40, 30, 30, 40],
        filename: "Modul-Ajar-SIGMA.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  }

  function downloadWord() {
    const element = document.getElementById("hasil-content");
    if (!element) return;
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Modul Ajar SIGMA</title>
      <style>
        @page WordSection1 { size: 595.3pt 841.9pt; margin: 113.4pt 85.05pt 85.05pt 113.4pt; }
        div.WordSection1 { page: WordSection1; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
        h1 { text-align: center; text-transform: uppercase; font-size: 16pt; color: ${colorHex}; border-bottom: 1px solid ${colorHex}; padding-bottom: 10px; margin-bottom: 20px; }
        h2 { font-size: 14pt; margin-top: 20px; color: ${colorHex}; text-transform: uppercase; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 15px; }
        p { text-align: justify; margin: 0; padding: 0; text-indent: 0; line-height: 1.5; }
        ul, ol { margin: 0 0 0 20px; padding: 0; line-height: 1.5; }
        li { text-align: justify; margin: 0; padding: 0; line-height: 1.5; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 10px; }
        th, td { border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 11pt; }
        th { background-color: #f1f5f9; font-weight: bold; text-align: left; }
        .cover-page { text-align: center; padding-top: 140px; }
      </style></head>
      <body><div class='WordSection1'>${element.innerHTML}</div></body></html>`;

    const blob = new Blob(["\ufeff", preHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Modul-Ajar-SIGMA.doc";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function sendWhatsApp(name: string, message: string) {
    const waNumber = "6285860565852";
    const text = `Halo, saya *${name.trim()}*.\n\nBerikut kritik dan saran untuk aplikasi SIGMA:\n${message.trim()}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setShowFeedback(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header back />

      <main className="mx-auto mt-4 max-w-5xl space-y-6 p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-600">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={generateModule} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <SectionTitle number="1" title="Format Template Modul" />
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Template</label>
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <select
                  value={form.pilihan_template}
                  onChange={(e) => update("pilihan_template", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="default">Default</option>
                  <option value="ai">Buat oleh AI</option>
                  <option value="custom">Custom</option>
                </select>
                {form.pilihan_template === "default" && (
                  <button type="button" onClick={() => setShowTemplateModal(true)} className="w-full shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 sm:w-auto">Lihat Pratinjau</button>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Warna Tema Modul Ajar</label>
              <select value={form.warna_tema} onChange={(e) => update("warna_tema", e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500" required>
                <option value="blue">Biru Standar (Professional)</option>
                <option value="emerald">Hijau (Emerald)</option>
                <option value="purple">Ungu (Creative)</option>
                <option value="slate">Abu-abu (Minimalis)</option>
              </select>
            </div>
            {form.pilihan_template === "custom" && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tulis Format Template Custom Anda</label>
                <textarea value={form.template_custom} onChange={(e) => update("template_custom", e.target.value)} rows={6} placeholder={'Contoh:\n1. Pendahuluan\n2. Kompetensi Dasar\n3. Kegiatan Inti...'} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500" required />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <SectionTitle number="2" title="Informasi Umum" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextInput label="Nama Penyusun" value={form.nama_penyusun} onChange={(v) => update("nama_penyusun", v)} required />
              <TextInput label="Identitas Sekolah" value={form.identitas_sekolah} onChange={(v) => update("identitas_sekolah", v)} required />
              <TextInput label="Tahun Penyusunan" value={form.tahun_penyusunan} onChange={(v) => update("tahun_penyusunan", v)} required />
              <SelectInput label="Kurikulum" value={form.kurikulum} onChange={(v) => update("kurikulum", v)} options={["Kurikulum Merdeka"]} placeholder="Pilih Kurikulum" required />
              <SelectInput label="Fase / Kelas / Jenjang Sekolah" value={form.fase_kelas_jenjang} onChange={(v) => update("fase_kelas_jenjang", v)} options={[
                "Fase Fondasi: PAUD / RA",
                "Fase A: Kelas 1–2 SD / MI",
                "Fase B: Kelas 3–4 SD / MI",
                "Fase C: Kelas 5–6 SD / MI",
                "Fase D: Kelas 7–9 SMP / MTs",
                "Fase E: Kelas 10 SMA / SMK / MA",
                "Fase F: Kelas 11–12 SMA / MA dan SMK program 3 tahun",
                "Fase Khusus (Fase Kelas 11–13): SMK program 4 tahun",
              ]} placeholder="Pilih Fase / Kelas / Jenjang" required />
              <TextInput label="Mata Pelajaran" value={form.mata_pelajaran} onChange={(v) => update("mata_pelajaran", v)} required />
              <TextInput label="Bab / Tema / Elemen" value={form.bab_tema} onChange={(v) => update("bab_tema", v)} fullWidth required />
              <TextArea label="Capaian Pembelajaran" value={form.capaian_pembelajaran} onChange={(v) => update("capaian_pembelajaran", v)} fullWidth required />
              <TextArea label="Materi Pembelajaran" value={form.materi_pembelajaran} onChange={(v) => update("materi_pembelajaran", v)} fullWidth required />
              <TextInput label="Alokasi Waktu" value={form.alokasi_waktu} onChange={(v) => update("alokasi_waktu", v)} placeholder="Contoh: 2 x 45 menit" fullWidth required />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <SectionTitle number="3" title="Desain Pembelajaran" />
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <SelectInput label="Model Pembelajaran" value={form.model_pembelajaran} onChange={(v) => update("model_pembelajaran", v)} options={["Project-Based Learning", "Problem-Based Learning", "Discovery / Inquiry Learning"]} placeholder="Pilih Model Pembelajaran" required />
              <SelectInput label="Pendekatan Pembelajaran" value={form.pendekatan_pembelajaran} onChange={(v) => update("pendekatan_pembelajaran", v)} options={["Pembelajaran Mendalam (Deep Learning)", "Pembelajaran Diferensiasi (Differentiated Instruction)", "Teaching at the Right Level (TaRL)"]} placeholder="Pilih Pendekatan Pembelajaran" required />
              <SelectInput label="Jenis Asesmen" value={form.jenis_asesmen} onChange={(v) => update("jenis_asesmen", v)} options={["Asesmen of/as/for Learning", "Diagnostik, Formatif, Sumatif"]} placeholder="Pilih Jenis Asesmen" fullWidth required />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">🔗 Sumber Referensi (Opsional)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput label="URL Materi" value={form.sumber_referensi_url} onChange={(v) => update("sumber_referensi_url", v)} placeholder="https://..." type="url" />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Upload File (PDF/DOC)</label>
                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700" />
                  <p className="mt-1 text-xs text-slate-400">Versi migrasi ini mempertahankan inputnya; pemrosesan isi file belum diterapkan di backend lama.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="sticky bottom-4 z-30 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-75">
              {loading ? "Sedang menyusun modul..." : "Buat Modul Ajar"}
              {!loading && <span>⚡</span>}
            </button>
          </div>
        </form>

        <div id="hasil" className="scroll-mt-24" />
        {resultMarkdown && (
          <section id="hasil-container" className="mb-12 flex min-h-[500px] flex-col rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="flex flex-col items-center justify-between gap-4 rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-6 sm:flex-row">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-blue-900">📄 Pratinjau Modul</h2>
              <div className="flex w-full gap-3 sm:w-auto">
                <button type="button" onClick={downloadWord} className="flex-1 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 sm:flex-none">Unduh Word</button>
                <button type="button" onClick={downloadPdf} className="flex-1 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 sm:flex-none">Unduh PDF</button>
              </div>
            </div>
            <div id="hasil-content" className="document-preview max-w-none overflow-y-auto rounded-b-2xl bg-white p-8 md:p-12" style={{ color: "#0f172a" }}>
              <div className="cover-page mb-16 text-center" style={{ pageBreakAfter: "always" }}>
                <h1 style={{ marginTop: 0, border: "none", color: colorHex, fontSize: "32pt" }}>MODUL AJAR</h1>
                <div className="mx-auto mt-44 inline-block min-w-[320px] border-t-2 pt-10 text-left text-[14pt] leading-relaxed" style={{ borderColor: colorHex }}>
                  <p><b>Nama Penyusun:</b> {form.nama_penyusun}</p>
                  <p><b>Fase / Kelas / Jenjang Sekolah:</b> {form.fase_kelas_jenjang}</p>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: renderedResult }} style={{ color: colorHex }} />
            </div>
          </section>
        )}
      </main>

      <FeedbackButton onClick={() => setShowFeedback(true)} />
      {showTemplateModal && <TemplateModal onClose={() => setShowTemplateModal(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} onSend={sendWhatsApp} />}
    </div>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-blue-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm text-blue-600">{number}</span>
      {title}
    </h2>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text", fullWidth = false, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; fullWidth?: boolean; required?: boolean }) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function TextArea({ label, value, onChange, fullWidth = false, required = false }: { label: string; value: string; onChange: (value: string) => void; fullWidth?: boolean; required?: boolean }) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} required={required} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, placeholder, fullWidth = false, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string; fullWidth?: boolean; required?: boolean }) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function TemplateModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Pratinjau Struktur Template Default" onClose={onClose}>
      <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-700">{DEFAULT_TEMPLATE}</pre>
      <div className="mt-6 border-t border-slate-200 bg-slate-50 pt-5 text-right">
        <button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-sm hover:bg-blue-700">Tutup Pratinjau</button>
      </div>
    </ModalShell>
  );
}

function FeedbackModal({ onClose, onSend }: { onClose: () => void; onSend: (name: string, message: string) => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <ModalShell title="Kirim via WhatsApp" onClose={onClose} tone="green">
      <p className="mb-5 text-sm leading-relaxed text-slate-600">Masukan Anda sangat berarti bagi pengembangan aplikasi SIGMA. Pesan akan dikirim langsung ke WhatsApp Developer.</p>
      <div className="space-y-4">
        <TextInput label="Nama Anda" value={name} onChange={setName} placeholder="Masukkan nama..." />
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kritik & Saran</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-shadow focus:border-green-500 focus:ring-2 focus:ring-green-500" placeholder="Ketik pesan Anda di sini..." />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 bg-slate-50 pt-5">
        <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200">Batal</button>
        <button type="button" disabled={!name.trim() || !message.trim()} onClick={() => onSend(name, message)} className="rounded-xl bg-green-600 px-6 py-2.5 font-bold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">Kirim Pesan</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children, tone = "blue" }: { title: string; onClose: () => void; children: React.ReactNode; tone?: "blue" | "green" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className={`flex items-center justify-between rounded-t-2xl border-b border-slate-200 p-5 ${tone === "green" ? "bg-green-50" : "bg-slate-50"}`}>
          <h3 className={`font-extrabold text-lg ${tone === "green" ? "text-green-800" : "text-slate-800"}`}>{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:text-red-500">✕</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function FeedbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:-translate-y-1 hover:scale-105 hover:bg-green-600">
      <span className="text-xl">✆</span>
      <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">Kritik & Saran</span>
    </button>
  );
}

function DummyPreviewPage() {
  const [theme, setTheme] = useState<keyof typeof THEME_COLORS>("blue");
  const color = THEME_COLORS[theme];

  const dummyHtml = `
    <h1>INFORMATIKA DASAR</h1>
    <h2>INFORMASI UMUM</h2>
    <h3>A. Identitas Modul</h3>
    <ul>
      <li><strong>Nama Penyusun:</strong> Ridwan Maulana Utama</li>
      <li><strong>Identitas Sekolah:</strong> SMAN 1 Bandung</li>
      <li><strong>Tahun Penyusunan:</strong> 2026</li>
      <li><strong>Fase / Kelas:</strong> Fase E / Kelas 10</li>
      <li><strong>Mata Pelajaran:</strong> Informatika</li>
      <li><strong>Bab / Tema:</strong> Algoritma dan Pemrograman</li>
      <li><strong>Alokasi Waktu:</strong> 2 x 45 Menit</li>
    </ul>
    <h3>B. Kompetensi Awal</h3>
    <p>Peserta didik telah memahami konsep dasar penggunaan komputer dan memiliki kemampuan dasar dalam mengoperasikan peramban web serta aplikasi pengolah teks.</p>
    <h2>DESAIN PEMBELAJARAN</h2>
    <h3>A. Capaian Pembelajaran</h3>
    <p>Peserta didik mampu memahami logika pemrograman dasar dan mempraktikkannya dalam bentuk pembuatan website sederhana yang responsif menggunakan HTML, CSS, dan JavaScript.</p>
    <h3>B. Model dan Metode Pembelajaran</h3>
    <ul>
      <li><strong>Model:</strong> Project-Based Learning</li>
      <li><strong>Pendekatan:</strong> Pembelajaran Mendalam (Deep Learning)</li>
      <li><strong>Metode:</strong> Diskusi kelompok, praktik langsung (hands-on coding), dan presentasi.</li>
    </ul>
    <h3>C. Kegiatan Pembelajaran</h3>
    <table><thead><tr><th>Tahap</th><th>Deskripsi Kegiatan</th><th>Waktu</th></tr></thead><tbody><tr><td>Pendahuluan</td><td>Guru membuka kelas dengan salam, memeriksa kehadiran, dan memberikan apersepsi mengenai pentingnya logika pemrograman di era digital.</td><td>15 Menit</td></tr><tr><td>Kegiatan Inti</td><td>Peserta didik dibagi dalam kelompok, menerima studi kasus pembuatan kerangka HTML, dan praktik penulisan kode dipandu guru.</td><td>60 Menit</td></tr><tr><td>Penutup</td><td>Refleksi pembelajaran, kesimpulan, dan tugas proyek mandiri.</td><td>15 Menit</td></tr></tbody></table>
    <h2>LAMPIRAN</h2>
    <h3>A. Asesmen</h3>
    <p>Asesmen formatif dilakukan melalui observasi saat praktik coding. Asesmen sumatif dilakukan melalui penilaian hasil akhir proyek website responsif.</p>
    <h3>B. Referensi Belajar</h3>
    <p>Dokumentasi resmi HTML5 di MDN Web Docs dan video tutorial dari YouTube.</p>`;

  async function downloadPdf() {
    const element = document.getElementById("dummy-content");
    if (!element) return;
    await html2pdf().set({ margin: [40, 30, 30, 40], filename: "Preview-Dummy-SIGMA.pdf", image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(element).save();
  }

  function downloadWord() {
    const element = document.getElementById("dummy-content");
    if (!element) return;
    const html = `<html><head><meta charset='utf-8'><style>body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}h1,h2{color:${color}}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:8px}</style></head><body>${element.innerHTML}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "Preview-Dummy-SIGMA.doc"; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate("/modul-ajar")} className="mb-6 text-blue-600 hover:text-blue-800">← Kembali ke Form Generator</button>
        <div className="mb-12 rounded-2xl border border-blue-100 bg-white shadow-lg">
          <div className="flex flex-col items-center justify-between gap-4 rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-6 sm:flex-row">
            <h2 className="w-full text-xl font-extrabold text-blue-900 sm:w-auto">📄 Pratinjau Dummy</h2>
            <div className="flex w-full gap-3 sm:w-auto">
              <select value={theme} onChange={(e) => setTheme(e.target.value as keyof typeof THEME_COLORS)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium sm:w-auto"><option value="blue">Warna: Biru</option><option value="emerald">Warna: Hijau</option><option value="purple">Warna: Ungu</option><option value="slate">Warna: Abu-abu</option></select>
              <button onClick={downloadWord} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white">Word</button>
              <button onClick={downloadPdf} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">PDF</button>
            </div>
          </div>
          <div id="dummy-content" className="document-preview rounded-b-2xl bg-white p-8 md:p-12" style={{ color }}>
            <div className="mb-16 text-center" style={{ pageBreakAfter: "always" }}>
              <h1 style={{ marginTop: 0, border: "none", fontSize: "32pt" }}>MODUL AJAR</h1>
              <div className="mx-auto mt-44 inline-block min-w-[320px] border-t-2 pt-10 text-left text-[14pt]" style={{ borderColor: color }}>
                <p><b>Nama Penyusun:</b> Ridwan Maulana Utama</p>
                <p><b>Fase / Kelas / Jenjang Sekolah:</b> Fase E / Kelas 10 SMA / SMK / MA</p>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: dummyHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
