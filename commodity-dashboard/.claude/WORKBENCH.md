# WORKBENCH — PanganArbitrage

## Current Phase: Phase 1 (Foundation + SP2KP)

## Status
- [x] Next.js 15 setup
- [x] Supabase migrations 001-009
- [x] sp2kp-parser.ts
- [x] CSV upload flow
- [x] Layout + routing
- [x] SP2KP tab UI

## Phase 2 TODO
- [ ] naming-agent.ts (city + commodity 3 jalur)
- [ ] Admin routes + pages
- [ ] NamingQueue + CommodityQueue UI
- [ ] commodity_pairs approve flows
- [ ] Pedagang tab

## Phase 3 TODO
- [ ] komparasi_harga VIEW
- [ ] Section B RPC functions
- [ ] Komparasi tab UI
- [ ] Transport + OSRM

## Phase 4 TODO
- [ ] arbitrage-engine.ts
- [ ] Manual calculator
- [ ] Gemini AI integration

## Known Issues / Notes
- HET/HA hanya tampil di chart detail, tidak di row list
- Pedagang data masuk ke pedagang_harga (bukan prices_raw)
- Section B tidak masuk arbitrase
