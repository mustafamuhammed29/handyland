-- ============================================================
-- 011_least_privilege_rls_policies.sql
-- HandyLand: Comprehensive Least-Privilege RLS Policy Hardening
-- ============================================================

-- Helper: Ensure is_admin() function exists and is secure
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── 1. PRODUCT IMEIS (Sensitive inventory — Admin & Service Role only) ──
DROP POLICY IF EXISTS "Admins only: product imeis" ON public.product_imeis;
CREATE POLICY "Admins only: product imeis"
  ON public.product_imeis FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 2. ORDER STATUS HISTORY (Users view own order history, Admin writes) ──
DROP POLICY IF EXISTS "Users view own order status history" ON public.order_status_history;
CREATE POLICY "Users view own order status history"
  ON public.order_status_history FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins manage order status history" ON public.order_status_history;
CREATE POLICY "Admins manage order status history"
  ON public.order_status_history FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 3. REFUND REQUEST ITEMS (Scoped to parent refund request & owner) ──
DROP POLICY IF EXISTS "Users view own refund items" ON public.refund_request_items;
CREATE POLICY "Users view own refund items"
  ON public.refund_request_items FOR SELECT
  USING (
    refund_request_id IN (
      SELECT id FROM public.refund_requests WHERE user_id = auth.uid()
    )
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users create own refund items" ON public.refund_request_items;
CREATE POLICY "Users create own refund items"
  ON public.refund_request_items FOR INSERT
  WITH CHECK (
    refund_request_id IN (
      SELECT id FROM public.refund_requests WHERE user_id = auth.uid()
    )
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins manage refund items" ON public.refund_request_items;
CREATE POLICY "Admins manage refund items"
  ON public.refund_request_items FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 4. REPAIR TICKET TIMELINE (Viewable by ticket owner, writable by admin) ──
DROP POLICY IF EXISTS "Users view own ticket timeline" ON public.repair_ticket_timeline;
CREATE POLICY "Users view own ticket timeline"
  ON public.repair_ticket_timeline FOR SELECT
  USING (
    ticket_id IN (SELECT id FROM public.repair_tickets WHERE user_id = auth.uid())
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins manage repair timeline" ON public.repair_ticket_timeline;
CREATE POLICY "Admins manage repair timeline"
  ON public.repair_ticket_timeline FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 5. MESSAGE REPLIES (Scoped to parent message) ──
DROP POLICY IF EXISTS "Users view replies to their messages" ON public.message_replies;
CREATE POLICY "Users view replies to their messages"
  ON public.message_replies FOR SELECT
  USING (
    message_id IN (SELECT id FROM public.messages WHERE user_id = auth.uid())
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users insert replies to their messages" ON public.message_replies;
CREATE POLICY "Users insert replies to their messages"
  ON public.message_replies FOR INSERT
  WITH CHECK (
    message_id IN (SELECT id FROM public.messages WHERE user_id = auth.uid())
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins manage all message replies" ON public.message_replies;
CREATE POLICY "Admins manage all message replies"
  ON public.message_replies FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 6. COUPON USAGES (Scoped to user, validated on insert) ──
DROP POLICY IF EXISTS "Users view own coupon usages" ON public.coupon_usages;
CREATE POLICY "Users view own coupon usages"
  ON public.coupon_usages FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users insert own coupon usages" ON public.coupon_usages;
CREATE POLICY "Users insert own coupon usages"
  ON public.coupon_usages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins manage coupon usages" ON public.coupon_usages;
CREATE POLICY "Admins manage coupon usages"
  ON public.coupon_usages FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 7. SAVED VALUATIONS (User read own, admin full access) ──
DROP POLICY IF EXISTS "Users view own saved valuations" ON public.saved_valuations;
CREATE POLICY "Users view own saved valuations"
  ON public.saved_valuations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users create saved valuations" ON public.saved_valuations;
CREATE POLICY "Users create saved valuations"
  ON public.saved_valuations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins manage saved valuations" ON public.saved_valuations;
CREATE POLICY "Admins manage saved valuations"
  ON public.saved_valuations FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 8. PURCHASE ORDERS & ITEMS (Admin & Service Role only) ──
DROP POLICY IF EXISTS "Admins only: purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins only: purchase orders"
  ON public.purchase_orders FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins only: purchase order items" ON public.purchase_order_items;
CREATE POLICY "Admins only: purchase order items"
  ON public.purchase_order_items FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 9. SUPPLIERS & STOCK HISTORY (Admin & Service Role only) ──
DROP POLICY IF EXISTS "Admins only: suppliers" ON public.suppliers;
CREATE POLICY "Admins only: suppliers"
  ON public.suppliers FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins only: stock history" ON public.stock_history;
CREATE POLICY "Admins only: stock history"
  ON public.stock_history FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ── 10. AUDIT LOGS (Admin & Service Role only) ──
DROP POLICY IF EXISTS "Admins only: audit logs" ON public.audit_logs;
CREATE POLICY "Admins only: audit logs"
  ON public.audit_logs FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');
