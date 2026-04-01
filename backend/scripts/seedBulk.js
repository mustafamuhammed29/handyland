/**
 * seedBulk.js — Bulk Data Seeder
 * Sections: MARKETPLACE (100) + Premium Zubehör (100) + Reparatur Archiv (60) + Service Terminal (40)
 * Usage: node scripts/seedBulk.js
 * Appends data — does NOT clear existing records.
 */

'use strict';
require('dotenv').config();
const mongoose    = require('mongoose');
const Product     = require('../models/Product');
const Accessory   = require('../models/Accessory');
const RepairTicket= require('../models/RepairTicket');
const StockHistory= require('../models/StockHistory');
const RepairPart  = require('../models/RepairPart');
const User        = require('../models/User');

async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
}

const rand      = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick      = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid       = () => Math.random().toString(36).slice(2, 8);
const past      = (days) => new Date(Date.now() - days * 86400000);

// ══════════════════════════════════════════════════════════════════════════════
// 1. MARKETPLACE — 100 Smartphones
// ══════════════════════════════════════════════════════════════════════════════
async function seedMarketplace() {
    console.log('📱 Seeding 100 MARKETPLACE Products...');

    const entries = [
        // ── Apple ────
        ['Apple','iPhone 15 Pro Max','256GB','Titan Schwarz',1099,800,'Wie neu','92%'],
        ['Apple','iPhone 15 Pro Max','512GB','Titan Weiß',1199,880,'Wie neu','95%'],
        ['Apple','iPhone 15 Pro Max','1TB','Titan Natur',1299,970,'Sehr gut','89%'],
        ['Apple','iPhone 15 Pro','128GB','Titan Schwarz',849,630,'Wie neu','94%'],
        ['Apple','iPhone 15 Pro','256GB','Titan Blau',949,700,'Sehr gut','91%'],
        ['Apple','iPhone 15 Pro','512GB','Titan Weiß',1049,780,'Gut','88%'],
        ['Apple','iPhone 15 Plus','128GB','Schwarz',749,550,'Wie neu','96%'],
        ['Apple','iPhone 15 Plus','256GB','Gelb',849,630,'Sehr gut','90%'],
        ['Apple','iPhone 15','128GB','Pink',649,480,'Wie neu','95%'],
        ['Apple','iPhone 15','256GB','Grün',749,555,'Sehr gut','88%'],
        ['Apple','iPhone 15','512GB','Blau',899,665,'Gut','84%'],
        ['Apple','iPhone 14 Pro Max','256GB','Space Schwarz',799,585,'Wie neu','91%'],
        ['Apple','iPhone 14 Pro Max','512GB','Silber',899,665,'Sehr gut','87%'],
        ['Apple','iPhone 14 Pro Max','1TB','Gold',999,740,'Gut','82%'],
        ['Apple','iPhone 14 Pro','128GB','Tief Violett',699,515,'Wie neu','93%'],
        ['Apple','iPhone 14 Pro','256GB','Silber',799,590,'Sehr gut','89%'],
        ['Apple','iPhone 14 Pro','512GB','Space Schwarz',899,665,'Gut','85%'],
        ['Apple','iPhone 14 Plus','128GB','Blau',599,440,'Sehr gut','90%'],
        ['Apple','iPhone 14 Plus','256GB','Gelb',699,515,'Gut','86%'],
        ['Apple','iPhone 14','128GB','Mitternacht',549,405,'Sehr gut','88%'],
        ['Apple','iPhone 14','256GB','Starlight',649,480,'Gut','83%'],
        ['Apple','iPhone 13 Pro Max','256GB','Graphit',649,478,'Wie neu','90%'],
        ['Apple','iPhone 13 Pro Max','512GB','Gold',749,555,'Sehr gut','86%'],
        ['Apple','iPhone 13 Pro','256GB','Silber',549,405,'Sehr gut','87%'],
        ['Apple','iPhone 13 Pro','512GB','Sierra Blau',649,480,'Gut','83%'],
        ['Apple','iPhone 13','128GB','Rosa',429,315,'Sehr gut','89%'],
        ['Apple','iPhone 13','256GB','Grün',499,368,'Gut','84%'],
        ['Apple','iPhone 13 mini','128GB','Mitternacht',379,278,'Sehr gut','86%'],
        ['Apple','iPhone 12 Pro Max','256GB','Silber',499,368,'Sehr gut','88%'],
        ['Apple','iPhone 12 Pro','128GB','Graphit',399,295,'Gut','83%'],
        ['Apple','iPhone 12','64GB','Schwarz',299,220,'Gut','79%'],
        ['Apple','iPhone 12','128GB','Weiß',329,242,'Akzeptabel','76%'],
        ['Apple','iPhone 11 Pro Max','256GB','Nachtgrün',349,257,'Gut','78%'],
        ['Apple','iPhone 11 Pro','256GB','Space Grau',299,220,'Gut','77%'],
        ['Apple','iPhone 11','128GB','Weiß',249,183,'Gut','81%'],
        ['Apple','iPhone SE (3. Gen)','128GB','Mitternacht',299,220,'Wie neu','97%'],
        // ── Samsung ────
        ['Samsung','Galaxy S24 Ultra','256GB','Titan Schwarz',899,665,'Wie neu','95%'],
        ['Samsung','Galaxy S24 Ultra','512GB','Titan Weiß',999,740,'Sehr gut','92%'],
        ['Samsung','Galaxy S24 Ultra','1TB','Titan Violett',1099,815,'Gut','88%'],
        ['Samsung','Galaxy S24+','256GB','Onyx Schwarz',699,515,'Wie neu','94%'],
        ['Samsung','Galaxy S24+','512GB','Marble Gray',799,590,'Sehr gut','90%'],
        ['Samsung','Galaxy S24','128GB','Onyx Schwarz',549,405,'Wie neu','96%'],
        ['Samsung','Galaxy S24','256GB','Kobalt Violett',649,480,'Sehr gut','91%'],
        ['Samsung','Galaxy S23 Ultra','256GB','Phantom Schwarz',699,515,'Sehr gut','90%'],
        ['Samsung','Galaxy S23 Ultra','512GB','Grüne',799,590,'Gut','86%'],
        ['Samsung','Galaxy S23+','256GB','Phantom Schwarz',549,405,'Sehr gut','88%'],
        ['Samsung','Galaxy S23','128GB','Phantom Schwarz',449,330,'Sehr gut','89%'],
        ['Samsung','Galaxy S23','256GB','Cream',499,368,'Gut','85%'],
        ['Samsung','Galaxy S22 Ultra','256GB','Phantom Weiß',549,405,'Gut','84%'],
        ['Samsung','Galaxy S22+','256GB','Graphit',449,330,'Gut','83%'],
        ['Samsung','Galaxy S22','128GB','Phantom Schwarz',349,257,'Akzeptabel','79%'],
        ['Samsung','Galaxy Z Fold 5','256GB','Icy Blue',1099,815,'Wie neu','93%'],
        ['Samsung','Galaxy Z Fold 5','512GB','Phantom Schwarz',1199,890,'Sehr gut','90%'],
        ['Samsung','Galaxy Z Flip 5','256GB','Mint',599,442,'Wie neu','95%'],
        ['Samsung','Galaxy Z Flip 5','512GB','Gray',699,515,'Sehr gut','91%'],
        ['Samsung','Galaxy Z Flip 4','256GB','Bora Lila',499,368,'Gut','86%'],
        ['Samsung','Galaxy A54','256GB','Awesome Graphite',279,205,'Sehr gut','88%'],
        ['Samsung','Galaxy A34','128GB','Awesome Graphite',229,168,'Sehr gut','89%'],
        ['Samsung','Galaxy A14','128GB','Schwarz',159,117,'Gut','85%'],
        // ── Xiaomi ────
        ['Xiaomi','Xiaomi 14 Ultra','512GB','Titan Schwarz',999,740,'Wie neu','97%'],
        ['Xiaomi','Xiaomi 14 Pro','256GB','Schwarz',799,590,'Sehr gut','93%'],
        ['Xiaomi','Xiaomi 14','256GB','Weiß',649,480,'Wie neu','96%'],
        ['Xiaomi','Xiaomi 14','512GB','Schwarz',749,555,'Sehr gut','92%'],
        ['Xiaomi','Xiaomi 13 Ultra','256GB','Schwarz',799,590,'Gut','87%'],
        ['Xiaomi','Xiaomi 13 Pro','256GB','Ceramic Weiß',649,480,'Gut','85%'],
        ['Xiaomi','Xiaomi 13','256GB','Weiß',499,368,'Sehr gut','90%'],
        ['Xiaomi','Redmi Note 13 Pro+','512GB','Aurora Lila',349,257,'Wie neu','98%'],
        ['Xiaomi','Redmi Note 13 Pro','256GB','Mitternacht Schwarz',299,220,'Sehr gut','91%'],
        ['Xiaomi','Redmi Note 13','256GB','Schwarz',229,168,'Sehr gut','92%'],
        ['Xiaomi','POCO X6 Pro','256GB','Schwarz',349,257,'Wie neu','97%'],
        ['Xiaomi','POCO F6 Pro','512GB','Schwarz',449,330,'Sehr gut','94%'],
        // ── Google ─────
        ['Google','Pixel 9 Pro XL','256GB','Obsidian',999,740,'Wie neu','98%'],
        ['Google','Pixel 9 Pro','128GB','Hazel',849,630,'Wie neu','97%'],
        ['Google','Pixel 9','128GB','Wintergreen',699,515,'Wie neu','99%'],
        ['Google','Pixel 8 Pro','256GB','Obsidian',699,515,'Sehr gut','91%'],
        ['Google','Pixel 8 Pro','512GB','Porcelain',799,590,'Gut','87%'],
        ['Google','Pixel 8','128GB','Hazel',549,405,'Sehr gut','92%'],
        ['Google','Pixel 8a','256GB','Obsidian',499,368,'Wie neu','98%'],
        ['Google','Pixel 7 Pro','256GB','Obsidian',549,405,'Gut','85%'],
        ['Google','Pixel 7','128GB','Lemongrass',399,295,'Gut','83%'],
        ['Google','Pixel Fold','256GB','Obsidian',999,740,'Gut','87%'],
        // ── Others ────
        ['OnePlus','OnePlus 12','256GB','Silky Schwarz',699,515,'Wie neu','95%'],
        ['OnePlus','OnePlus 12','512GB','Flowy Emerald',799,590,'Sehr gut','91%'],
        ['OnePlus','OnePlus 11','256GB','Titan Schwarz',549,405,'Sehr gut','88%'],
        ['OnePlus','OnePlus Open','512GB','Emerald Dusk',999,740,'Gut','86%'],
        ['Sony','Xperia 1 VI','256GB','Schwarz',849,630,'Wie neu','96%'],
        ['Sony','Xperia 5 V','256GB','Schwarz',699,515,'Sehr gut','90%'],
        ['Sony','Xperia 10 V','128GB','Schwarz',449,330,'Gut','85%'],
        ['Motorola','Motorola Razr 50 Ultra','256GB','Midnight Blue',749,555,'Wie neu','97%'],
        ['Motorola','Motorola Edge 50 Pro','256GB','Schwarz',499,368,'Sehr gut','91%'],
        ['Nothing','Nothing Phone (2a)','256GB','Schwarz',349,257,'Wie neu','99%'],
        ['Nothing','Nothing Phone (2)','256GB','Schwarz',499,368,'Sehr gut','93%'],
        ['Fairphone','Fairphone 5','256GB','Sky Blau',549,405,'Wie neu','97%'],
        ['Huawei','Huawei P60 Pro','256GB','Schwarzes Schwarz',699,515,'Gut','88%'],
        ['OPPO','OPPO Find X7 Ultra','512GB','Schwarz',799,590,'Sehr gut','92%'],
    ];

    const imgs = [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
        'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400',
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
        'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=400',
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
        'https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=400',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    ];

    const descs = [
        'Professionell geprüft und gereinigt. Voll funktionsfähig.',
        'Leichte Gebrauchsspuren. Technisch einwandfrei.',
        'Fast wie neu. Immer mit Hülle betrieben.',
        'Entsperrt für alle Netzbetreiber. Akku getestet.',
        'Normaler Gebrauchszustand. Alle Funktionen OK.',
        'Pristine Zustand. Nur kurze Zeit benutzt.',
        'Guter Allgemeinzustand. Kleine Kratzer auf Rückseite.',
        'Technisch einwandfrei. Sichtbare Abnutzungsspuren.',
    ];

    const products = entries.map(([brand, model, storage, color, price, costPrice, cond, battery], i) => ({
        id: `${brand.toLowerCase().replace(/ /g,'-')}-${model.toLowerCase().replace(/[ ()\.'"]/g,'-').replace(/-+/g,'-')}-${storage.toLowerCase().replace(/ /g,'')}-${color.toLowerCase().replace(/ /g,'')}-${uid()}`,
        name: `${brand} ${model} ${storage} ${color}`,
        brand, model, storage, color,
        price, costPrice,
        condition: cond,
        battery,
        stock: rand(1, 25),
        sold: rand(0, 100),
        rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
        numReviews: rand(0, 35),
        isActive: true,
        category: model.includes('Tab') || model.includes('iPad') || model.includes('Fold') ? 'tablets' :
                  model.includes('MacBook') ? 'laptops' : 'smartphones',
        description: `${pick(descs)} ${brand} ${model} ${storage}, Farbe: ${color}. Akku: ${battery}.`,
        image: imgs[i % imgs.length],
        images: [],
        features: [`${storage} Speicher`, `Akku: ${battery}`, cond, 'Entsperrt', '30 Tage Rückgaberecht'],
        seo: {
            metaTitle: `${brand} ${model} ${storage} gebraucht kaufen`,
            metaDescription: `${brand} ${model} ${storage} in ${cond} Zustand. Akku: ${battery}. Sofort verfügbar.`,
        }
    }));

    const created = await Product.insertMany(products, { ordered: false });
    console.log(`   ✅ ${created.length} Products eingefügt`);
    return created;
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. PREMIUM ZUBEHÖR — 100 Accessories
// ══════════════════════════════════════════════════════════════════════════════
async function seedPremiumAccessories() {
    console.log('🎧 Seeding 100 Premium Zubehör...');

    const items = [
        // Audio (25)
        ['Apple AirPods Pro 2nd Gen MagSafe USB-C','audio','Apple',239,168,15,'ANC + Transparency Mode, 30h Akku, personalisierter Klang.'],
        ['Apple AirPods 4 ANC','audio','Apple',179,125,20,'Aktive Geräuschunterdrückung, H2 Chip, 30h Akku.'],
        ['Apple AirPods 4 Standard','audio','Apple',139,97,30,'H2 Chip, verbesserte Passform, 30h Gesamtlaufzeit.'],
        ['Apple AirPods Max Mitternacht USB-C','audio','Apple',469,330,6,'Over-Ear, ANC, Spatial Audio, USB-C Edition.'],
        ['Apple AirPods Max Starlight USB-C','audio','Apple',469,330,5,'Over-Ear Premium, ANC, Liqids, Starlight.'],
        ['Samsung Galaxy Buds3 Pro Silber','audio','Samsung',189,130,12,'Hi-Fi ANC, IP57, 37h Gesamtakku, Dolby Head Tracking.'],
        ['Samsung Galaxy Buds3 Weiß','audio','Samsung',129,88,22,'Offenes Design, Dolby Atmos, 30h Gesamtakku.'],
        ['Sony WH-1000XM5 Schwarz','audio','Sony',289,198,8,'Industry-leading ANC, 30h, LDAC, Speak-to-Chat.'],
        ['Sony WH-1000XM5 Silber','audio','Sony',289,198,7,'30h ANC Kopfhörer, Multipoint BT, Silber.'],
        ['Sony WH-1000XM4 Schwarz','audio','Sony',219,150,12,'Industrie-ANC, 30h, adaptives Soundkontrollsystem.'],
        ['Sony WF-1000XM5 Schwarz','audio','Sony',249,172,10,'Kleinste Sony ANC Earbuds, 24h Akku, LDAC.'],
        ['Bose QuietComfort Ultra Headphones','audio','Bose',379,265,6,'Bose Immersive Audio, ANC, 24h Akku, Premium.'],
        ['Bose QuietComfort 45 Weiß Smoke','audio','Bose',259,180,8,'24h ANC, TriPort Akustik, anpassbarer Sound.'],
        ['Bose QuietComfort Ultra Earbuds','audio','Bose',279,193,9,'Immersive Audio, 6h+18h Akku, 6 Mikrofone.'],
        ['JBL Tour Pro 3 TWS','audio','JBL',199,135,14,'Smart Charging Case mit Display, ANC, 11h.'],
        ['JBL Live 770NC','audio','JBL',99,63,28,'Adaptive ANC, 65h Akku, JBL Spatial Sound.'],
        ['JBL Tune 770NC','audio','JBL',79,50,35,'ANC, 70h Akku, faltbar, 4 Mikrofone.'],
        ['Sennheiser Momentum 4 Wireless','audio','Sennheiser',249,172,7,'60h Akku, ANC, Hi-Res Zertifiziert, Premium Klang.'],
        ['Sennheiser Momentum True Wireless 4','audio','Sennheiser',199,138,10,'ANC + Transparency, adaptive ANC, 30h Akku.'],
        ['Jabra Evolve2 75','audio','Jabra',299,208,5,'UC-optimiert, 37h ANC, BT 5.3, Premium Business.'],
        ['Soundcore Liberty 4 NC','audio','Anker',89,55,25,'Hybrid ANC 98.5% lärm, 50h Akku, LDAC.'],
        ['Nothing Ear (2)','audio','Nothing',99,65,18,'Personalisiertes ANC, Hi-Res Zertifizierung, 6h.'],
        ['Beats Studio Pro','audio','Beats',279,193,8,'Spatial Audio, 40h Akku, AppleW1 + USB-C.'],
        ['Beats Fit Pro','audio','Beats',179,124,12,'Aktives ANC, Transparency, H1 Chip, Sport.'],
        ['Bang & Olufsen Beoplay H95','audio','Bang & Olufsen',649,455,3,'Premium Titan, 38h ANC, Aluminium-Ohrmuscheln.'],

        // Power (25)
        ['Apple MagSafe Charger 2m USB-C 15W','power','Apple',49,28,40,'2m MagSafe Kabel für iPhone 12–15 und AirPods.'],
        ['Apple 20W USB-C Power Adapter','power','Apple',25,13,70,'Offizielles 20W Schnellladegerät für iPhone iPad.'],
        ['Apple 30W USB-C Power Adapter','power','Apple',39,22,55,'30W für MacBook Air, iPhone, iPad Air.'],
        ['Apple 67W USB-C Power Adapter','power','Apple',59,38,30,'67W für MacBook Pro 13", kompatibel mit iPhone.'],
        ['Apple MagSafe Duo Charger','power','Apple',109,75,18,'Simultanes Laden von iPhone und Apple Watch.'],
        ['Anker 140W GaN Prime USB-C Ladegerät','power','Anker',79,50,25,'140W ultraschnell, 4 Ports, Laptop geeignet.'],
        ['Anker 737 Power Bank 24000mAh','power','Anker',89,60,18,'140W I/O, 3 Ports, Display, für Laptops.'],
        ['Anker 733 Wireless 2-in-1','power','Anker',55,33,30,'MagSafe Wireless Station + 10000mAh Powerbank.'],
        ['Anker Nano II 65W GaN','power','Anker',35,20,60,'Ultra-compact 65W, USB-C PD 3.0, IQ3.0.'],
        ['Anker Nano III 30W','power','Anker',22,12,80,'Kleinste 30W GaN Ladegerät der Welt.'],
        ['Belkin BoostCharge Pro 3in1 MagSafe 15W','power','Belkin',149,105,12,'iPhone + Apple Watch Series + AirPods gleichzeitig.'],
        ['Belkin 108W USB-C Laptop Charger','power','Belkin',75,50,20,'108W USB-C GaN, kompatibel mit MacBook Pro.'],
        ['Samsung 45W Super Fast Charger 2.0','power','Samsung',39,22,45,'45W für Galaxy S21/S22/S23/S24 Ultra.'],
        ['Samsung 25W Kompakt Ladegerät','power','Samsung',22,12,65,'Für alle Galaxy Smartphones kompatibel.'],
        ['Samsung Wireless Charger Pad 15W','power','Samsung',35,20,40,'15W Fast Charging Pad, kompatibel mit Qi.'],
        ['Mophie Powerstation Pro XL 20000','power','Mophie',89,62,15,'20000mAh, 30W USB-C, 2 Ports, Premium Leder.'],
        ['Xiaomi Mi 67W GaN Charger','power','Xiaomi',28,15,60,'67W 2-Port, USB-C PD + USB-A QC4+.'],
        ['Xiaomi Wireless Charging Stand 80W','power','Xiaomi',45,28,25,'80W Turbo Wireless, 5 Spulen Ausrichtung.'],
        ['USB-C auf Lightning Kabel MFi 1m','power','Apple',19,9,90,'Apple-zertifiziert, Schnellladung für iPhone.'],
        ['USB-C auf Lightning Kabel MFi 2m','power','Apple',25,12,75,'2m, MFi, Nylon, für iPhone, iPad Mini.'],
        ['USB-C Kabel 240W Thunderbolt 4 0.8m','power','Anker',35,20,40,'Thunderbolt 4/USB4, 8K, 40Gbps, für MacBook.'],
        ['Magsafe Magnetische Autohalterung 15W','power','Belkin',59,38,30,'15W MagSafe KFZ Halterung und Ladegerät.'],
        ['UGREEN 100W GaN 4-Port Charger','power','UGREEN',55,34,35,'100W, 3xUSB-C + 1xUSB-A, PowerDelivery 3.0.'],
        ['Baseus 65W Transparentes GaN','power','Baseus',35,20,50,'Durchsichtiges Design, 65W, 3 Ports, ultra-kompakt.'],
        ['Balení 20000mAh Quick Charge 4+ PD','power','Baseus',39,23,45,'20000mAh, 22.5W Input, 20W USB-C Output.'],

        // Protection (25)
        ['Spigen Ultra Hybrid MagFit iPhone 15 Pro Max','protection','Spigen',22,8,55,'MagSafe kompatibel, kristallklar, Fallschutz.'],
        ['Spigen Nano Armor iPhone 15 Pro','protection','Spigen',19,7,65,'Nano-Optik Textur, Fallschutz, Anti-Kratzer.'],
        ['Spigen Tough Armor MagFit S24 Ultra','protection','Spigen',24,9,50,'MagSafe, Dual Layer, integrierter Kickstand.'],
        ['OtterBox Defender Pro iPhone 15 Pro','protection','OtterBox',55,32,18,'Dreifacher Schutz, Port-Abdeckungen, Holster.'],
        ['OtterBox Symmetry+ MagSafe 15','protection','OtterBox',44,26,22,'MagSafe, erhöhte Sicherheitslösung, schlank.'],
        ['Apple FineWoven Case iPhone 15 Pro MagSafe','protection','Apple',55,35,20,'Feines Textilgewebe, MagSafe, nachhaltiges Material.'],
        ['Apple Clear Case iPhone 15 MagSafe','protection','Apple',45,28,30,'Klar, zeigt iPhone Design, MagSafe kompatibel.'],
        ['Peak Design Everyday Case iPhone 15','protection','Peak Design',69,45,10,'SlimLink MagSafe-Ökosystem, unzerbrechlich.'],
        ['Casetify Impact iPhone 15 Pro Max','protection','Casetify',65,42,12,'2m Fallschutz, anti-mikrobielle Oberfläche.'],
        ['dbrand Grip Case iPhone 15 Pro','protection','dbrand',49,30,15,'Militärtests, kratzfest, austauschbares Skin.'],
        ['Nomad Modern Leather iPhone 15','protection','Nomad',59,38,12,'Echtleder, MagSafe, Horween-Leder, Premium.'],
        ['Mous Limitless 5.0 Carbon Fibre 15','protection','Mous',59,38,12,'Carbonfaser, 10ft Fallschutz, MagSafe.'],
        ['Panzerglas 2.5D iPhone 15 Pro 3er','protection','Spigen',18,6,90,'9H, 3-Pack, Anti-Fingerabdruck, Blasenfrei.'],
        ['Panzerglas Curved S24 Ultra 3er Pack','protection','Whitestone',25,10,70,'3D Vollschutz, UV-Klebebasis, fingerabdruckfrei.'],
        ['Privacy Glass iPhone 15 Pro','protection','Spigen',19,7,65,'180° Sichtschutz, 9H, Anti-Spy.'],
        ['Displayschutz Samsung S24 5er Pack','protection','Spigen',16,5,100,'5er Pack, gehärtetes Glas, matte Anti-Glare.'],
        ['Klare Displayschutzfolie iPhone 15 6er','protection','Anker',16,5,100,'6er Pack, Glasqualität, easy-install.'],
        ['Leder Hülle Samsung S24 Ultra Magnetic','protection','Samsung',69,45,15,'Original Samsung Leder Cover, S Pen kompatibel.'],
        ['Panzerglas iPhone 15 Pro Max (2er)','protection','Belkin',18,7,80,'ScreenForce Pro, TemperedCurv, TrueOCO.'],
        ['Silikon Hülle iPhone 15 Pro (Alle Farben)','protection','Apple',49,32,25,'Silikon, MagSafe, 21 Farben verfügbar.'],
        ['Handyhülle Xiaomi 14 Ultra Leder','protection','Xiaomi',45,28,18,'Original Leder Cover, MagSafe-ähnlich.'],
        ['Samsung S-View Wallet Cover S24','protection','Samsung',49,30,20,'S-View Cover, NFC-Kompatibilität, Scheckfach.'],
        ['Magsafe Wallet Airtag Holder','protection','Mophie',45,28,25,'MagSafe Geldbörse mit AirTag-Slot.'],
        ['Ringke Fusion iPhone 15 Pro','protection','Ringke',16,5,70,'Hybrid transparent, Griff-Textur, Fallschutz.'],
        ['Bumper Case iPhone 15 Pro Max Titan','protection','Nillkin',25,10,55,'Aluminiumrahmen-Bumper, Schraubendesign.'],

        // Wearables (15)
        ['Apple Watch Series 10 42mm GPS','wearables','Apple',399,290,10,'Dünnste Apple Watch, Titan, 36h Akku.'],
        ['Apple Watch Series 10 46mm GPS','wearables','Apple',429,310,9,'46mm, neues S10 SiP, Schlaftracking.'],
        ['Apple Watch Ultra 2 Titan Orange','wearables','Apple',799,590,4,'49mm, Precision Finding 3.0, 60h Akku.'],
        ['Apple Watch SE 2024 40mm GPS','wearables','Apple',229,165,14,'Crash Detection, Herzfrequenz, S9 Chip.'],
        ['Samsung Galaxy Watch 7 44mm LTE','wearables','Samsung',329,235,10,'LTE, 40h Akku, BioActive Sensor 3in1.'],
        ['Samsung Galaxy Watch Ultra 47mm LTE','wearables','Samsung',549,395,6,'Grade 4 Titan, LTE, 60h Akku.'],
        ['Garmin Fenix 8 47mm Solar','wearables','Garmin',699,510,5,'Solar, Multisport, 29 Tage Akku, AMOLED.'],
        ['Garmin Forerunner 965 Carbon','wearables','Garmin',529,385,5,'Carbon, AMOLED, 31 Tage GPS-Akku.'],
        ['Garmin Venu 3S LTE','wearables','Garmin',379,275,7,'45mm AMOLED, LTE, Nervenregeneration.'],
        ['Polar Grit X2 Pro Titan','wearables','Polar',499,365,5,'Outdoor-Multisport, Solar, sapphire Glas.'],
        ['Xiaomi Smart Band 9 Pro','wearables','Xiaomi',69,40,30,'1.74" AMOLED, GPS, 21 Tage, Metall.'],
        ['Google Pixel Watch 3 45mm LTE','wearables','Google',399,290,8,'LTE, AMOLED, Fitbit 6 Monate gratis.'],
        ['Fitbit Charge 6 Obsidian','wearables','Fitbit',149,100,16,'EKG, Stress Management, Google Maps.'],
        ['Amazfit GTR 4 SmartWatch','wearables','Amazfit',149,100,18,'14 Tage Akku, GPS, Alexa, 150+ Sport.'],
        ['Fossil Gen 6 WearOS','wearables','Fossil',199,138,10,'WearOS, Snapdragon W5+, NFC, Premium Stil.'],

        // Other (10)
        ['Apple AirTag 4er Set','smart_home','Apple',99,70,25,'Präzisionssuche, Find My, IP67, CR2032.'],
        ['Samsung SmartTag2 4er Set','smart_home','Samsung',89,62,20,'BT+UWB, SmartThings, 180 Tage Akku.'],
        ['DJI Osmo Mobile 6 Gimbal','cameras','DJJ',149,100,10,'3-Achsen, ActiveTrack 6.0, 8h Akku.'],
        ['Razer Kishi V2 Pro Android','gaming','Razer',109,74,12,'Mikrohalterung, haptischer Feedback, USB-C.'],
        ['Backbone One Xbox Edition iPhone','gaming','Backbone',119,80,10,'Xbox Cloud, 3,5mm Audio, Lightning.'],
        ['Backbone One PlayStation USB-C','gaming','Backbone',119,80,10,'PS-Design, USB-C, passthrough Laden.'],
        ['Apple TV 4K Wi-Fi+Ethernet 128GB','smart_home','Apple',149,105,8,'A15 Bionic, HDR10+, HomeKit Hub.'],
        ['Amazon Echo Dot 5. Generation','smart_home','Amazon',59,38,20,'Alexa, TemperaturSensor, eARC-HDMI.'],
        ['Anker eufy Clean L60','smart_home','Anker',299,210,5,'Selbstleerend, 3000Pa, AI-Kartierung.'],
        ['Tile Mate 4er Set 2024','smart_home','Tile',69,45,25,'BT, lautester Klingelton, 3 Jahre Akku.'],
    ];

    const imgMap = {
        audio: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
        power: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        protection: 'https://images.unsplash.com/photo-1601593343143-6c5c1ff14b9b?w=400',
        wearables: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
        smart_home: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        cameras: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
        gaming: 'https://images.unsplash.com/photo-1592890288564-76c5a6caa5e8?w=400',
        storage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400',
        car: 'https://images.unsplash.com/photo-1461956456671-c48e9a3b9fff?w=400',
    };

    const accessories = items.map(([name, cat, brand, price, costPrice, stock, desc]) => ({
        id: `acc-${brand.toLowerCase().replace(/ /g,'-')}-${cat}-${uid()}`,
        name, brand,
        category: cat,
        price, costPrice, stock,
        sold: rand(0, 200),
        isActive: true,
        description: desc,
        image: imgMap[cat] || imgMap.audio,
        tag: price > 300 ? 'Premium' : price < 30 ? 'Bestseller' : undefined,
    }));

    const created = await Accessory.insertMany(accessories, { ordered: false });
    console.log(`   ✅ ${created.length} Accessories eingefügt`);
    return created;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. REPARATUR ARCHIV — 60 abgeschlossene Tickets
// ══════════════════════════════════════════════════════════════════════════════
async function seedRepairArchive(users) {
    console.log('🔧 Seeding 60 Reparatur Archiv Einträge...');

    const customers = users.filter(u => u.role === 'user');
    const admin = users.find(u => u.role === 'admin');

    const devices = [
        'iPhone 15 Pro', 'iPhone 14 Pro Max', 'iPhone 13', 'iPhone 12', 'iPhone 11 Pro',
        'iPhone XS Max', 'iPhone XR', 'iPhone X', 'iPhone 8 Plus', 'iPhone SE (2. Gen)',
        'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S23', 'Samsung Galaxy A54',
        'Samsung Galaxy Z Flip 4', 'Samsung Galaxy S22 Ultra',
        'Xiaomi 13 Pro', 'Xiaomi Redmi Note 12 Pro', 'POCO X5 Pro',
        'Google Pixel 8 Pro', 'Google Pixel 7', 'OnePlus 11',
        'Sony Xperia 5 V', 'Motorola Edge 40 Pro', 'Huawei P50 Pro',
        'iPad Pro 12.9"', 'iPad Air 5', 'Samsung Tab S9'
    ];

    const issues = [
        'Display gebrochen — Glasbruch komplett',
        'Akku defekt — hält keine Ladung mehr',
        'Gerät startet nicht — Softwarefehler',
        'Kamera defekt — rückwärtige Kamera unscharf',
        'Ladebuchse beschädigt',
        'Lautsprecher defekt — kein Ton',
        'Mikrofon defekt',
        'Touch funktioniert nicht',
        'Wasserschaden — Gerät nass',
        'Gesichtserkennung defekt',
        'Fingerabdrucksensor defekt',
        'Hinteres Glas gebrochen',
        'WLAN Antenne defekt',
        'Bluetooth verbindet nicht',
        'Vibration defekt',
        'Power-Button klemmt',
    ];

    const completedStatuses = ['completed', 'cancelled'];
    const serviceTypes = ['Mail-in', 'In-Store', 'On-Site'];

    const archiveTickets = [];

    for (let i = 0; i < 60; i++) {
        const user = pick(customers);
        const device = pick(devices);
        const issue = pick(issues);
        const status = i < 50 ? 'completed' : 'cancelled'; // 50 abgeschlossen, 10 storniert
        const createdDaysAgo = rand(30, 365);
        const duration = rand(1, 14);
        const estimatedCost = rand(30, 299);
        const stype = pick(serviceTypes);

        archiveTickets.push({
            user: user._id,
            device,
            issue,
            status,
            estimatedCost,
            serviceType: stype,
            notes: `Kunde: Gerät ${status === 'completed' ? 'repariert und abgeholt' : 'Reparatur abgebrochen'}.`,
            technicianNotes: status === 'completed'
                ? `Reparatur erfolgreich abgeschlossen. ${pick(['Display ersetzt.', 'Akku getauscht.', 'Software-Reset durchgeführt.', 'Ladebuchse ersetzt.', 'Kamera-Modul getauscht.'])}`
                : 'Kunde hat die Reparatur storniert.',
            messages: [
                { role: 'customer', text: `Problem: ${issue}. Bitte schnell reparieren.`, timestamp: past(createdDaysAgo) },
                { role: 'admin', text: status === 'completed' ? `Reparatur abgeschlossen. Kosten: €${estimatedCost}. Gerät abholbereit.` : 'Stornierung bestätigt.', timestamp: past(createdDaysAgo - duration) }
            ],
            timeline: [
                { status: 'received', note: 'Gerät empfangen und geprüft.', timestamp: past(createdDaysAgo) },
                { status: 'diagnosing', note: `Diagnose: ${issue}.`, timestamp: past(createdDaysAgo - 1) },
                { status: status === 'completed' ? 'repairing' : 'cancelled', note: status === 'completed' ? 'Reparatur gestartet.' : 'Storniert auf Kundenwunsch.', timestamp: past(createdDaysAgo - duration) },
                ...(status === 'completed' ? [
                    { status: 'testing', note: 'Gerät getestet — alle Funktionen OK.', timestamp: past(createdDaysAgo - duration + 1) },
                    { status: 'completed', note: `Reparatur abgeschlossen. Gerät abgeholt.`, timestamp: past(createdDaysAgo - duration + 2) }
                ] : [])
            ],
            ticketId: `REP-ARCH-${String(i + 1).padStart(3,'0')}-${uid().toUpperCase()}`,
        });
    }

    const created = await RepairTicket.insertMany(archiveTickets, { ordered: false });
    console.log(`   ✅ ${created.length} Archiv Tickets eingefügt (${archiveTickets.filter(t=>t.status==='completed').length} abgeschlossen, ${archiveTickets.filter(t=>t.status==='cancelled').length} storniert)`);
    return created;
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. SERVICE TERMINAL — 40 Stock History Einträge (Teil-Verbrauch)
// ══════════════════════════════════════════════════════════════════════════════
async function seedServiceTerminal(users) {
    console.log('🖥️  Seeding 40 Service Terminal Einträge...');

    const admin = users.find(u => u.role === 'admin');
    if (!admin) { console.log('   ⚠️  No admin user found'); return; }

    // Get existing repair parts
    const parts = await RepairPart.find({}).lean();
    if (parts.length === 0) { console.log('   ⚠️  No repair parts found — run seedAll.js first'); return; }

    const reasons = ['Sale', 'Restock', 'Manual Correction', 'Return', 'System sync'];
    const adjNotes = [
        'Verbraucht bei Reparatur #REP-ARCH',
        'Wareneingang vom Lieferanten',
        'Rückgabe vom Kunden',
        'Manuelle Korrektur nach Inventur',
        'Systemabgleich',
        'Als Teil der Reparatur verbraucht',
        'Neue Lieferung eingetragen',
        'Defektes Teil zurück an Lieferant',
    ];

    const entries = [];
    for (let i = 0; i < 40; i++) {
        const part = pick(parts);
        const isSale = i % 3 !== 0;
        const change = isSale ? -rand(1, 3) : rand(5, 20);
        const prevStock = Math.max(0, part.stock + (isSale ? rand(1,5) : 0));
        const newStock = Math.max(0, prevStock + change);

        entries.push({
            itemId: part._id,
            itemModel: 'RepairPart',
            itemName: part.name,
            user: admin._id,
            userName: admin.name,
            previousStock: prevStock,
            newStock: newStock,
            changeAmount: change,
            reason: isSale ? 'Sale' : pick(['Restock', 'Manual Correction']),
            notes: pick(adjNotes) + ` (Ticket ${i + 1})`,
        });
    }

    const created = await StockHistory.insertMany(entries, { ordered: false });
    console.log(`   ✅ ${created.length} Service Terminal Buchungen eingefügt`);
    return created;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
    console.log('\n🌱 HandyLand Bulk Seeder');
    console.log('═'.repeat(55));
    console.log('  Sections: Marketplace | Zubehör | Reparatur Archiv | Service Terminal');
    console.log('═'.repeat(55) + '\n');

    await connectDB();

    try {
        const users = await User.find({}).lean();
        if (users.length === 0) {
            console.error('❌ Keine Benutzer gefunden. Bitte zuerst "node scripts/seedAll.js" ausführen.');
            process.exit(1);
        }

        await seedMarketplace();
        await seedPremiumAccessories();
        await seedRepairArchive(users);
        await seedServiceTerminal(users);

        // Final count summary
        const [totalP, totalA, totalT, totalSH] = await Promise.all([
            Product.countDocuments(),
            Accessory.countDocuments(),
            RepairTicket.countDocuments(),
            StockHistory.countDocuments(),
        ]);

        console.log('\n' + '═'.repeat(55));
        console.log('✅ BULK SEED ABGESCHLOSSEN!\n');
        console.log('  📊 Gesamtbestand in der Datenbank:');
        console.log(`     📱 Produkte (Marketplace):     ${totalP}`);
        console.log(`     🎧 Zubehör (Premium):          ${totalA}`);
        console.log(`     🔧 Reparatur-Tickets (Archiv): ${totalT}`);
        console.log(`     🖥️  Service Terminal Buchungen: ${totalSH}`);
        console.log('\n  ✅ Alle Sektionen vollständig befüllt!\n');

    } catch (err) {
        console.error('\n❌ Fehler:', err.message);
        if (err.errors) console.error('Details:', JSON.stringify(err.errors, null, 2));
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Verbindung getrennt');
        process.exit(0);
    }
}

main();
