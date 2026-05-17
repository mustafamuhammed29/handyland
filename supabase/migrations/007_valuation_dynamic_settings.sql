-- migration 007: Dynamic Valuation Categories & Brands

-- 1. Create valuation_categories table
CREATE TABLE IF NOT EXISTS public.valuation_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    emoji TEXT,
    icon_name TEXT,
    color TEXT DEFAULT 'blue',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create valuation_brands table
CREATE TABLE IF NOT EXISTS public.valuation_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.valuation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_brands ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Allow public read access for valuation_categories" ON public.valuation_categories;
CREATE POLICY "Allow public read access for valuation_categories" ON public.valuation_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access for valuation_brands" ON public.valuation_brands;
CREATE POLICY "Allow public read access for valuation_brands" ON public.valuation_brands FOR SELECT USING (true);

-- Admin full access (using the users table in public schema)
DROP POLICY IF EXISTS "Allow admin full access for valuation_categories" ON public.valuation_categories;
CREATE POLICY "Allow admin full access for valuation_categories" ON public.valuation_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Allow admin full access for valuation_brands" ON public.valuation_brands;
CREATE POLICY "Allow admin full access for valuation_brands" ON public.valuation_brands FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Seed initial categories
INSERT INTO public.valuation_categories (name, label, emoji, icon_name, color, display_order)
VALUES 
    ('Smartphone',  'Smartphones',    '📱', 'Smartphone', 'blue', 10),
    ('Tablet',      'Tablets',         '⬛', 'Tablet',     'purple', 20),
    ('Laptop',      'Laptops',         '💻', 'Laptop',     'indigo', 30),
    ('Gaming',      'Spielekonsolen',  '🎮', 'Gamepad2',   'red', 40),
    ('Smartwatch',  'Smartwatches',    '⌚', 'Watch',      'emerald', 50),
    ('Audio',       'Audio & Kopfhörer','🎧', 'Headphones', 'amber', 60)
ON CONFLICT (name) DO NOTHING;

-- 6. Seed initial brand logos
INSERT INTO public.valuation_brands (name, logo_url)
VALUES 
    ('Apple',     'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'),
    ('Samsung',   'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg'),
    ('Google',    'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'),
    ('Xiaomi',    'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg'),
    ('Sony',      'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg'),
    ('OPPO',      'https://upload.wikimedia.org/wikipedia/commons/8/88/Oppo_logo.png'),
    ('OnePlus',   'https://upload.wikimedia.org/wikipedia/commons/8/87/OnePlus_Logo.svg'),
    ('Dell',      'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg'),
    ('Lenovo',    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg'),
    ('HP',        'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg'),
    ('Microsoft', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg'),
    ('Nintendo',  'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg'),
    ('Garmin',    'https://upload.wikimedia.org/wikipedia/commons/2/20/Garmin_Logo_2006.svg'),
    ('Bose',      'https://upload.wikimedia.org/wikipedia/commons/d/db/Bose_wordmark.svg')
ON CONFLICT (name) DO NOTHING;
