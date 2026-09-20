# SIGMA - file migrasi React + Hono + Cloudflare

File ini adalah migrasi dari versi HTML lama SIGMA ke struktur React/Vite + Hono/Cloudflare Worker.

## File yang disalin

- `index.html`
- `src/react-app/main.tsx`
- `src/react-app/App.tsx`
- `src/react-app/index.css`
- `src/react-app/vite-env.d.ts`
- `src/worker/index.ts`

## Dependensi tambahan

Di project SIGMA yang sudah dibuat dari template Cloudflare, jalankan:

```bash
npm install marked dompurify html2pdf.js
```

## API key

Tidak ada API key di source code. Worker membaca:

```ts
c.env.GEMINI_API_KEY
```

Gunakan Cloudflare Secret untuk production:

```bash
npx wrangler secret put GEMINI_API_KEY
```

## Endpoint

- `GET /api/` - health check
- `POST /api/generate` - generate modul ajar dengan Gemini

## Catatan

Upload PDF/DOC pada UI dipertahankan dari versi lama sebagai input tampilan, tetapi isi file belum diparsing oleh backend. Backend lama juga belum memproses isi file tersebut.
