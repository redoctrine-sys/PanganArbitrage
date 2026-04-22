# Debug PanganArbitrage

Diagnose common issues in the PanganArbitrage system.

## Usage
```
/debug [component]
```

- `component`: `supabase` | `naming` | `komparasi` | `arbitrage` | `gemini` | `all`

## Checks

### supabase
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Test connection: SELECT 1 from any table
- Check `SUPABASE_SERVICE_ROLE_KEY` for write operations

### naming
- Count `prices_raw` rows with NULL `city_id` or `commodity_id`
- Count pending `naming_queue` items by type/status
- Check if naming agent has been run recently

### komparasi
- Verify `komparasi_harga` VIEW returns data
- Check count of rows by section (A vs B)
- Verify `commodity_pairs` table has entries for cross-source matching

### arbitrage
- Check `arbitrage_opportunities` count by date
- Verify `city_distances` has entries (required for Phase B)
- Verify `transport_vendors` has active entries
- Check ratio of viable vs non-viable opportunities

### gemini
- Verify `GEMINI_API_KEY` is set
- Test with a single opportunity: GET `/api/arbitrage/ai?limit=1`
- Check `ai_recommendation` null count in `arbitrage_opportunities`

## Common Fixes

| Issue | Fix |
|-------|-----|
| Supabase URL undefined | Set env vars in `.env.local` |
| komparasi VIEW empty | Upload CSV → run naming agent → resolve queue |
| Phase B enriched=0 | Add entries to `city_distances` and `transport_vendors` |
| Gemini API error | Check API key validity and quota |
| Build crash "supabaseUrl required" | Supabase client accessed at build time — use lazy proxy |
