import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode, type CSSProperties } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import html2pdf from "html2pdf.js";
import * as mammoth from "mammoth";

const DRAFT_KEY = "sigma:generator-draft:v4";
const WHATSAPP_NUMBER = "6285860565852";
const MAX_REFERENCE_FILE_BYTES = 15 * 1024 * 1024;
const OFFICIAL_CP_REFERENCE_URL = "https://uploads.belajar.id/document/files/Kepka_BSKAP_No_01k17e8396ajn15j3hcw0k773b.pdf";

const THEME_COLORS = {
  blue: "#1e3a8a",
  emerald: "#047857",
  purple: "#6d28d9",
  slate: "#334155",
} as const;

type ThemeKey = keyof typeof THEME_COLORS;

type GeneratorForm = {
  pilihan_template: "default" | "ai" | "custom";
  warna_tema: ThemeKey;
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
  praktik_pedagogis: string;
  metode_pembelajaran: string;
  pendekatan_pembelajaran: string;
  prinsip_pembelajaran_mendalam: string;
  pengalaman_belajar: string;
  kemitraan_pembelajaran: string;
  lingkungan_pembelajaran: string;
  pemanfaatan_digital: string;
  asesmen_awal: string;
  asesmen_proses: string;
  asesmen_akhir: string;
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
  praktik_pedagogis: "",
  metode_pembelajaran: "",
  pendekatan_pembelajaran: "",
  prinsip_pembelajaran_mendalam: "Berkesadaran, Bermakna, Menggembirakan",
  pengalaman_belajar: "Memahami, Mengaplikasi, Merefleksi",
  kemitraan_pembelajaran: "",
  lingkungan_pembelajaran: "",
  pemanfaatan_digital: "",
  asesmen_awal: "",
  asesmen_proses: "",
  asesmen_akhir: "",
  sumber_referensi_url: OFFICIAL_CP_REFERENCE_URL,
};

const DEFAULT_TEMPLATE = `INFORMASI UMUM

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
   2. Kemitraan Pembelajaran
   3. Lingkungan Pembelajaran
   4. Pemanfaatan Digital
F. Pembelajaran Mendalam
   1. Prinsip: Berkesadaran, Bermakna, Menggembirakan
   2. Pengalaman Belajar: Memahami, Mengaplikasi, Merefleksi
G. Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)
H. Asesmen
   1. Awal Pembelajaran
   2. Selama Proses Pembelajaran
   3. Akhir Pembelajaran

LAMPIRAN

A. Ringkasan Materi
B. Sumber Referensi (ditambahkan otomatis berdasarkan sumber pengguna)`;

const loadingMessages = [
  "Menganalisis data pembelajaran...",
  "Menyusun struktur modul...",
  "Mengolah sumber referensi...",
  "Menghasilkan isi modul...",
  "Menyiapkan preview...",
];

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (path === "/modul-ajar" || path === "/modul-ajar.html") return <GeneratorPage />;
  if (path === "/preview-dummy" || path === "/preview-dummy.html") return <DummyPreviewPage />;
  return <HomePage />;
}

function Header({ back = false }: { back?: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-blue-900 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-lg font-bold transition hover:opacity-90">
          <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          SIGMA
        </button>
        {back && (
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-1 rounded-lg border border-blue-700 bg-blue-800 px-3 py-1.5 text-sm font-medium transition hover:bg-blue-700">
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-bold text-blue-900"><span className="text-blue-600">▣</span>SIGMA</div>
          <button type="button" onClick={() => navigate("/modul-ajar")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Buat Modul</button>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid w-full grid-cols-1 items-center gap-7 lg:grid-cols-2 lg:gap-9">
          <div className="space-y-4 text-left">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm sm:text-sm">Didukung oleh Artificial Intelligence</span>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-[2.7rem] lg:text-5xl">Buat Modul Ajar Terstruktur Hanya dalam <span className="mt-1 block text-blue-600">Hitungan Detik</span></h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg">Permudah penyusunan perangkat pembelajaran Kurikulum Merdeka secara otomatis, rapi, dan siap diunduh dalam format Word atau PDF.</p>
            <div className="pt-2">
              <button type="button" onClick={() => navigate("/modul-ajar")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">Mulai Buat Modul Sekarang →</button>
            </div>
          </div>

          <div className="flex flex-col space-y-2.5 lg:pl-4">
            <Feature icon="⚡" title="Instan & Cepat" description="Cukup isi parameter materi, draf langsung selesai." />
            <Feature icon="📝" title="Format Standar" description="Struktur modul konsisten dan dapat dipilih sesuai kebutuhan." />
            <Feature icon="📚" title="Berbasis Referensi" description="Gunakan URL atau upload PDF/DOCX sebagai bahan acuan." />
            <Feature icon="💾" title="Ekspor Mudah" description="Unduh hasil dalam format Word atau PDF." />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs font-medium text-slate-500">© 2026 SIGMA. Semua Hak Dilindungi.</footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>
      <div><div className="mb-1 text-base font-bold text-blue-900">{title}</div><p className="text-sm leading-relaxed text-slate-600">{description}</p></div>
    </div>
  );
}

function GeneratorPage() {
  const [form, setForm] = useState<GeneratorForm>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return initialForm;

      const parsed = JSON.parse(saved) as Partial<GeneratorForm>;
      return {
        ...initialForm,
        ...parsed,
        sumber_referensi_url:
          parsed.sumber_referensi_url?.trim() || OFFICIAL_CP_REFERENCE_URL,
      };
    } catch {
      return initialForm;
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceStatus, setReferenceStatus] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const colorHex = THEME_COLORS[form.warna_tema];

  const renderedResult = useMemo(() => {
    if (!resultMarkdown) return "";
    const markdownHtml = marked.parse(resultMarkdown, { async: false });
    return DOMPurify.sanitize(markdownHtml);
  }, [resultMarkdown]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage errors.
    }
  }, [form]);

  const update = <K extends keyof GeneratorForm>(key: K, value: GeneratorForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError("");
    setReferenceStatus("");
    setReferenceFile(null);

    if (!file) return;
    if (file.size > MAX_REFERENCE_FILE_BYTES) {
      event.target.value = "";
      setError("Ukuran file maksimal 15 MB.");
      return;
    }

    const lower = file.name.toLowerCase();
    if (lower.endsWith(".doc")) {
      event.target.value = "";
      setError("File .doc lama belum didukung langsung. Simpan sebagai .docx atau PDF terlebih dahulu.");
      return;
    }
    if (![".pdf", ".docx", ".txt"].some((ext) => lower.endsWith(ext))) {
      event.target.value = "";
      setError("Gunakan file PDF, DOCX, atau TXT.");
      return;
    }

    if (lower.endsWith(".docx")) {
      try {
        setReferenceStatus("Membaca isi DOCX...");
        const arrayBuffer = await file.arrayBuffer();
        const extraction = await mammoth.extractRawText({ arrayBuffer });
        if (!extraction.value.trim()) throw new Error("Dokumen DOCX tidak berisi teks yang dapat dibaca.");
        setReferenceStatus(`DOCX siap digunakan (${Math.round(extraction.value.length / 1000)}k karakter).`);
      } catch (err) {
        event.target.value = "";
        setReferenceStatus("");
        setError(err instanceof Error ? err.message : "DOCX tidak dapat dibaca.");
        return;
      }
    } else if (lower.endsWith(".txt")) {
      setReferenceStatus("TXT siap digunakan.");
    } else {
      setReferenceStatus("PDF akan diproses langsung oleh Gemini.");
    }

    setReferenceFile(file);
  };

  async function generateModule(event?: FormEvent<HTMLFormElement>, regenerate = false) {
    event?.preventDefault();
    setError("");

    if (!form.nama_penyusun || !form.identitas_sekolah || !form.kurikulum || !form.fase_kelas_jenjang || !form.mata_pelajaran || !form.bab_tema || !form.capaian_pembelajaran || !form.materi_pembelajaran || !form.alokasi_waktu || !form.praktik_pedagogis || !form.metode_pembelajaran || !form.pendekatan_pembelajaran || !form.asesmen_awal || !form.asesmen_proses || !form.asesmen_akhir) {
      setError("Lengkapi semua field wajib sebelum membuat modul.");
      return;
    }

    if (form.pilihan_template === "custom" && !form.template_custom.trim()) {
      setError("Template custom belum diisi.");
      return;
    }

    if (form.sumber_referensi_url) {
      try {
        new URL(form.sumber_referensi_url);
      } catch {
        setError("URL materi tidak valid.");
        return;
      }
    }

    setLoading(true);
    setIsRegenerating(regenerate);
    setLoadingStage(0);

    const interval = window.setInterval(() => {
      setLoadingStage((stage) => Math.min(stage + 1, loadingMessages.length - 1));
    }, 1400);

    try {
      const payload = new FormData();
      for (const [key, value] of Object.entries(form)) payload.append(key, value);

      // Alias kompatibilitas dengan Worker versi sebelumnya.
      payload.append("model_pembelajaran", form.praktik_pedagogis);
      payload.append("jenis_asesmen", [
        `Awal: ${form.asesmen_awal}`,
        `Proses: ${form.asesmen_proses}`,
        `Akhir: ${form.asesmen_akhir}`,
      ].join("; "));
      if (referenceFile) {
        payload.append("reference_file", referenceFile, referenceFile.name);
        payload.append("reference_file_name", referenceFile.name);

        if (referenceFile.name.toLowerCase().endsWith(".docx")) {
          const arrayBuffer = await referenceFile.arrayBuffer();
          const extraction = await mammoth.extractRawText({ arrayBuffer });
          payload.append("reference_text", extraction.value.slice(0, 120000));
        } else if (referenceFile.name.toLowerCase().endsWith(".txt")) {
          payload.append("reference_text", (await referenceFile.text()).slice(0, 120000));
        }
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: payload,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Request gagal (${response.status}).`);
      }

      setResultMarkdown(result.data || "");
      setTimeout(() => document.getElementById("hasil")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Koneksi API gagal.");
    } finally {
      window.clearInterval(interval);
      setLoading(false);
      setIsRegenerating(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setReferenceFile(null);
    setReferenceStatus("");
    setResultMarkdown("");
    setError("");
    localStorage.removeItem(DRAFT_KEY);
  }

  function downloadPdf() {
    const element = document.getElementById("hasil-content");
    if (!element) return;
    html2pdf().set({
      margin: [40, 30, 30, 40],
      filename: `Modul-Ajar-${slugify(form.mata_pelajaran || "SIGMA")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(element).save();
  }

  function downloadWord() {
    const element = document.getElementById("hasil-content");
    if (!element) return;
    const html = `<!DOCTYPE html><html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>Modul Ajar SIGMA</title><style>@page WordSection1{size:595.3pt 841.9pt;margin:113.4pt 85.05pt 85.05pt 113.4pt}div.WordSection1{page:WordSection1}body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;color:#000}h1{text-align:center;text-transform:uppercase;font-size:16pt;color:${colorHex};border-bottom:1px solid ${colorHex};padding-bottom:10px;margin-bottom:20px}h2{font-size:14pt;margin-top:20px;color:${colorHex};text-transform:uppercase}h3,h4{font-size:12pt;margin-top:15px}p,li{text-align:justify;line-height:1.5}table{border-collapse:collapse;width:100%;margin-top:10px;margin-bottom:10px;page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}th,td{border:1px solid #000;padding:8px;vertical-align:top;font-size:11pt}.cover-page{page-break-after:always;text-align:center}</style></head><body><div class='WordSection1'>${element.innerHTML}</div></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Modul-Ajar-${slugify(form.mata_pelajaran || "SIGMA")}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!resultMarkdown) return;
    await navigator.clipboard.writeText(resultMarkdown);
  }

  function editInput() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => document.getElementById("generator-form")?.querySelector<HTMLInputElement>("input")?.focus(), 450);
  }

  function sendWhatsApp(name: string, message: string) {
    const text = `Halo, saya *${name.trim()}*.\n\nBerikut kritik dan saran untuk aplikasi SIGMA:\n${message.trim()}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setShowFeedback(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header back />

      <main className="mx-auto mt-2 max-w-4xl space-y-3 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
          <div><strong>Draft otomatis aktif.</strong> Isian form disimpan di browser ini.</div>
          <button type="button" onClick={resetForm} className="self-start rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 sm:self-auto">Reset Form</button>
        </div>

        {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-600"><span>⚠️</span><span>{error}</span></div>}

        <form id="generator-form" onSubmit={generateModule} className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle number="1" title="Format Template Modul" />
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <SelectInput label="Pilih Template" value={form.pilihan_template} onChange={(v) => update("pilihan_template", v as GeneratorForm["pilihan_template"])} options={["default", "ai", "custom"]} labels={{ default: "Default", ai: "Buat oleh AI", custom: "Custom" }} placeholder="Pilih Template" required />
              <div className="flex items-end gap-2">
                <div className="w-full"><SelectInput label="Pilih Warna Tema Modul Ajar" value={form.warna_tema} onChange={(v) => update("warna_tema", v as ThemeKey)} options={["blue", "emerald", "purple", "slate"]} labels={{ blue: "Biru Standar (Professional)", emerald: "Hijau (Emerald)", purple: "Ungu (Creative)", slate: "Abu-abu (Minimalis)" }} placeholder="Pilih Warna" required /></div>
                {form.pilihan_template === "default" && <button type="button" onClick={() => setShowTemplateModal(true)} className="mb-0 shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100">Pratinjau</button>}
              </div>
            </div>

            {form.pilihan_template === "custom" && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">Tulis Format Template Custom Anda</label>
                <textarea value={form.template_custom} onChange={(e) => update("template_custom", e.target.value)} rows={8} placeholder={'Contoh:\n1. Pendahuluan\n2. Kompetensi Dasar\n3. Kegiatan Inti...'} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500" required />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle number="2" title="Informasi Umum" />
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <TextInput label="Nama Penyusun" value={form.nama_penyusun} onChange={(v) => update("nama_penyusun", v)} required />
              <TextInput label="Identitas Sekolah" value={form.identitas_sekolah} onChange={(v) => update("identitas_sekolah", v)} required />
              <TextInput label="Tahun Penyusunan" value={form.tahun_penyusunan} onChange={(v) => update("tahun_penyusunan", v)} inputMode="numeric" required />
              <SelectInput label="Kurikulum" value={form.kurikulum} onChange={(v) => update("kurikulum", v)} options={["Kurikulum Merdeka"]} placeholder="Pilih Kurikulum" required />
              <SelectInput label="Fase / Kelas / Jenjang Sekolah" value={form.fase_kelas_jenjang} onChange={(v) => update("fase_kelas_jenjang", v)} options={["Fase Fondasi: PAUD / RA","Fase A: Kelas 1–2 SD / MI","Fase B: Kelas 3–4 SD / MI","Fase C: Kelas 5–6 SD / MI","Fase D: Kelas 7–9 SMP / MTs","Fase E: Kelas 10 SMA / SMK / MA","Fase F: Kelas 11–12 SMA / MA dan SMK program 3 tahun","Fase Khusus (Fase Kelas 11–13): SMK program 4 tahun"]} placeholder="Pilih Fase / Kelas / Jenjang" required fullWidth />
              <TextInput label="Mata Pelajaran" value={form.mata_pelajaran} onChange={(v) => update("mata_pelajaran", v)} required />
              <TextInput label="Bab / Tema / Elemen" value={form.bab_tema} onChange={(v) => update("bab_tema", v)} required />
              <TextArea label="Capaian Pembelajaran" value={form.capaian_pembelajaran} onChange={(v) => update("capaian_pembelajaran", v)} required fullWidth />
              <TextArea label="Materi Pembelajaran" value={form.materi_pembelajaran} onChange={(v) => update("materi_pembelajaran", v)} required fullWidth />
              <TextInput label="Alokasi Waktu" value={form.alokasi_waktu} onChange={(v) => update("alokasi_waktu", v)} placeholder="Contoh: 2 x 45 menit" required fullWidth />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle number="3" title="Desain Pembelajaran" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectWithCustom
                label="Praktik Pedagogis"
                value={form.praktik_pedagogis}
                onChange={(v) => update("praktik_pedagogis", v)}
                options={[
                  "Pembelajaran Berbasis Projek (Project-Based Learning)",
                  "Pembelajaran Berbasis Masalah (Problem-Based Learning)",
                  "Pembelajaran Berbasis Inkuiri (Inquiry-Based Learning)",
                  "Pembelajaran Kolaboratif (Collaborative Learning)",
                  "Pembelajaran Kontekstual (Contextual Learning)",
                  "Pembelajaran Berdiferensiasi (Differentiated Instruction)",
                  "Pembelajaran STEM (Science, Technology, Engineering, Mathematics)",
                  "Lainnya / Isi Sendiri",
                ]}
                placeholder="Pilih praktik pedagogis"
                customPlaceholder="Tuliskan praktik pedagogis yang digunakan..."
                required
              />

              <SelectWithCustom
                label="Pendekatan Pembelajaran"
                value={form.pendekatan_pembelajaran}
                onChange={(v) => update("pendekatan_pembelajaran", v)}
                options={[
                  "Pembelajaran Mendalam (Deep Learning)",
                  "Lainnya / Isi Sendiri",
                ]}
                placeholder="Pilih pendekatan pembelajaran"
                customPlaceholder="Tuliskan pendekatan pembelajaran lain..."
                required
              />

              <MethodSelector
                label="Metode / Teknik Pendukung"
                value={form.metode_pembelajaran}
                onChange={(v) => update("metode_pembelajaran", v)}
                fullWidth
              />

              <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-blue-900">Pembelajaran Mendalam</h3>
                  <p className="mt-1 text-xs leading-relaxed text-blue-700">Prinsip dan pengalaman belajar berikut mengikuti kerangka Pembelajaran Mendalam.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TagCheckboxGroup
                    label="Prinsip Pembelajaran"
                    options={["Berkesadaran", "Bermakna", "Menggembirakan"]}
                    value={form.prinsip_pembelajaran_mendalam}
                    onChange={(v) => update("prinsip_pembelajaran_mendalam", v)}
                  />
                  <TagCheckboxGroup
                    label="Pengalaman Belajar"
                    options={["Memahami", "Mengaplikasi", "Merefleksi"]}
                    value={form.pengalaman_belajar}
                    onChange={(v) => update("pengalaman_belajar", v)}
                  />
                </div>
              </div>

              <TextArea
                label="Kemitraan Pembelajaran (Opsional)"
                value={form.kemitraan_pembelajaran}
                onChange={(v) => update("kemitraan_pembelajaran", v)}
                placeholder="Contoh: orang tua, masyarakat, komunitas, dunia kerja, mitra sekolah..."
                hint="Isi hanya bila relevan dengan pembelajaran."
              />
              <TextArea
                label="Lingkungan Pembelajaran (Opsional)"
                value={form.lingkungan_pembelajaran}
                onChange={(v) => update("lingkungan_pembelajaran", v)}
                placeholder="Contoh: ruang kelas, laboratorium, ruang virtual, budaya belajar..."
                hint="Boleh memuat aspek fisik, virtual, dan budaya belajar."
              />
              <TextArea
                label="Pemanfaatan Digital (Opsional)"
                value={form.pemanfaatan_digital}
                onChange={(v) => update("pemanfaatan_digital", v)}
                placeholder="Contoh: LMS, simulasi, presentasi, video, internet, aplikasi pembelajaran..."
                hint="Tuliskan perangkat atau aplikasi yang benar-benar akan digunakan."
                fullWidth
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-800">Asesmen</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Atur asesmen berdasarkan waktu pelaksanaannya: awal, proses, dan akhir pembelajaran.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SelectWithCustom
                  label="Awal Pembelajaran"
                  value={form.asesmen_awal}
                  onChange={(v) => update("asesmen_awal", v)}
                  options={["Diagnostik", "Kuis Awal", "Observasi Awal", "Tanya Jawab Awal", "Lainnya / Isi Sendiri"]}
                  placeholder="Pilih asesmen awal"
                  customPlaceholder="Tuliskan asesmen awal..."
                  required
                />
                <SelectWithCustom
                  label="Selama Proses"
                  value={form.asesmen_proses}
                  onChange={(v) => update("asesmen_proses", v)}
                  options={["Formatif", "Observasi", "Unjuk Kerja", "Diskusi (Discussion)", "Umpan Balik", "Peer Assessment", "Lainnya / Isi Sendiri"]}
                  placeholder="Pilih asesmen proses"
                  customPlaceholder="Tuliskan asesmen proses..."
                  required
                />
                <SelectWithCustom
                  label="Akhir Pembelajaran"
                  value={form.asesmen_akhir}
                  onChange={(v) => update("asesmen_akhir", v)}
                  options={["Sumatif", "Tes Tertulis", "Produk / Projek", "Presentasi (Presentation)", "Portofolio", "Unjuk Kerja", "Lainnya / Isi Sendiri"]}
                  placeholder="Pilih asesmen akhir"
                  customPlaceholder="Tuliskan asesmen akhir..."
                  required
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-blue-900">🔗 Referensi Capaian Pembelajaran (Pemerintah)</h3>
                <span className="text-xs text-blue-500">Dipakai sebagai konteks AI</span>
              </div>
              <TextInput
                label="URL Dokumen CP"
                value={form.sumber_referensi_url}
                onChange={(v) => update("sumber_referensi_url", v)}
                placeholder="https://..."
                type="url"
                required
              />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-500">URL default mengarah ke dokumen CP resmi yang kamu berikan. Guru dapat menggantinya jika menggunakan dokumen CP yang lain.</p>
                <a href={form.sumber_referensi_url || OFFICIAL_CP_REFERENCE_URL} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">Buka Dokumen</a>
              </div>
            </div>

            <div className="mt-3.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">📚 Referensi Tambahan (Opsional)</h3>
                <span className="text-xs text-slate-400">PDF / DOCX / TXT</span>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Upload Referensi</label>
                <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700" />
                <p className="mt-1 text-xs text-slate-400">PDF diproses oleh Gemini. DOCX/TXT dibaca di browser lalu dikirim sebagai konteks teks. Maksimal 15 MB.</p>
                {referenceFile && <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600">📎 {referenceFile.name}</p>}
                {referenceStatus && <p className="mt-1 text-xs font-medium text-emerald-600">{referenceStatus}</p>}
              </div>
            </div>
          </section>

          <div className="sticky bottom-4 z-30 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 py-3 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-75">
              {loading ? loadingMessages[loadingStage] : "Buat Modul Ajar"} {loading ? <span className="animate-pulse">●</span> : <span>⚡</span>}
            </button>
          </div>
        </form>

        <div id="hasil" className="scroll-mt-24" />
        {resultMarkdown && (
          <section id="hasil-container" className="mb-8 flex min-h-[360px] flex-col rounded-xl border border-blue-100 bg-white shadow-lg">
            <div className="flex flex-col items-start justify-between gap-3 rounded-t-xl border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-4 lg:flex-row lg:items-center">
              <div><h2 className="flex items-center gap-2 text-lg font-extrabold text-blue-900">📄 Pratinjau Modul</h2><p className="mt-1 text-xs text-slate-500">Hasil dapat diedit dengan mengubah input lalu Regenerate.</p></div>
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto">
                <button type="button" onClick={editInput} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:text-sm">Edit Input</button>
                <button type="button" onClick={() => void generateModule(undefined, true)} disabled={isRegenerating} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 sm:text-sm">Regenerate</button>
                <button type="button" onClick={copyMarkdown} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 sm:text-sm">Salin Markdown</button>
                <button type="button" onClick={downloadWord} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 sm:text-sm">Word</button>
                <button type="button" onClick={downloadPdf} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 sm:text-sm">PDF</button>
              </div>
            </div>
            <div id="hasil-content" className="document-preview max-w-none rounded-b-xl bg-white p-6 sm:p-8 md:p-10">
              <div className="cover-page mb-16 text-center">
                <h1 style={{ marginTop: 0, border: "none", color: colorHex, fontSize: "25pt" }}>MODUL AJAR</h1>
                <div className="mx-auto mt-24 inline-block min-w-[260px] border-t-2 pt-5 text-left text-[12pt] leading-relaxed sm:text-[13pt]" style={{ borderColor: colorHex }}>
                  <p><b>Nama Penyusun:</b> {form.nama_penyusun}</p>
                  <p><b>Fase / Kelas / Jenjang Sekolah:</b> {form.fase_kelas_jenjang}</p>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: renderedResult }} style={{ "--sigma-theme": colorHex } as CSSProperties} />
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
  return <h2 className="mb-4 flex items-center gap-2 text-[0.95rem] font-extrabold text-blue-900 sm:text-base"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs text-blue-600">{number}</span>{title}</h2>;
}

function TextInput({ label, value, onChange, placeholder, type = "text", fullWidth = false, required = false, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; fullWidth?: boolean; required?: boolean; inputMode?: "numeric" | "text" | "url" }) {
  return <div className={fullWidth ? "md:col-span-2" : ""}><label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} inputMode={inputMode} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500" /></div>;
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  fullWidth = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  fullWidth?: boolean;
  required?: boolean;
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 leading-relaxed outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
      {hint && <p className="mt-1 text-xs leading-relaxed text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectWithCustom({ label, value, onChange, options, placeholder, customPlaceholder, required = false, fullWidth = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string; customPlaceholder: string; required?: boolean; fullWidth?: boolean }) {
  const CUSTOM = "Lainnya / Isi Sendiri";
  const isCustom = value === CUSTOM || (value && !options.includes(value));
  const selectValue = isCustom ? CUSTOM : value;

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <select
        value={selectValue}
        onChange={(e) => onChange(e.target.value === CUSTOM ? CUSTOM : e.target.value)}
        required={required && !isCustom}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {isCustom && (
        <input
          value={value === CUSTOM ? "" : value}
          onChange={(e) => onChange(e.target.value || CUSTOM)}
          placeholder={customPlaceholder}
          autoFocus
          required={required}
          className="mt-2 w-full rounded-lg border border-blue-300 bg-blue-50/40 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

function MethodSelector({ label, value, onChange, fullWidth = false }: { label: string; value: string; onChange: (value: string) => void; fullWidth?: boolean }) {
  const options = ["Ceramah / Penjelasan Langsung (Direct Instruction)", "Diskusi (Discussion)", "Tanya Jawab (Question and Answer)", "Demonstrasi (Demonstration)", "Praktik / Latihan (Practice)", "Kerja Kelompok (Group Work)", "Studi Kasus (Case Study)", "Presentasi (Presentation)", "Simulasi (Simulation)", "Eksperimen (Experiment)", "Penugasan (Assignment)"];
  const selected = value.split(",").map((item) => item.trim()).filter(Boolean);
  const toggle = (option: string) => {
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    onChange(next.join(", "));
  };

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {options.map((option) => (
          <label key={option} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${selected.includes(option) ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} className="h-3.5 w-3.5 accent-blue-600" />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Tambahkan metode/teknik lain, jika diperlukan..." />
      <p className="mt-1 text-xs text-slate-400">Boleh memilih beberapa. Kamu juga dapat mengetik sendiri.</p>
    </div>
  );
}

function TagCheckboxGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const selected = value.split(",").map((item) => item.trim()).filter(Boolean);
  const toggle = (option: string) => {
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    onChange(next.join(", "));
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-900">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected.includes(option) ? "border-blue-300 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} className="sr-only" />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options, labels, placeholder, fullWidth = false, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string>; placeholder: string; fullWidth?: boolean; required?: boolean }) {
  return <div className={fullWidth ? "md:col-span-2" : ""}><label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500"><option value="" disabled>{placeholder}</option>{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}</select></div>;
}

function TemplateModal({ onClose }: { onClose: () => void }) {
  return <ModalShell title="Pratinjau Struktur Template Default" onClose={onClose}><pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-mono text-sm leading-relaxed text-slate-700">{DEFAULT_TEMPLATE}</pre><div className="mt-6 border-t border-slate-200 pt-5 text-right"><button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700">Tutup</button></div></ModalShell>;
}

function FeedbackModal({ onClose, onSend }: { onClose: () => void; onSend: (name: string, message: string) => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return <ModalShell title="Kirim via WhatsApp" onClose={onClose} tone="green"><p className="mb-5 text-sm leading-relaxed text-slate-600">Masukan Anda sangat berarti bagi pengembangan aplikasi SIGMA.</p><div className="space-y-4"><TextInput label="Nama Anda" value={name} onChange={setName} placeholder="Masukkan nama..." /><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Kritik & Saran</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition-shadow focus:border-green-500 focus:ring-2 focus:ring-green-500" placeholder="Ketik pesan Anda di sini..." /></div></div><div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100">Batal</button><button type="button" disabled={!name.trim() || !message.trim()} onClick={() => onSend(name, message)} className="rounded-xl bg-green-600 px-6 py-2.5 font-bold text-white disabled:opacity-50">Kirim Pesan</button></div></ModalShell>;
}

function ModalShell({ title, onClose, children, tone = "blue" }: { title: string; onClose: () => void; children: ReactNode; tone?: "blue" | "green" }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"><div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"><div className={`flex items-center justify-between rounded-t-2xl border-b border-slate-200 p-5 ${tone === "green" ? "bg-green-50" : "bg-slate-50"}`}><h3 className={`text-lg font-extrabold ${tone === "green" ? "text-green-800" : "text-slate-800"}`}>{title}</h3><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:text-red-500">✕</button></div><div className="overflow-y-auto p-6">{children}</div></div></div>;
}

function FeedbackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:-translate-y-1 hover:scale-105 hover:bg-green-600"><span className="text-xl">✆</span><span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">Kritik & Saran</span></button>;
}

function DummyPreviewPage() {
  const [theme, setTheme] = useState<ThemeKey>("blue");
  const color = THEME_COLORS[theme];
  const dummyHtml = `<h1>INFORMATIKA DASAR</h1><h2>INFORMASI UMUM</h2><h3>A. Identitas Modul</h3><ul><li><strong>Nama Penyusun:</strong> Ridwan Maulana</li><li><strong>Identitas Sekolah:</strong> SMAN 1 Bandung</li><li><strong>Tahun Penyusunan:</strong> 2026</li></ul><h2>DESAIN PEMBELAJARAN</h2><h3>A. Capaian Pembelajaran</h3><p>Peserta didik mampu memahami logika pemrograman dasar.</p><h3>B. Kegiatan Pembelajaran</h3><table><thead><tr><th>No</th><th>Kegiatan</th><th>Langkah-Langkah</th><th>Alokasi Waktu</th></tr></thead><tbody><tr><td>1</td><td>Pendahuluan</td><td>Apersepsi dan tujuan pembelajaran.</td><td>15 Menit</td></tr><tr><td>2</td><td>Inti</td><td>Diskusi, proyek, dan evaluasi.</td><td>60 Menit</td></tr><tr><td>3</td><td>Penutup</td><td>Refleksi dan kesimpulan.</td><td>15 Menit</td></tr></tbody></table>`;
  function downloadPdf() { const element = document.getElementById("dummy-content"); if (element) html2pdf().set({ margin: [40,30,30,40], filename: "Preview-Dummy-SIGMA.pdf", image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(element).save(); }
  function downloadWord() { const element = document.getElementById("dummy-content"); if (!element) return; const html = `<html><head><meta charset='utf-8'><style>body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}h1,h2{color:${color}}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:8px}</style></head><body>${element.innerHTML}</body></html>`; const blob = new Blob(["\ufeff", html], { type: "application/msword" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Preview-Dummy-SIGMA.doc"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }
  return <div className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-4xl"><button type="button" onClick={() => navigate("/modul-ajar")} className="mb-6 text-blue-600 hover:text-blue-800">← Kembali ke Form Generator</button><div className="mb-12 rounded-2xl border border-blue-100 bg-white shadow-lg"><div className="flex flex-col items-center justify-between gap-4 rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-6 sm:flex-row"><h2 className="text-xl font-extrabold text-blue-900">📄 Pratinjau Dummy</h2><div className="flex flex-wrap gap-3"><select value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"><option value="blue">Warna: Biru</option><option value="emerald">Warna: Hijau</option><option value="purple">Warna: Ungu</option><option value="slate">Warna: Abu-abu</option></select><button onClick={downloadWord} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white">Word</button><button onClick={downloadPdf} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">PDF</button></div></div><div id="dummy-content" className="document-preview rounded-b-2xl bg-white p-8 md:p-12" style={{ "--sigma-theme": color } as CSSProperties} dangerouslySetInnerHTML={{ __html: `<div class='cover-page'><h1 style='border:none;color:${color};font-size:32pt'>MODUL AJAR</h1><div class='mx-auto mt-44 inline-block min-w-[320px] border-t-2 pt-10 text-left text-[14pt]' style='border-color:${color}'><p><b>Nama Penyusun:</b> Ridwan Maulana</p><p><b>Fase / Kelas / Jenjang Sekolah:</b> Fase E: Kelas 10 SMA / SMK / MA</p></div></div>${dummyHtml}` }} /></div></div></div>;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "sigma";
}

export default App;
