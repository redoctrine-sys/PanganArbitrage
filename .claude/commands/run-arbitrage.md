# Run Arbitrage Compute

Trigger arbitrage computation for a given date.

## Usage
```
/run-arbitrage [date] [phase]
```

- `date`: Target date in YYYY-MM-DD format (defaults to today)
- `phase`: `A` (gross spread) or `B` (transport enrichment) or `all` (both)

## What it does

**Phase A**: Reads `komparasi_harga` VIEW, finds all city pairs per commodity with gross spread ≥ 2%, and upserts into `arbitrage_opportunities`.

**Phase B**: For each opportunity without transport cost, finds cheapest vendor from `transport_vendors` using `city_distances`, then updates `net_profit_per_kg`, `roi_pct`, `viable`, `risk_score`.

## Steps

1. POST to `/api/arbitrage/compute` with `{ date, phase: "A" }`
2. POST to `/api/arbitrage/compute` with `{ date, phase: "B" }` (if phase=all or B)
3. Report results: computed pairs, saved, enriched

## Notes
- Phase A must run before Phase B
- Upsert is idempotent: safe to re-run for the same date
- Requires `city_distances` and `transport_vendors` data for Phase B
