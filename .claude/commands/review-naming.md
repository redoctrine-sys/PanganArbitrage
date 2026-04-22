# Review Naming Queue

Review and resolve pending naming queue items (cities and commodities).

## Usage
```
/review-naming [type]
```

- `type`: `cities` | `commodities` | `all` (defaults to all)

## What it reviews

**Cities** (`/api/admin/naming/queue`):
- `typo`: Near-match to existing city — approve to map `prices_raw.city_id`
- `new`: Unknown city — approve to create new city entity or reject

**Commodities** (`/api/admin/commodity/queue`):
- `typo`: Near-match to existing commodity — approve to map `prices_raw.commodity_id`
- `pair`: Cross-source comparable (e.g. "Bawang Merah" SP2KP ↔ "Brambang" pedagang) — approve to create `commodity_pairs` entry
- `new`: Unknown commodity — approve to add to `commodities` table

## Steps

1. Fetch queue: GET `/api/admin/naming/queue?status=pending`
2. For each item, show the raw value vs. candidate match
3. For typos: `approve` maps to existing entity, `reject` discards
4. For new: `approve_as_new` creates new entity, `reject` discards
5. For pairs: show `exact/comparable/variant` options → creates `commodity_pairs`
6. Re-run naming agent to process next batch

## Notes
- Resolved queue items trigger `prices_raw` row updates (city_id / commodity_id set)
- Pair approvals enable cross-source komparasi in the VIEW
- Check Komparasi tab after resolving to verify data appears correctly
