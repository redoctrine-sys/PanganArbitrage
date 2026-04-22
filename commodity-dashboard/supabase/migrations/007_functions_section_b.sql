-- 007_functions_section_b.sql
-- RPC functions untuk Section B (komoditas eksklusif)

CREATE OR REPLACE FUNCTION get_sp2kp_only_commodities()
RETURNS TABLE(commodity_id uuid, commodity_name text, city_count bigint) AS $$
  SELECT cm.id, cm.name, COUNT(DISTINCT pr.city_id)
  FROM commodities cm
  JOIN prices_raw pr ON pr.commodity_id = cm.id
    AND pr.source = 'sp2kp' AND pr.city_id IS NOT NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM pedagang_harga ph WHERE ph.commodity_id = cm.id
  ) AND NOT EXISTS (
    SELECT 1 FROM commodity_pairs cp
    WHERE (cp.commodity_a_id = cm.id OR cp.commodity_b_id = cm.id)
      AND cp.approved_at IS NOT NULL
  )
  GROUP BY cm.id, cm.name;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_pedagang_only_commodities()
RETURNS TABLE(commodity_id uuid, commodity_name text, pedagang_count bigint) AS $$
  SELECT cm.id, cm.name, COUNT(DISTINCT ph.pedagang_id)
  FROM commodities cm
  JOIN pedagang_harga ph ON ph.commodity_id = cm.id
  WHERE NOT EXISTS (
    SELECT 1 FROM prices_raw pr
    WHERE pr.commodity_id = cm.id AND pr.source = 'sp2kp' AND pr.city_id IS NOT NULL
  ) AND NOT EXISTS (
    SELECT 1 FROM commodity_pairs cp
    WHERE (cp.commodity_a_id = cm.id OR cp.commodity_b_id = cm.id)
      AND cp.approved_at IS NOT NULL
  )
  GROUP BY cm.id, cm.name;
$$ LANGUAGE SQL STABLE;
