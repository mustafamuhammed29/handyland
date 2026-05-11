-- ============================================================
-- HandyLand: Inventory Optimizations
-- ============================================================

-- Function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY SELECT * FROM products WHERE stock <= min_stock;
END;
$$ LANGUAGE plpgsql;

-- Function to get low stock accessories
CREATE OR REPLACE FUNCTION get_low_stock_accessories()
RETURNS SETOF accessories AS $$
BEGIN
    RETURN QUERY SELECT * FROM accessories WHERE stock <= min_stock;
END;
$$ LANGUAGE plpgsql;
