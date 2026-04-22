# Run Naming Agent

Run the naming agent to review unmatched city/commodity names in `prices_raw`.

## Usage
```
/run-naming-agent [source]
```

- `source`: `sp2kp` | `pedagang` | `all` (defaults to all)

## What it does

The naming agent processes `prices_raw` rows where `city_id` or `commodity_id` is NULL:

**City Review** (`runCityReview`):
1. Exact match on `kode_wilayah` → auto-approve
2. Fuzzy match on city name (Levenshtein + Jaccard) → auto-approve if ≥ 0.95, queue if 0.30–0.95, queue as new if < 0.30

**Commodity Review** (`runCommodityReview`):
- Jalur 1: `prices_raw` with NULL `commodity_id` → match against `commodities` table
- Jalur 2: Pedagang-only rows → match or create pair candidates

## Steps

1. POST to `/api/admin/naming/run` with `{ source }`
2. Review queued items at `/dashboard/admin/naming` (cities) and `/dashboard/admin/commodity` (commodities)
3. Approve typos → maps `prices_raw.city_id` / `commodity_id`
4. Approve pairs → creates `commodity_pairs` entries

## Notes
- Auto-approve threshold: 0.95 similarity
- Queue range: 0.30 – 0.94
- Below 0.30: queued as "new" — needs manual review before creating entity
