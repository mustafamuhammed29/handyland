/**
 * ============================================================================
 * Handyland Repair Parts Warehouse - Realistic Seed Script
 * File: backend/scripts/seed_warehouse_fake_data.js
 * ============================================================================
 * 
 * Description:
 * Generates a comprehensive, realistic catalog of internal repair parts
 * spanning iPhone 5 all the way to iPhone 17 Pro Max, including:
 *   - Screens (Original Service Pack & Premium Compatible)
 *   - Batteries (OEM & High-Capacity Compatible)
 *   - Back Glass (OEM & Compatible Big-Hole)
 *   - Cameras (Rear & Front modules)
 *   - Charging Ports / Dock Flex
 *   - Speakers & Earpieces
 *   - Power & Volume Flex Cables
 *   - Waterproof Display Adhesives & Consumables
 *
 * Warehouse Architecture Adherence:
 * 1. Physical Locations: Populates 8 structured warehouse zones/bins.
 * 2. Parts Catalog: Inserts canonical `public.repair_parts` with stock = 0,
 *    immutable SKUs, structured categories, brands, and device families.
 * 3. Atomic Stock Movements: Generates realistic initial stock balances exclusively
 *    via the `apply_part_stock_movement` RPC (RECEIVE movement type) to populate
 *    both `part_stock_locations` balances and the append-only `part_stock_movements` ledger.
 *
 * How to Run:
 *   cd backend
 *   node scripts/seed_warehouse_fake_data.js
 *
 * Environment Requirements:
 *   SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   defined in `backend/.env`.
 * ============================================================================
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

// ── 1. Initialize Supabase Admin Client ─────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ── 2. Warehouse Physical Locations Definition ─────────────────────────────
const WAREHOUSE_LOCATIONS = [
    {
        location_code: 'ZONE-A-01',
        zone: 'ZONE-A',
        rack: 'R-01',
        shelf: 'S-01',
        bin: 'B-01',
        description: 'المنطقة أ - رف الشاشات الأصلية (Original Service Pack OLED/LCD)',
        is_active: true
    },
    {
        location_code: 'ZONE-A-02',
        zone: 'ZONE-A',
        rack: 'R-01',
        shelf: 'S-02',
        bin: 'B-02',
        description: 'المنطقة أ - رف الشاشات المتوافقة والبديلة (Incell/Hard OLED)',
        is_active: true
    },
    {
        location_code: 'ZONE-B-01',
        zone: 'ZONE-B',
        rack: 'R-02',
        shelf: 'S-01',
        bin: 'B-01',
        description: 'المنطقة ب - قسم البطاريات الأصلية وتخزين الطاقة الآمن مع شريحة TI',
        is_active: true
    },
    {
        location_code: 'ZONE-B-02',
        zone: 'ZONE-B',
        rack: 'R-02',
        shelf: 'S-02',
        bin: 'B-02',
        description: 'المنطقة ب - قسم البطاريات عالية السعة والتجارية (High Capacity)',
        is_active: true
    },
    {
        location_code: 'ZONE-C-01',
        zone: 'ZONE-C',
        rack: 'R-03',
        shelf: 'S-01',
        bin: 'B-01',
        description: 'المنطقة ج - وحدات الكاميرات والمستشعرات الدقيقة (Rear/Front Sensors)',
        is_active: true
    },
    {
        location_code: 'ZONE-C-02',
        zone: 'ZONE-C',
        rack: 'R-03',
        shelf: 'S-02',
        bin: 'B-02',
        description: 'المنطقة ج - فلكسات الشحن، مداخل Lightning/USB-C، ومكبرات الصوت',
        is_active: true
    },
    {
        location_code: 'ZONE-D-01',
        zone: 'ZONE-D',
        rack: 'R-04',
        shelf: 'S-01',
        bin: 'B-01',
        description: 'المنطقة د - الزجاج الخلفي، الأغطية الخارجية، والشاسيه المعدني',
        is_active: true
    },
    {
        location_code: 'ZONE-D-02',
        zone: 'ZONE-D',
        rack: 'R-04',
        shelf: 'S-02',
        bin: 'B-02',
        description: 'المنطقة د - المستهلكات، اللواصق المقاومة للماء، والقطع التثبيتية',
        is_active: true
    }
];

// ── 3. iPhone Models (iPhone 5 to iPhone 17 Pro Max) ─────────────────────────
const IPHONE_MODELS = [
    // Legacy Generation (iPhone 5 - iPhone 8)
    { code: 'IP5', name: 'iPhone 5', arabicName: 'آيفون 5', family: 'iPhone 5 Series', era: 'legacy' },
    { code: 'IP5C', name: 'iPhone 5c', arabicName: 'آيفون 5c', family: 'iPhone 5 Series', era: 'legacy' },
    { code: 'IP5S', name: 'iPhone 5s', arabicName: 'آيفون 5s', family: 'iPhone 5 Series', era: 'legacy' },
    { code: 'IP6', name: 'iPhone 6', arabicName: 'آيفون 6', family: 'iPhone 6 Series', era: 'legacy' },
    { code: 'IP6P', name: 'iPhone 6 Plus', arabicName: 'آيفون 6 بلس', family: 'iPhone 6 Series', era: 'legacy' },
    { code: 'IP6S', name: 'iPhone 6s', arabicName: 'آيفون 6s', family: 'iPhone 6s Series', era: 'legacy' },
    { code: 'IP6SP', name: 'iPhone 6s Plus', arabicName: 'آيفون 6s بلس', family: 'iPhone 6s Series', era: 'legacy' },
    { code: 'IPSE1', name: 'iPhone SE (1st Gen)', arabicName: 'آيفون SE الجيل الأول', family: 'iPhone SE Series', era: 'legacy' },
    { code: 'IP7', name: 'iPhone 7', arabicName: 'آيفون 7', family: 'iPhone 7 Series', era: 'legacy' },
    { code: 'IP7P', name: 'iPhone 7 Plus', arabicName: 'آيفون 7 بلس', family: 'iPhone 7 Series', era: 'legacy' },
    { code: 'IP8', name: 'iPhone 8', arabicName: 'آيفون 8', family: 'iPhone 8 Series', era: 'legacy' },
    { code: 'IP8P', name: 'iPhone 8 Plus', arabicName: 'آيفون 8 بلس', family: 'iPhone 8 Series', era: 'legacy' },

    // All-Screen & Face ID Era (iPhone X - iPhone 11)
    { code: 'IPX', name: 'iPhone X', arabicName: 'آيفون X', family: 'iPhone X Series', era: 'oled_notch' },
    { code: 'IPXR', name: 'iPhone XR', arabicName: 'آيفون XR', family: 'iPhone X Series', era: 'lcd_notch' },
    { code: 'IPXS', name: 'iPhone XS', arabicName: 'آيفون XS', family: 'iPhone X Series', era: 'oled_notch' },
    { code: 'IPXSM', name: 'iPhone XS Max', arabicName: 'آيفون XS ماكس', family: 'iPhone X Series', era: 'oled_notch' },
    { code: 'IP11', name: 'iPhone 11', arabicName: 'آيفون 11', family: 'iPhone 11 Series', era: 'lcd_notch' },
    { code: 'IP11P', name: 'iPhone 11 Pro', arabicName: 'آيفون 11 برو', family: 'iPhone 11 Series', era: 'oled_notch' },
    { code: 'IP11PM', name: 'iPhone 11 Pro Max', arabicName: 'آيفون 11 برو ماكس', family: 'iPhone 11 Series', era: 'oled_notch' },
    { code: 'IPSE2', name: 'iPhone SE (2nd Gen)', arabicName: 'آيفون SE الجيل الثاني', family: 'iPhone SE Series', era: 'legacy' },

    // Ceramic Shield & Flat Edge Era (iPhone 12 - iPhone 14)
    { code: 'IP12M', name: 'iPhone 12 mini', arabicName: 'آيفون 12 ميني', family: 'iPhone 12 Series', era: 'flat_oled' },
    { code: 'IP12', name: 'iPhone 12', arabicName: 'آيفون 12', family: 'iPhone 12 Series', era: 'flat_oled' },
    { code: 'IP12P', name: 'iPhone 12 Pro', arabicName: 'آيفون 12 برو', family: 'iPhone 12 Series', era: 'flat_oled' },
    { code: 'IP12PM', name: 'iPhone 12 Pro Max', arabicName: 'آيفون 12 برو ماكس', family: 'iPhone 12 Series', era: 'flat_oled' },
    { code: 'IP13M', name: 'iPhone 13 mini', arabicName: 'آيفون 13 ميني', family: 'iPhone 13 Series', era: 'flat_oled' },
    { code: 'IP13', name: 'iPhone 13', arabicName: 'آيفون 13', family: 'iPhone 13 Series', era: 'flat_oled' },
    { code: 'IP13P', name: 'iPhone 13 Pro', arabicName: 'آيفون 13 برو', family: 'iPhone 13 Series', era: 'flat_oled_120hz' },
    { code: 'IP13PM', name: 'iPhone 13 Pro Max', arabicName: 'آيفون 13 برو ماكس', family: 'iPhone 13 Series', era: 'flat_oled_120hz' },
    { code: 'IPSE3', name: 'iPhone SE (3rd Gen)', arabicName: 'آيفون SE الجيل الثالث', family: 'iPhone SE Series', era: 'legacy' },
    { code: 'IP14', name: 'iPhone 14', arabicName: 'آيفون 14', family: 'iPhone 14 Series', era: 'flat_oled' },
    { code: 'IP14PLS', name: 'iPhone 14 Plus', arabicName: 'آيفون 14 بلس', family: 'iPhone 14 Series', era: 'flat_oled' },
    { code: 'IP14P', name: 'iPhone 14 Pro', arabicName: 'آيفون 14 برو', family: 'iPhone 14 Series', era: 'dynamic_island' },
    { code: 'IP14PM', name: 'iPhone 14 Pro Max', arabicName: 'آيفون 14 برو ماكس', family: 'iPhone 14 Series', era: 'dynamic_island' },

    // USB-C, Dynamic Island & Titanium Era (iPhone 15 - iPhone 17)
    { code: 'IP15', name: 'iPhone 15', arabicName: 'آيفون 15', family: 'iPhone 15 Series', era: 'dynamic_island' },
    { code: 'IP15PLS', name: 'iPhone 15 Plus', arabicName: 'آيفون 15 بلس', family: 'iPhone 15 Series', era: 'dynamic_island' },
    { code: 'IP15P', name: 'iPhone 15 Pro', arabicName: 'آيفون 15 برو', family: 'iPhone 15 Series', era: 'dynamic_island' },
    { code: 'IP15PM', name: 'iPhone 15 Pro Max', arabicName: 'آيفون 15 برو ماكس', family: 'iPhone 15 Series', era: 'dynamic_island' },
    { code: 'IP16', name: 'iPhone 16', arabicName: 'آيفون 16', family: 'iPhone 16 Series', era: 'dynamic_island' },
    { code: 'IP16PLS', name: 'iPhone 16 Plus', arabicName: 'آيفون 16 بلس', family: 'iPhone 16 Series', era: 'dynamic_island' },
    { code: 'IP16P', name: 'iPhone 16 Pro', arabicName: 'آيفون 16 برو', family: 'iPhone 16 Series', era: 'dynamic_island' },
    { code: 'IP16PM', name: 'iPhone 16 Pro Max', arabicName: 'آيفون 16 برو ماكس', family: 'iPhone 16 Series', era: 'dynamic_island' },
    { code: 'IP17', name: 'iPhone 17', arabicName: 'آيفون 17', family: 'iPhone 17 Series', era: 'dynamic_island' },
    { code: 'IP17AIR', name: 'iPhone 17 Air', arabicName: 'آيفون 17 إير', family: 'iPhone 17 Series', era: 'dynamic_island' },
    { code: 'IP17P', name: 'iPhone 17 Pro', arabicName: 'آيفون 17 برو', family: 'iPhone 17 Series', era: 'dynamic_island' },
    { code: 'IP17PM', name: 'iPhone 17 Pro Max', arabicName: 'آيفون 17 برو ماكس', family: 'iPhone 17 Series', era: 'dynamic_island' }
];

// ── 4. Part Templates Generator ─────────────────────────────────────────────
function buildPartTemplates(model) {
    const isLegacy = model.era === 'legacy';
    const isLcd = model.era === 'legacy' || model.era === 'lcd_notch';
    const isUsbC = ['IP15', 'IP15PLS', 'IP15P', 'IP15PM', 'IP16', 'IP16PLS', 'IP16P', 'IP16PM', 'IP17', 'IP17AIR', 'IP17P', 'IP17PM'].includes(model.code);

    const templates = [
        // 1. Screen OEM
        {
            name: `شاشة ${model.arabicName} أصلية (${isLcd ? 'Original Retina LCD' : 'Original Service Pack OLED'})`,
            sku: `${model.code}-SCR-OEM`,
            barcode: `880${model.code}001`,
            category: 'Screens',
            part_type: 'screen',
            quality: 'OEM Original',
            min_stock: 4,
            locationCode: 'ZONE-A-01',
            seedQty: isLegacy ? 8 : 22
        },
        // 2. Screen Compatible
        {
            name: `شاشة ${model.arabicName} درجة أولى (${isLcd ? 'Incell High-Color LCD' : 'Hard OLED Premium Compatible'})`,
            sku: `${model.code}-SCR-CMP`,
            barcode: `880${model.code}002`,
            category: 'Screens',
            part_type: 'screen',
            quality: 'High Quality Compatible',
            min_stock: 6,
            locationCode: 'ZONE-A-02',
            seedQty: isLegacy ? 12 : 35
        },
        // 3. Battery OEM
        {
            name: `بطارية ${model.arabicName} أصلية مع شريحة تحكم TI وحساس حرارة`,
            sku: `${model.code}-BAT-OEM`,
            barcode: `880${model.code}003`,
            category: 'Batteries',
            part_type: 'battery',
            quality: 'OEM Original',
            min_stock: 5,
            locationCode: 'ZONE-B-01',
            seedQty: isLegacy ? 15 : 30
        },
        // 4. Battery Compatible
        {
            name: `بطارية ${model.arabicName} عالية السعة (High Capacity 0 Cycle)`,
            sku: `${model.code}-BAT-CMP`,
            barcode: `880${model.code}004`,
            category: 'Batteries',
            part_type: 'battery',
            quality: 'High Quality Compatible',
            min_stock: 6,
            locationCode: 'ZONE-B-02',
            seedQty: isLegacy ? 20 : 45
        },
        // 5. Back Glass OEM (iPhone 8 onwards)
        ...(!['IP5', 'IP5C', 'IP5S', 'IP6', 'IP6P', 'IP6S', 'IP6SP', 'IPSE1', 'IP7', 'IP7P'].includes(model.code) ? [
            {
                name: `زجاج خلفي ${model.arabicName} أصلي مع عدسات الكاميرا`,
                sku: `${model.code}-GLS-OEM`,
                barcode: `880${model.code}005`,
                category: 'Back Glass & Housing',
                part_type: 'back_glass',
                quality: 'OEM Original',
                min_stock: 3,
                locationCode: 'ZONE-D-01',
                seedQty: 14
            },
            {
                name: `زجاج خلفي ${model.arabicName} فتحة كاميرا كبيرة لسهولة التركيب`,
                sku: `${model.code}-GLS-CMP`,
                barcode: `880${model.code}006`,
                category: 'Back Glass & Housing',
                part_type: 'back_glass',
                quality: 'High Quality Compatible',
                min_stock: 4,
                locationCode: 'ZONE-D-01',
                seedQty: 25
            }
        ] : []),
        // 6. Charging Port OEM
        {
            name: `فلكس مدخل الشحن والميكروفون ${model.arabicName} أصلي (${isUsbC ? 'USB-C Type' : 'Lightning'})`,
            sku: `${model.code}-CHG-OEM`,
            barcode: `880${model.code}007`,
            category: 'Charging Ports',
            part_type: 'charging_port',
            quality: 'OEM Original',
            min_stock: 4,
            locationCode: 'ZONE-C-02',
            seedQty: isLegacy ? 10 : 20
        },
        // 7. Charging Port Compatible
        {
            name: `فلكس مدخل الشحن ${model.arabicName} درجة أولى متوافق`,
            sku: `${model.code}-CHG-CMP`,
            barcode: `880${model.code}008`,
            category: 'Charging Ports',
            part_type: 'charging_port',
            quality: 'High Quality Compatible',
            min_stock: 4,
            locationCode: 'ZONE-C-02',
            seedQty: isLegacy ? 12 : 28
        },
        // 8. Rear Camera OEM
        {
            name: `وحدة الكاميرا الخلفية الرئيسية ${model.arabicName} أصلية (Original Dual/Triple Sensor)`,
            sku: `${model.code}-RCAM-OEM`,
            barcode: `880${model.code}009`,
            category: 'Cameras',
            part_type: 'camera',
            quality: 'OEM Original',
            min_stock: 2,
            locationCode: 'ZONE-C-01',
            seedQty: isLegacy ? 6 : 14
        },
        // 9. Front Camera & Sensor Flex OEM
        {
            name: `فلكس الكاميرا الأمامية وحساس القرب والضوء ${model.arabicName} أصلي`,
            sku: `${model.code}-FCAM-OEM`,
            barcode: `880${model.code}010`,
            category: 'Cameras',
            part_type: 'camera',
            quality: 'OEM Original',
            min_stock: 3,
            locationCode: 'ZONE-C-01',
            seedQty: isLegacy ? 8 : 18
        },
        // 10. Earpiece Speaker / Loudspeaker
        {
            name: `مكبر الصوت السفلي وسماعة الأذن ${model.arabicName} أصلية`,
            sku: `${model.code}-SPK-OEM`,
            barcode: `880${model.code}011`,
            category: 'Audio & Speakers',
            part_type: 'speaker',
            quality: 'OEM Original',
            min_stock: 3,
            locationCode: 'ZONE-C-02',
            seedQty: isLegacy ? 10 : 22
        },
        // 11. Buttons & Flex Cables
        {
            name: `فلكس أزرار الصوت والتشغيل ومفتاح الصامت ${model.arabicName} أصلي`,
            sku: `${model.code}-PWR-OEM`,
            barcode: `880${model.code}012`,
            category: 'Flex Cables & Buttons',
            part_type: 'flex_cable',
            quality: 'OEM Original',
            min_stock: 3,
            locationCode: 'ZONE-C-02',
            seedQty: isLegacy ? 8 : 16
        },
        // 12. Water & Dust Proof Display Adhesive Seal
        {
            name: `لاصق شاشة مقاوم للماء والغبار ${model.arabicName} مسبق القص (Waterproof Seal)`,
            sku: `${model.code}-ADH-WTR`,
            barcode: `880${model.code}013`,
            category: 'Consumables & Adhesives',
            part_type: 'consumable',
            quality: 'Premium',
            min_stock: 15,
            locationCode: 'ZONE-D-02',
            seedQty: isLegacy ? 25 : 60
        }
    ];

    return templates.map(t => ({
        ...t,
        device_family: model.family,
        model_name: model.name
    }));
}

// ── 5. Main Seeder Execution ────────────────────────────────────────────────
async function seedWarehouseData() {
    console.log('\n============================================================');
    console.log('🚀 Starting Handyland Repair Parts Warehouse Realistic Seeder');
    console.log('============================================================\n');

    let createdLocationsCount = 0;
    let existingLocationsCount = 0;
    let createdPartsCount = 0;
    let existingPartsCount = 0;
    let createdMovementsCount = 0;
    let skippedMovementsCount = 0;

    // ── Phase A: Seed Warehouse Locations ───────────────────────────────────
    console.log('📦 Step 1: Seeding Warehouse Physical Storage Locations...');
    const locationMap = new Map(); // location_code -> id

    for (const loc of WAREHOUSE_LOCATIONS) {
        const { data: existing, error: fetchErr } = await supabaseAdmin
            .from('warehouse_locations')
            .select('id, location_code')
            .eq('location_code', loc.location_code)
            .maybeSingle();

        if (fetchErr) {
            console.error(`❌ Error querying location ${loc.location_code}:`, fetchErr.message);
            continue;
        }

        if (existing) {
            locationMap.set(loc.location_code, existing.id);
            existingLocationsCount++;
            console.log(`  ↪ Location already exists: ${loc.location_code} (${existing.id})`);
        } else {
            const { data: inserted, error: insErr } = await supabaseAdmin
                .from('warehouse_locations')
                .insert({
                    location_code: loc.location_code,
                    zone: loc.zone,
                    rack: loc.rack,
                    shelf: loc.shelf,
                    bin: loc.bin,
                    description: loc.description,
                    is_active: true
                })
                .select('id, location_code')
                .single();

            if (insErr) {
                console.error(`❌ Failed to insert location ${loc.location_code}:`, insErr.message);
            } else {
                locationMap.set(loc.location_code, inserted.id);
                createdLocationsCount++;
                console.log(`  ✅ Created location: ${loc.location_code} -> ID: ${inserted.id}`);
            }
        }
    }

    console.log(`\n📍 Locations Summary: ${createdLocationsCount} created, ${existingLocationsCount} existing (Total: ${locationMap.size})\n`);

    // ── Phase B & C: Seed Repair Parts Catalog & Initial Stock Movements ─────
    console.log('🔧 Step 2: Seeding Repair Parts Catalog & Atomic RECEIVE Movements...\n');

    // Fetch existing parts to optimize idempotency checks
    const { data: allExistingParts, error: partsFetchErr } = await supabaseAdmin
        .from('repair_parts')
        .select('id, sku');

    if (partsFetchErr) {
        console.error('❌ Error fetching existing parts catalog:', partsFetchErr.message);
        process.exit(1);
    }

    const partMap = new Map(); // sku -> id
    for (const p of (allExistingParts || [])) {
        if (p.sku) partMap.set(p.sku.toUpperCase(), p.id);
    }

    // Build full list of parts across all iPhone models
    const allPartItems = [];
    for (const model of IPHONE_MODELS) {
        const modelParts = buildPartTemplates(model);
        allPartItems.push(...modelParts);
    }

    console.log(`📊 Generated ${allPartItems.length} candidate part templates across ${IPHONE_MODELS.length} iPhone models.`);

    // Iterate through all part templates
    for (let i = 0; i < allPartItems.length; i++) {
        const item = allPartItems[i];
        let partId = partMap.get(item.sku.toUpperCase());

        // Step B: Insert catalog item if not exists
        if (!partId) {
            const { data: newPart, error: createErr } = await supabaseAdmin
                .from('repair_parts')
                .insert({
                    name: item.name,
                    sku: item.sku.toUpperCase(),
                    barcode: item.barcode,
                    category: item.category,
                    brand: 'Apple',
                    device_family: item.device_family,
                    part_type: item.part_type,
                    quality: item.quality,
                    compatible_devices: [item.model_name],
                    min_stock: item.min_stock,
                    stock: 0, // Canonical warehouse rule: initial balance starts at 0
                    status: 'active',
                    is_active: true
                })
                .select('id, sku')
                .single();

            if (createErr) {
                console.error(`  ❌ Failed to insert part ${item.sku}:`, createErr.message);
                continue;
            }

            partId = newPart.id;
            partMap.set(item.sku.toUpperCase(), partId);
            createdPartsCount++;
        } else {
            existingPartsCount++;
        }

        // Step C: Check if part already has balances/movements in warehouse
        const targetLocationId = locationMap.get(item.locationCode);
        if (!targetLocationId) {
            console.warn(`  ⚠️ Target location ${item.locationCode} not found for part ${item.sku}. Skipping movement.`);
            continue;
        }

        const { data: existingStock, error: stockCheckErr } = await supabaseAdmin
            .from('part_stock_locations')
            .select('quantity_on_hand')
            .eq('repair_part_id', partId)
            .eq('warehouse_location_id', targetLocationId)
            .maybeSingle();

        if (stockCheckErr) {
            console.error(`  ❌ Error checking stock for part ${item.sku}:`, stockCheckErr.message);
            continue;
        }

        if (existingStock && existingStock.quantity_on_hand > 0) {
            skippedMovementsCount++;
        } else {
            // Apply atomic RECEIVE movement via Migration 019 RPC
            const { data: movementResult, error: rpcErr } = await supabaseAdmin
                .rpc('apply_part_stock_movement', {
                    p_repair_part_id: partId,
                    p_movement_type: 'RECEIVE',
                    p_quantity: item.seedQty,
                    p_destination_location_id: targetLocationId,
                    p_reason: 'Initial Warehouse Seed Stock',
                    p_notes: `استلام مخزون أولي تجريبي معتمد لمستودع هاندي لاند - ${item.name}`
                });

            if (rpcErr) {
                console.error(`  ❌ Movement RPC failed for ${item.sku} (${item.name}):`, rpcErr.message);
            } else {
                createdMovementsCount++;
            }
        }

        // Print progress every 50 parts
        if ((i + 1) % 50 === 0 || i === allPartItems.length - 1) {
            console.log(`  ⏳ Progress: ${i + 1}/${allPartItems.length} parts processed... (Created: ${createdPartsCount} parts, ${createdMovementsCount} movements)`);
        }
    }

    // ── Summary Report ──────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log('🎉 Warehouse Fake Data Seeding Completed Successfully!');
    console.log('============================================================');
    console.log(`📍 Warehouse Locations: ${createdLocationsCount} created, ${existingLocationsCount} already present (Total: ${locationMap.size})`);
    console.log(`🔧 Repair Parts Catalog: ${createdPartsCount} created, ${existingPartsCount} already present (Total: ${allPartItems.length})`);
    console.log(`📦 Stock Movements (RECEIVE): ${createdMovementsCount} executed, ${skippedMovementsCount} skipped (already in stock)`);
    console.log('============================================================\n');
}

// Execute seeder
seedWarehouseData().catch(err => {
    console.error('\n❌ Unhandled exception during seeding:', err);
    process.exit(1);
});
