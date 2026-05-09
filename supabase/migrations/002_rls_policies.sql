-- ============================================================
-- HandyLand: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_imeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_ticket_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loaner_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: is_admin() function
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- USERS policies
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE USING (public.is_admin());

CREATE POLICY "Service role full access to users"
  ON public.users FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- ADDRESSES policies
-- ============================================================
CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all addresses"
  ON public.addresses FOR ALL USING (public.is_admin());

-- ============================================================
-- PRODUCTS policies (public read, admin write)
-- ============================================================
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access products"
  ON public.products FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access products"
  ON public.products FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- ACCESSORIES policies
-- ============================================================
CREATE POLICY "Anyone can view active accessories"
  ON public.accessories FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access accessories"
  ON public.accessories FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access accessories"
  ON public.accessories FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- DEVICE BLUEPRINTS (public read for valuation tool)
-- ============================================================
CREATE POLICY "Anyone can view active blueprints"
  ON public.device_blueprints FOR SELECT USING (active = true);

CREATE POLICY "Admins full access blueprints"
  ON public.device_blueprints FOR ALL USING (public.is_admin());

-- ============================================================
-- COUPONS
-- ============================================================
CREATE POLICY "Authenticated users can read active coupons"
  ON public.coupons FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access coupons"
  ON public.coupons FOR ALL USING (public.is_admin());

-- ============================================================
-- PROMOTIONS (public read)
-- ============================================================
CREATE POLICY "Anyone can view promotions"
  ON public.promotions FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access promotions"
  ON public.promotions FOR ALL USING (public.is_admin());

-- ============================================================
-- SHIPPING METHODS (public read)
-- ============================================================
CREATE POLICY "Anyone can view shipping methods"
  ON public.shipping_methods FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access shipping"
  ON public.shipping_methods FOR ALL USING (public.is_admin());

-- ============================================================
-- CART policies
-- ============================================================
CREATE POLICY "Users manage own cart"
  ON public.carts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own cart items"
  ON public.cart_items FOR ALL USING (
    cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins full access carts"
  ON public.carts FOR ALL USING (public.is_admin());

-- ============================================================
-- WISHLIST policies
-- ============================================================
CREATE POLICY "Users manage own wishlist"
  ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ORDERS policies
-- ============================================================
CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access orders"
  ON public.orders FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access orders"
  ON public.orders FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users view own order items"
  ON public.order_items FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins full access order items"
  ON public.order_items FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access order items"
  ON public.order_items FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TRANSACTIONS policies
-- ============================================================
CREATE POLICY "Users view own transactions"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins full access transactions"
  ON public.transactions FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access transactions"
  ON public.transactions FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- REFUNDS policies
-- ============================================================
CREATE POLICY "Users view own refunds"
  ON public.refund_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own refunds"
  ON public.refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access refunds"
  ON public.refund_requests FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access refunds"
  ON public.refund_requests FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- REPAIR TICKETS policies
-- ============================================================
CREATE POLICY "Users view own tickets"
  ON public.repair_tickets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create tickets"
  ON public.repair_tickets FOR INSERT WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL
  );

CREATE POLICY "Admins full access tickets"
  ON public.repair_tickets FOR ALL USING (public.is_admin());

CREATE POLICY "Service role full access tickets"
  ON public.repair_tickets FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- MESSAGES policies
-- ============================================================
CREATE POLICY "Users view own messages"
  ON public.messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create message"
  ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access messages"
  ON public.messages FOR ALL USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access notifications"
  ON public.notifications FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins full access notifications"
  ON public.notifications FOR ALL USING (public.is_admin());

-- ============================================================
-- VALUATIONS policies
-- ============================================================
CREATE POLICY "Users manage own valuations"
  ON public.valuations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins full access valuations"
  ON public.valuations FOR ALL USING (public.is_admin());

-- ============================================================
-- SAVED VALUATIONS policies
-- ============================================================
CREATE POLICY "Users view own saved valuations"
  ON public.saved_valuations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create saved valuation"
  ON public.saved_valuations FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access saved valuations"
  ON public.saved_valuations FOR ALL USING (public.is_admin());

-- ============================================================
-- PAGES (public read published)
-- ============================================================
CREATE POLICY "Anyone can view published pages"
  ON public.pages FOR SELECT USING (is_published = true);

CREATE POLICY "Admins full access pages"
  ON public.pages FOR ALL USING (public.is_admin());

-- ============================================================
-- TRANSLATIONS (public read)
-- ============================================================
CREATE POLICY "Anyone can read translations"
  ON public.translations FOR SELECT USING (true);

CREATE POLICY "Admins full access translations"
  ON public.translations FOR ALL USING (public.is_admin());

-- ============================================================
-- QUESTIONS / FAQ (public read published)
-- ============================================================
CREATE POLICY "Anyone can view published questions"
  ON public.questions FOR SELECT USING (is_published = true);

CREATE POLICY "Admins full access questions"
  ON public.questions FOR ALL USING (public.is_admin());

-- ============================================================
-- ADMIN-ONLY tables (full admin/service_role access only)
-- ============================================================
CREATE POLICY "Admins only: repair parts"
  ON public.repair_parts FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: loaner phones"
  ON public.loaner_phones FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: warranties"
  ON public.warranties FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: stock history"
  ON public.stock_history FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: purchase orders"
  ON public.purchase_orders FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: purchase order items"
  ON public.purchase_order_items FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: suppliers"
  ON public.suppliers FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: email templates"
  ON public.email_templates FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: settings"
  ON public.settings FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admins only: audit logs"
  ON public.audit_logs FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT USING (is_approved = true);

CREATE POLICY "Users create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access reviews"
  ON public.reviews FOR ALL USING (public.is_admin());
