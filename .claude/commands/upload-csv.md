# Upload SP2KP CSV

Upload a SP2KP price CSV file to ingest into `prices_raw`.

## Usage
```
/upload-csv [file_path]
```

## Accepted CSV Formats

The parser auto-detects column headers. Supported column names:

| Data       | Accepted Headers                        |
|------------|----------------------------------------|
| Date       | tanggal, tgl, date                     |
| City       | kabupaten, kota, wilayah, city         |
| Commodity  | komoditas, nama, commodity, barang     |
| Price      | harga, price, nilai                    |
| HET/HA     | het, ha, harga_eceran_tertinggi        |
| Kode       | kode_wilayah, kode, wilayah_id         |

Date formats supported: `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`

## Steps

1. Read the CSV file from `file_path`
2. POST to `/api/ingest/sp2kp` as `multipart/form-data` with `file` field
3. Report: total rows, inserted, skipped (duplicates), parse errors
4. Recommend running `/run-naming-agent` after upload to resolve unmatched names

## Notes
- Duplicates are skipped automatically (upsert with `ignoreDuplicates: true`)
- Max recommended batch: 50,000 rows per file
- After upload, check Ingest Log at `/dashboard/admin/ingest-log`
