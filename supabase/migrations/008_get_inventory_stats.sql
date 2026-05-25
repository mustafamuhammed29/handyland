-- ============================================================
-- HandyLand: High-Performance Inventory Analytics
-- Implements single-pass database-side aggregations for stats
-- ============================================================

CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS json AS $$
DECLARE
    result json;
    v_total_stock NUMERIC;
    v_total_value NUMERIC;
    v_low_stock_count INT;
    v_out_of_stock_count INT;
    v_total_items_sold INT;
    v_total_revenue NUMERIC;
BEGIN
    -- 1. Aggregate inventory (Products, Accessories, Repair Parts)
    SELECT 
        COALESCE(SUM(stock), 0),
        COALESCE(SUM(stock * price), 0),
        COALESCE(COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0), 0),
        COALESCE(COUNT(*) FILTER (WHERE stock = 0), 0)
    INTO 
        v_total_stock,
        v_total_value,
        v_low_stock_count,
        v_out_of_stock_count
    FROM (
        SELECT stock, price, COALESCE(min_stock, 2) AS min_stock FROM public.products
        UNION ALL
        SELECT stock, price, COALESCE(min_stock, 5) AS min_stock FROM public.accessories
        UNION ALL
        SELECT stock, sell_price AS price, COALESCE(min_stock, 2) AS min_stock FROM public.repair_parts
    ) combined;

    -- 2. Aggregate sales stats (Delivered Orders)
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(total_amount), 0)
    INTO 
        v_total_items_sold,
        v_total_revenue
    FROM public.orders
    WHERE status = 'delivered';

    -- 3. Return combined stats as a JSON object
    SELECT json_build_object(
        'totalStock', v_total_stock,
        'totalValue', v_total_value,
        'lowStockCount', v_low_stock_count,
        'outOfStockCount', v_out_of_stock_count,
        'totalItemsSold', v_total_items_sold,
        'totalRevenue', v_total_revenue
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
