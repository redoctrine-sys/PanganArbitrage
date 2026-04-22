-- 006_view_komparasi.sql
-- VIEW: komparasi_harga (Section A — paired only, no HET)

CREATE OR REPLACE VIEW komparasi_harga AS
WITH
  sp2kp_latest AS (
    SELECT DISTINCT ON (city_id, commodity_id)
      city_id, commodity_id, price, date
    FROM prices_raw
    WHERE source = 'sp2kp'
      AND city_id IS NOT NULL AND commodity_id IS NOT NULL
    ORDER BY city_id, commodity_id, date DESC
  ),
  pedagang_agg AS (
    SELECT p.city_id, ph.commodity_id,
      ROUND(AVG(ph.price), 2) AS price,
      MAX(ph.date) AS date,
      COUNT(*) AS sample_count
    FROM pedagang_harga ph
    JOIN pedagang p ON ph.pedagang_id = p.id
    WHERE ph.date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY p.city_id, ph.commodity_id
  ),
  active_pairs AS (
    SELECT commodity_a_id, commodity_b_id, pair_type
    FROM commodity_pairs WHERE approved_at IS NOT NULL
  ),
  monthly_vol AS (
    SELECT city_id, commodity_id,
      ROUND((MAX(price)-MIN(price))/NULLIF(AVG(price),0)*100,2) AS volatility_pct
    FROM prices_raw
    WHERE source='sp2kp' AND city_id IS NOT NULL
      AND date >= date_trunc('month', CURRENT_DATE)
    GROUP BY city_id, commodity_id
  )
SELECT
  c.id AS city_id, c.name AS city_name, c.province, c.island, c.entity_type,
  cm.id AS commodity_id, cm.name AS commodity_name, cm.category, cm.is_sp2kp,
  sp.price AS sp2kp_price, sp.date AS sp2kp_date,
  COALESCE(ped_d.price, ped_p.price)       AS pedagang_price,
  COALESCE(ped_d.date,  ped_p.date)        AS pedagang_date,
  COALESCE(ped_d.sample_count, ped_p.sample_count) AS pedagang_count,
  (ped_d.price IS NULL AND ped_p.price IS NOT NULL) AS pedagang_via_pair,
  CASE WHEN sp.price IS NOT NULL AND COALESCE(ped_d.price,ped_p.price) IS NOT NULL
    THEN ROUND(ABS(sp.price - COALESCE(ped_d.price,ped_p.price))/sp.price*100, 2)
  END AS mismatch_pct,
  CASE WHEN sp.price IS NOT NULL AND COALESCE(ped_d.price,ped_p.price) IS NOT NULL
    THEN ABS(sp.price - COALESCE(ped_d.price,ped_p.price))/sp.price > 0.05
    ELSE FALSE
  END AS is_mismatch,
  mv.volatility_pct
FROM cities c
CROSS JOIN commodities cm
LEFT JOIN sp2kp_latest   sp    ON sp.city_id    = c.id AND sp.commodity_id    = cm.id
LEFT JOIN pedagang_agg   ped_d ON ped_d.city_id = c.id AND ped_d.commodity_id = cm.id
LEFT JOIN active_pairs   pair  ON pair.commodity_a_id = cm.id
LEFT JOIN pedagang_agg   ped_p ON ped_p.city_id = c.id AND ped_p.commodity_id = pair.commodity_b_id
                               AND ped_d.price IS NULL
LEFT JOIN monthly_vol    mv    ON mv.city_id     = c.id AND mv.commodity_id    = cm.id
WHERE sp.price IS NOT NULL OR ped_d.price IS NOT NULL OR ped_p.price IS NOT NULL;
