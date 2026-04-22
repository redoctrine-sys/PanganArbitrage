export type Pedagang = {
  id: string
  nama: string
  no_hp: string | null
  city_id: string
  lokasi_detail: string | null
  keterangan: string | null
  created_at: string
}

export type PedagangHarga = {
  id: string
  pedagang_id: string
  commodity_id: string
  price: number
  date: string
  satuan: string
  created_at: string
}

export type PedagangWithHarga = Pedagang & {
  city?: { name: string; province: string | null }
  harga?: (PedagangHarga & { commodity?: { name: string } })[]
}
