-- ============================================================
-- HandyLand: Initial Seed Data
-- Run AFTER creating admin user via Supabase Auth UI
-- ============================================================

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================
INSERT INTO public.settings (key, value, "group") VALUES
('store_name',          '"HandyLand"',                          'general'),
('store_email',         '"info@handyland.de"',                  'general'),
('store_phone',         '"+49 123 456789"',                     'general'),
('store_address',       '"Musterstraße 1, 12345 Berlin"',       'general'),
('currency',            '"EUR"',                                'general'),
('currency_symbol',     '"€"',                                  'general'),
('vat_rate',            '19',                                   'general'),
('require_email_verify','true',                                 'auth'),
('maintenance_mode',    'false',                                'system'),
('loyalty_points_rate', '1',                                    'loyalty'),
('points_per_euro',     '10',                                   'loyalty'),
('cart_recovery_hours', '24',                                   'cart');

-- ============================================================
-- DEFAULT SHIPPING METHODS
-- ============================================================
INSERT INTO public.shipping_methods (name, description, price, estimated_days, is_active) VALUES
('Standard', 'DHL Standard Versand (3-5 Werktage)', 4.99, 5, true),
('Express',  'DHL Express Versand (1-2 Werktage)',  9.99, 2, true),
('Pickup',   'Abholung im Geschäft',                0.00, 0, true);

-- ============================================================
-- DEFAULT EMAIL TEMPLATES
-- ============================================================
INSERT INTO public.email_templates (name, subject, body_html, variables, is_active) VALUES
('order_confirmation',
 'Bestellbestätigung #{{orderNumber}} - HandyLand',
 '<h1>Vielen Dank für Ihre Bestellung!</h1><p>Hallo {{name}},</p><p>Ihre Bestellung <strong>#{{orderNumber}}</strong> wurde erfolgreich aufgenommen.</p>',
 ARRAY['name','orderNumber','totalAmount'],
 true),
('order_shipped',
 'Ihre Bestellung #{{orderNumber}} wurde versendet',
 '<h1>Ihre Bestellung ist unterwegs!</h1><p>Tracking: {{trackingNumber}}</p>',
 ARRAY['name','orderNumber','trackingNumber'],
 true),
('repair_update',
 'Reparatur-Update: Ticket {{ticketId}}',
 '<h1>Update zu Ihrer Reparatur</h1><p>Status: {{status}}</p>',
 ARRAY['name','ticketId','status'],
 true),
('welcome',
 'Willkommen bei HandyLand!',
 '<h1>Willkommen bei HandyLand!</h1><p>Hallo {{name}}, schön dass Sie dabei sind.</p>',
 ARRAY['name'],
 true),
('password_reset',
 'Passwort zurücksetzen - HandyLand',
 '<h1>Passwort zurücksetzen</h1><p>Klicken Sie auf den Link: <a href="{{resetUrl}}">Passwort zurücksetzen</a></p>',
 ARRAY['name','resetUrl'],
 true);

-- ============================================================
-- DEFAULT FAQ QUESTIONS
-- ============================================================
INSERT INTO public.questions (question, answer, category, is_published, sort_order) VALUES
('Wie lange dauert eine Reparatur?', 'Die meisten Reparaturen werden am selben Tag durchgeführt.', 'repair', true, 1),
('Welche Garantie erhalte ich?', 'Auf alle Reparaturen geben wir 90 Tage Garantie.', 'warranty', true, 2),
('Welche Zahlungsmethoden akzeptieren Sie?', 'Wir akzeptieren Kreditkarte, PayPal, SEPA-Lastschrift und Barzahlung.', 'payment', true, 3),
('Wie kann ich meine Bestellung verfolgen?', 'Nach dem Versand erhalten Sie eine E-Mail mit der Tracking-Nummer.', 'orders', true, 4);
