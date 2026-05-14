-- ============================================================
-- HandyLand: Atomic Stock & Coupon Functions
-- Fixes: Race condition in stock deduction, missing coupon RPCs
-- ============================================================

-- 1. Atomic stock decrement — prevents race condition / overselling
-- Returns TRUE if stock was successfully decremented, FALSE if insufficient
CREATE OR REPLACE FUNCTION atomic_decrement_stock(
    p_table TEXT,
    p_id UUID,
    p_qty INT
) RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    IF p_table = 'products' THEN
        UPDATE products SET stock = stock - p_qty
        WHERE id = p_id AND stock >= p_qty;
    ELSIF p_table = 'accessories' THEN
        UPDATE accessories SET stock = stock - p_qty
        WHERE id = p_id AND stock >= p_qty;
    ELSE
        RETURN FALSE;
    END IF;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 2. Increment coupon usage counter (called from createOrder)
-- NOTE: This function was already being called in the codebase but was never defined!
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons SET used_count = used_count + 1
    WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;

-- 3. Decrement coupon usage counter (called from cancelOrder)
-- Uses GREATEST to prevent negative counts
CREATE OR REPLACE FUNCTION decrement_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons SET used_count = GREATEST(0, used_count - 1)
    WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;
