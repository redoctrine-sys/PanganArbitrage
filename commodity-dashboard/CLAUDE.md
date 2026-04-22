# PanganArbitrage — CLAUDE.md

## Project
Dashboard analitik harga pangan & arbitrase komoditas. Stack: Next.js 15 App Router · TypeScript · Supabase · Recharts · Gemini 1.5 Flash · OSRM.

## Commands
- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — linting

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## Architecture
- Data masuk via `prices_raw` (SP2KP CSV ingest) atau `pedagang_harga` (form admin)
- Naming Agent review semua raw values sebelum masuk analisis
- `komparasi_harga` VIEW menggabungkan SP2KP + Pedagang (dengan commodity pairs)
- Arbitrase dihitung dari VIEW bersih (Section A only)

## Key Paths
- `lib/naming-agent.ts` — city + commodity review (3 jalur)
- `lib/analytics/arbitrage-engine.ts` — kalkulasi arbitrase
- `supabase/migrations/` — schema + seeds SQL
- `app/api/ingest/sp2kp/route.ts` — CSV ingest endpoint

## Data Sources
- Source: `sp2kp` — CSV dari SP2KP (17 komoditas, 138+ kota)
- Source: `pedagang` — input manual via form admin

## Build Phases
- **Phase 1**: Foundation + SP2KP (selesai)
- **Phase 2**: Naming Agent + Admin UI
- **Phase 3**: Komparasi clean data
- **Phase 4**: Arbitrase engine
