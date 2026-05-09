-- ============================================================
-- HandyLand: Performance Indexes
-- ============================================================

-- USERS
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- PRODUCTS
CREATE INDEX idx_products_category ON public.products(category, is_active);
CREATE INDEX idx_products_brand ON public.products(brand, condition);
CREATE INDEX idx_products_stock ON public.products(stock);
CREATE INDEX idx_products_created ON public.products(created_at DESC);
CREATE INDEX idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(model,'') || ' ' || COALESCE(brand,'')));

-- ACCESSORIES
CREATE INDEX idx_accessories_category ON public.accessories(category, is_active);
CREATE INDEX idx_accessories_created ON public.accessories(created_at DESC);

-- ORDERS
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- ORDER ITEMS
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- TRANSACTIONS
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_stripe ON public.transactions(stripe_customer_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- REFUNDS
CREATE INDEX idx_refunds_order ON public.refund_requests(order_id);
CREATE INDEX idx_refunds_status ON public.refund_requests(status);
CREATE INDEX idx_refunds_user ON public.refund_requests(user_id);

-- REPAIR TICKETS
CREATE INDEX idx_tickets_status ON public.repair_tickets(status, created_at DESC);
CREATE INDEX idx_tickets_user ON public.repair_tickets(user_id, created_at DESC);

-- MESSAGES
CREATE INDEX idx_messages_status ON public.messages(status, is_archived, created_at DESC);
CREATE INDEX idx_messages_user ON public.messages(user_id, created_at DESC);
CREATE INDEX idx_messages_email ON public.messages(email);

-- NOTIFICATIONS
CREATE INDEX idx_notifs_user ON public.notifications(user_id, read, created_at DESC);

-- SAVED VALUATIONS
CREATE INDEX idx_saved_val_user ON public.saved_valuations(user_id, created_at DESC);
CREATE INDEX idx_saved_val_status ON public.saved_valuations(status);

-- STOCK HISTORY
CREATE INDEX idx_stock_item ON public.stock_history(item_id);
CREATE INDEX idx_stock_created ON public.stock_history(created_at DESC);

-- COUPONS
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active, valid_until);

-- AUDIT LOGS
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_resource ON public.audit_logs(resource, resource_id);

-- TRANSLATIONS
CREATE INDEX idx_translations_key ON public.translations(key, language);
CREATE INDEX idx_translations_ns ON public.translations(namespace, language);

-- DEVICE BLUEPRINTS
CREATE INDEX idx_blueprints_brand ON public.device_blueprints(brand, active);

-- CART ITEMS
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

-- WISHLIST
CREATE INDEX idx_wishlist_user ON public.wishlists(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_accessories_updated_at BEFORE UPDATE ON public.accessories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.repair_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_warranties_updated_at BEFORE UPDATE ON public.warranties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_valuations_updated_at BEFORE UPDATE ON public.valuations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_saved_val_updated_at BEFORE UPDATE ON public.saved_valuations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_po_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_email_tmpl_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_blueprints_updated_at BEFORE UPDATE ON public.device_blueprints FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, provider, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'local')::user_provider,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Notifications TTL cleanup (90 days) - via pg_cron if available
-- Otherwise handled in application layer
-- ============================================================
-- SELECT cron.schedule('delete-old-notifications', '0 3 * * *',
--   'DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL ''90 days''');
