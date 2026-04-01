/**
 * seedDevices.js — HandyLand Full Device Catalog Seeder
 *
 * 📦 Categories: Smartphone, Tablet, Laptop, Gaming, Smartwatch, Audio
 * 🇩🇪 Prices based on German buyback market (rebuy.de, BackMarket.de)
 *
 * Run: node scripts/seedDevices.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DeviceBlueprint = require('../models/DeviceBlueprint');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/handyland';

// ─── Shared Condition Modifiers ───────────────────────────────────────────────
const SCREEN = { hervorragend: 1.0, sehr_gut: 0.88, gut: 0.72, beschadigt: 0.45 };
const BODY   = { hervorragend: 1.0, sehr_gut: 0.93, gut: 0.82, beschadigt: 0.55 };

// Device helper
const d = (brand, model, category, basePrice, validStorages, storagePrices, image) => ({
    brand, model, category, basePrice, validStorages, storagePrices,
    imageUrl: image,
    screenModifiers: SCREEN,
    bodyModifiers: BODY,
    functionalMultiplier: 1.0,
    nonFunctionalMultiplier: 0.35,
    active: true
});

// ─── GSMArena Image Base ──────────────────────────────────────────────────────
const G = 'https://fdn2.gsmarena.com/vv/pics';

const devices = [

    // ══════════════════════════════════════════════════════
    //                  📱 SMARTPHONES
    // ══════════════════════════════════════════════════════

    // ── Apple iPhone ──────────────────────────────────────
    d('Apple','iPhone 16 Pro Max','Smartphone',800,['256GB','512GB','1TB'],{'256GB':0,'512GB':70,'1TB':150},`${G}/apple/apple-iphone-16-pro-max-0.jpg`),
    d('Apple','iPhone 16 Pro','Smartphone',700,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':60,'512GB':115,'1TB':195},`${G}/apple/apple-iphone-16-pro-0.jpg`),
    d('Apple','iPhone 16 Plus','Smartphone',560,['128GB','256GB','512GB'],{'128GB':0,'256GB':50,'512GB':95},`${G}/apple/apple-iphone-16-plus-0.jpg`),
    d('Apple','iPhone 16','Smartphone',480,['128GB','256GB','512GB'],{'128GB':0,'256GB':45,'512GB':85},`${G}/apple/apple-iphone-16-0.jpg`),

    d('Apple','iPhone 15 Pro Max','Smartphone',650,['256GB','512GB','1TB'],{'256GB':0,'512GB':65,'1TB':135},`${G}/apple/apple-iphone-15-pro-max-0.jpg`),
    d('Apple','iPhone 15 Pro','Smartphone',560,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':55,'512GB':105,'1TB':180},`${G}/apple/apple-iphone-15-pro-0.jpg`),
    d('Apple','iPhone 15 Plus','Smartphone',420,['128GB','256GB','512GB'],{'128GB':0,'256GB':42,'512GB':80},`${G}/apple/apple-iphone-15-plus-0.jpg`),
    d('Apple','iPhone 15','Smartphone',370,['128GB','256GB','512GB'],{'128GB':0,'256GB':38,'512GB':75},`${G}/apple/apple-iphone-15-0.jpg`),

    d('Apple','iPhone 14 Pro Max','Smartphone',490,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':48,'512GB':95,'1TB':165},`${G}/apple/apple-iphone-14-pro-max-0.jpg`),
    d('Apple','iPhone 14 Pro','Smartphone',415,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':43,'512GB':85,'1TB':148},`${G}/apple/apple-iphone-14-pro-0.jpg`),
    d('Apple','iPhone 14 Plus','Smartphone',305,['128GB','256GB','512GB'],{'128GB':0,'256GB':33,'512GB':65},`${G}/apple/apple-iphone-14-plus-0.jpg`),
    d('Apple','iPhone 14','Smartphone',265,['128GB','256GB','512GB'],{'128GB':0,'256GB':28,'512GB':58},`${G}/apple/apple-iphone-14-0.jpg`),

    d('Apple','iPhone 13 Pro Max','Smartphone',360,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':38,'512GB':75,'1TB':125},`${G}/apple/apple-iphone-13-pro-max-0.jpg`),
    d('Apple','iPhone 13 Pro','Smartphone',305,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':33,'512GB':65,'1TB':110},`${G}/apple/apple-iphone-13-pro-0.jpg`),
    d('Apple','iPhone 13','Smartphone',220,['128GB','256GB','512GB'],{'128GB':0,'256GB':27,'512GB':55},`${G}/apple/apple-iphone-13-0.jpg`),
    d('Apple','iPhone 13 mini','Smartphone',178,['128GB','256GB','512GB'],{'128GB':0,'256GB':22,'512GB':45},`${G}/apple/apple-iphone-13-mini-0.jpg`),

    d('Apple','iPhone 12 Pro Max','Smartphone',248,['128GB','256GB','512GB'],{'128GB':0,'256GB':28,'512GB':55},`${G}/apple/apple-iphone-12-pro-max-0.jpg`),
    d('Apple','iPhone 12 Pro','Smartphone',210,['128GB','256GB','512GB'],{'128GB':0,'256GB':23,'512GB':48},`${G}/apple/apple-iphone-12-pro-0.jpg`),
    d('Apple','iPhone 12','Smartphone',160,['64GB','128GB','256GB'],{'64GB':-15,'128GB':0,'256GB':22},`${G}/apple/apple-iphone-12-0.jpg`),
    d('Apple','iPhone 12 mini','Smartphone',130,['64GB','128GB','256GB'],{'64GB':-10,'128GB':0,'256GB':18},`${G}/apple/apple-iphone-12-mini-0.jpg`),

    d('Apple','iPhone 11 Pro Max','Smartphone',165,['64GB','256GB','512GB'],{'64GB':-8,'256GB':18,'512GB':40},`${G}/apple/apple-iphone-11-pro-max-0.jpg`),
    d('Apple','iPhone 11 Pro','Smartphone',140,['64GB','256GB','512GB'],{'64GB':-8,'256GB':15,'512GB':35},`${G}/apple/apple-iphone-11-pro-0.jpg`),
    d('Apple','iPhone 11','Smartphone',105,['64GB','128GB','256GB'],{'64GB':-7,'128GB':0,'256GB':12},`${G}/apple/apple-iphone-11-0.jpg`),

    d('Apple','iPhone XS Max','Smartphone',110,['64GB','256GB','512GB'],{'64GB':-10,'256GB':15,'512GB':30},`${G}/apple/apple-iphone-xs-max-5.jpg`),
    d('Apple','iPhone XS','Smartphone',90,['64GB','256GB','512GB'],{'64GB':-10,'256GB':15,'512GB':25},`${G}/apple/apple-iphone-xs-3.jpg`),
    d('Apple','iPhone XR','Smartphone',80,['64GB','128GB','256GB'],{'64GB':-10,'128GB':0,'256GB':15},`${G}/apple/apple-iphone-xr-new.jpg`),
    d('Apple','iPhone X','Smartphone',70,['64GB','256GB'],{'64GB':-10,'256GB':15},`${G}/apple/apple-iphone-x-new-1.jpg`),

    d('Apple','iPhone SE (2022)','Smartphone',120,['64GB','128GB','256GB'],{'64GB':-15,'128GB':0,'256GB':20},`${G}/apple/apple-iphone-se-2022-1.jpg`),
    d('Apple','iPhone SE (2020)','Smartphone',65,['64GB','128GB','256GB'],{'64GB':-10,'128GB':0,'256GB':15},`${G}/apple/apple-iphone-se-2020-2.jpg`),
    d('Apple','iPhone 8 Plus','Smartphone',55,['64GB','128GB','256GB'],{'64GB':-5,'128GB':0,'256GB':12},`${G}/apple/apple-iphone-8-plus-2.jpg`),
    d('Apple','iPhone 8','Smartphone',45,['64GB','128GB','256GB'],{'64GB':-5,'128GB':0,'256GB':10},`${G}/apple/apple-iphone-8-new-1.jpg`),

    // ── Samsung Smartphones ───────────────────────────────
    d('Samsung','Galaxy S25 Ultra','Smartphone',820,['256GB','512GB','1TB'],{'256GB':0,'512GB':72,'1TB':155},`${G}/samsung/samsung-galaxy-s25-ultra-0.jpg`),
    d('Samsung','Galaxy S25+','Smartphone',620,['256GB','512GB'],{'256GB':0,'512GB':60},`${G}/samsung/samsung-galaxy-s25plus-0.jpg`),
    d('Samsung','Galaxy S25','Smartphone',495,['128GB','256GB'],{'128GB':0,'256GB':48},`${G}/samsung/samsung-galaxy-s25-0.jpg`),

    d('Samsung','Galaxy S24 Ultra','Smartphone',670,['256GB','512GB','1TB'],{'256GB':0,'512GB':68,'1TB':142},`${G}/samsung/samsung-galaxy-s24-ultra-0.jpg`),
    d('Samsung','Galaxy S24+','Smartphone',490,['256GB','512GB'],{'256GB':0,'512GB':58},`${G}/samsung/samsung-galaxy-s24plus-0.jpg`),
    d('Samsung','Galaxy S24','Smartphone',380,['128GB','256GB'],{'128GB':0,'256GB':42},`${G}/samsung/samsung-galaxy-s24-0.jpg`),
    d('Samsung','Galaxy S24 FE','Smartphone',280,['128GB','256GB'],{'128GB':0,'256GB':35},`${G}/samsung/samsung-galaxy-s24-fe-0.jpg`),

    d('Samsung','Galaxy S23 Ultra','Smartphone',500,['256GB','512GB','1TB'],{'256GB':0,'512GB':62,'1TB':128},`${G}/samsung/samsung-galaxy-s23-ultra-0.jpg`),
    d('Samsung','Galaxy S23+','Smartphone',340,['256GB','512GB'],{'256GB':0,'512GB':52},`${G}/samsung/samsung-galaxy-s23plus-0.jpg`),
    d('Samsung','Galaxy S23','Smartphone',265,['128GB','256GB'],{'128GB':0,'256GB':37},`${G}/samsung/samsung-galaxy-s23-0.jpg`),
    d('Samsung','Galaxy S23 FE','Smartphone',198,['128GB','256GB'],{'128GB':0,'256GB':30},`${G}/samsung/samsung-galaxy-s23-fe-0.jpg`),

    d('Samsung','Galaxy S22 Ultra','Smartphone',340,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':38,'512GB':75,'1TB':125},`${G}/samsung/samsung-galaxy-s22-ultra-0.jpg`),
    d('Samsung','Galaxy S22+','Smartphone',225,['128GB','256GB'],{'128GB':0,'256GB':32},`${G}/samsung/samsung-galaxy-s22plus-0.jpg`),
    d('Samsung','Galaxy S22','Smartphone',180,['128GB','256GB'],{'128GB':0,'256GB':27},`${G}/samsung/samsung-galaxy-s22-0.jpg`),

    d('Samsung','Galaxy S21 Ultra','Smartphone',240,['128GB','256GB'],{'128GB':0,'256GB':30},`${G}/samsung/samsung-galaxy-s21-ultra-5g-0.jpg`),
    d('Samsung','Galaxy S21+','Smartphone',175,['128GB','256GB'],{'128GB':0,'256GB':25},`${G}/samsung/samsung-galaxy-s21plus-5g-0.jpg`),
    d('Samsung','Galaxy S21','Smartphone',140,['128GB','256GB'],{'128GB':0,'256GB':22},`${G}/samsung/samsung-galaxy-s21-5g-0.jpg`),

    d('Samsung','Galaxy Z Fold 6','Smartphone',820,['256GB','512GB','1TB'],{'256GB':0,'512GB':78,'1TB':158},`${G}/samsung/samsung-galaxy-z-fold6-0.jpg`),
    d('Samsung','Galaxy Z Flip 6','Smartphone',480,['256GB','512GB'],{'256GB':0,'512GB':57},`${G}/samsung/samsung-galaxy-z-flip6-0.jpg`),
    d('Samsung','Galaxy Z Fold 5','Smartphone',650,['256GB','512GB','1TB'],{'256GB':0,'512GB':68,'1TB':135},`${G}/samsung/samsung-galaxy-z-fold5-0.jpg`),
    d('Samsung','Galaxy Z Flip 5','Smartphone',355,['256GB','512GB'],{'256GB':0,'512GB':52},`${G}/samsung/samsung-galaxy-z-flip5-0.jpg`),
    d('Samsung','Galaxy Z Fold 4','Smartphone',480,['256GB','512GB','1TB'],{'256GB':0,'512GB':58,'1TB':115},`${G}/samsung/samsung-galaxy-z-fold4-0.jpg`),
    d('Samsung','Galaxy Z Flip 4','Smartphone',240,['128GB','256GB'],{'128GB':0,'256GB':40},`${G}/samsung/samsung-galaxy-z-flip4-0.jpg`),

    d('Samsung','Galaxy A56','Smartphone',195,['128GB','256GB'],{'128GB':0,'256GB':30},`${G}/samsung/samsung-galaxy-a56-0.jpg`),
    d('Samsung','Galaxy A55','Smartphone',168,['128GB','256GB'],{'128GB':0,'256GB':28},`${G}/samsung/samsung-galaxy-a55-0.jpg`),
    d('Samsung','Galaxy A54','Smartphone',135,['128GB','256GB'],{'128GB':0,'256GB':25},`${G}/samsung/samsung-galaxy-a54-0.jpg`),
    d('Samsung','Galaxy A35','Smartphone',118,['128GB','256GB'],{'128GB':0,'256GB':22},`${G}/samsung/samsung-galaxy-a35-0.jpg`),
    d('Samsung','Galaxy A15','Smartphone',75,['128GB','256GB'],{'128GB':0,'256GB':18},`${G}/samsung/samsung-galaxy-a15-0.jpg`),

    // ── Google Pixel ──────────────────────────────────────
    d('Google','Pixel 9 Pro XL','Smartphone',640,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':52,'512GB':105,'1TB':175},`${G}/google/google-pixel-9-pro-xl-0.jpg`),
    d('Google','Pixel 9 Pro Fold','Smartphone',850,['256GB','512GB'],{'256GB':0,'512GB':80},`${G}/google/google-pixel-9-pro-fold-0.jpg`),
    d('Google','Pixel 9 Pro','Smartphone',548,['128GB','256GB','512GB'],{'128GB':0,'256GB':48,'512GB':95},`${G}/google/google-pixel-9-pro-0.jpg`),
    d('Google','Pixel 9','Smartphone',415,['128GB','256GB'],{'128GB':0,'256GB':43},`${G}/google/google-pixel-9-0.jpg`),
    d('Google','Pixel 8 Pro','Smartphone',400,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':42,'512GB':85,'1TB':142},`${G}/google/google-pixel-8-pro-0.jpg`),
    d('Google','Pixel 8','Smartphone',295,['128GB','256GB'],{'128GB':0,'256GB':37},`${G}/google/google-pixel-8-0.jpg`),
    d('Google','Pixel 8a','Smartphone',262,['128GB','256GB'],{'128GB':0,'256GB':35},`${G}/google/google-pixel-8a-0.jpg`),
    d('Google','Pixel 7 Pro','Smartphone',255,['128GB','256GB','512GB'],{'128GB':0,'256GB':33,'512GB':67},`${G}/google/google-pixel-7-pro-0.jpg`),
    d('Google','Pixel 7','Smartphone',188,['128GB','256GB'],{'128GB':0,'256GB':27},`${G}/google/google-pixel-7-0.jpg`),
    d('Google','Pixel 7a','Smartphone',162,['128GB'],{'128GB':0},`${G}/google/google-pixel-7a-0.jpg`),
    d('Google','Pixel 6 Pro','Smartphone',155,['128GB','256GB','512GB'],{'128GB':0,'256GB':25,'512GB':48},`${G}/google/google-pixel-6-pro-0.jpg`),
    d('Google','Pixel 6','Smartphone',120,['128GB','256GB'],{'128GB':0,'256GB':22},`${G}/google/google-pixel-6-0.jpg`),
    d('Google','Pixel 6a','Smartphone',110,['128GB'],{'128GB':0},`${G}/google/google-pixel-6a-0.jpg`),

    // ── Xiaomi ────────────────────────────────────────────
    d('Xiaomi','Xiaomi 15 Ultra','Smartphone',720,['256GB','512GB'],{'256GB':0,'512GB':68},`${G}/xiaomi/xiaomi-15-ultra-0.jpg`),
    d('Xiaomi','Xiaomi 15','Smartphone',520,['256GB','512GB'],{'256GB':0,'512GB':55},`${G}/xiaomi/xiaomi-15-0.jpg`),
    d('Xiaomi','Xiaomi 14 Ultra','Smartphone',540,['256GB','512GB'],{'256GB':0,'512GB':58},`${G}/xiaomi/xiaomi-14-ultra-0.jpg`),
    d('Xiaomi','Xiaomi 14','Smartphone',390,['256GB','512GB'],{'256GB':0,'512GB':48},`${G}/xiaomi/xiaomi-14-0.jpg`),
    d('Xiaomi','Xiaomi 13 Ultra','Smartphone',335,['256GB','512GB'],{'256GB':0,'512GB':45},`${G}/xiaomi/xiaomi-13-ultra-0.jpg`),
    d('Xiaomi','Xiaomi 13','Smartphone',248,['128GB','256GB'],{'128GB':0,'256GB':32},`${G}/xiaomi/xiaomi-13-0.jpg`),
    d('Xiaomi','Xiaomi 13T Pro','Smartphone',285,['256GB','512GB'],{'256GB':0,'512GB':40},`${G}/xiaomi/xiaomi-13t-pro-0.jpg`),
    d('Xiaomi','Xiaomi 13T','Smartphone',220,['256GB','512GB'],{'256GB':0,'512GB':35},`${G}/xiaomi/xiaomi-13t-0.jpg`),
    d('Xiaomi','Xiaomi 12','Smartphone',185,['128GB','256GB'],{'128GB':0,'256GB':28},`${G}/xiaomi/xiaomi-12-0.jpg`),
    d('Xiaomi','Redmi Note 13 Pro','Smartphone',148,['128GB','256GB'],{'128GB':0,'256GB':25},`${G}/xiaomi/xiaomi-redmi-note-13-pro-0.jpg`),
    d('Xiaomi','Redmi Note 12 Pro','Smartphone',118,['128GB','256GB'],{'128GB':0,'256GB':22},`${G}/xiaomi/xiaomi-redmi-note-12-pro-0.jpg`),

    // ── OnePlus ───────────────────────────────────────────
    d('OnePlus','OnePlus 13','Smartphone',440,['256GB','512GB'],{'256GB':0,'512GB':53},`${G}/oneplus/oneplus-13-0.jpg`),
    d('OnePlus','OnePlus 12','Smartphone',335,['256GB','512GB'],{'256GB':0,'512GB':48},`${G}/oneplus/oneplus-12-0.jpg`),
    d('OnePlus','OnePlus 11','Smartphone',255,['128GB','256GB'],{'128GB':0,'256GB':35},`${G}/oneplus/oneplus-11-0.jpg`),
    d('OnePlus','OnePlus 12R','Smartphone',210,['128GB','256GB'],{'128GB':0,'256GB':30},`${G}/oneplus/oneplus-12r-0.jpg`),

    // ── Sony Xperia ───────────────────────────────────────
    d('Sony','Xperia 1 VI','Smartphone',580,['256GB','512GB'],{'256GB':0,'512GB':65},`${G}/sony/sony-xperia-1-vi-0.jpg`),
    d('Sony','Xperia 5 VI','Smartphone',420,['128GB','256GB'],{'128GB':0,'256GB':45},`${G}/sony/sony-xperia-5-vi-0.jpg`),
    d('Sony','Xperia 1 V','Smartphone',420,['256GB','512GB'],{'256GB':0,'512GB':58},`${G}/sony/sony-xperia-1-v-0.jpg`),
    d('Sony','Xperia 5 V','Smartphone',305,['128GB','256GB'],{'128GB':0,'256GB':38},`${G}/sony/sony-xperia-5-v-0.jpg`),

    // ── OPPO ──────────────────────────────────────────────
    d('OPPO','Find X8 Pro','Smartphone',480,['256GB','512GB'],{'256GB':0,'512GB':60},`${G}/oppo/oppo-find-x8-pro-0.jpg`),
    d('OPPO','Find X7 Ultra','Smartphone',380,['256GB','512GB'],{'256GB':0,'512GB':55},`${G}/oppo/oppo-find-x7-ultra-0.jpg`),
    d('OPPO','Reno 12 Pro','Smartphone',195,['256GB','512GB'],{'256GB':0,'512GB':35},`${G}/oppo/oppo-reno12-pro-0.jpg`),

    // ══════════════════════════════════════════════════════
    //                  📱 TABLETS
    // ══════════════════════════════════════════════════════

    // ── Apple iPad ────────────────────────────────────────
    d('Apple','iPad Pro 13 M4 (2024)','Tablet',780,['256GB','512GB','1TB','2TB'],{'256GB':0,'512GB':80,'1TB':170,'2TB':280},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-pro-13-m4-0.jpg'),
    d('Apple','iPad Pro 11 M4 (2024)','Tablet',620,['256GB','512GB','1TB','2TB'],{'256GB':0,'512GB':75,'1TB':155,'2TB':260},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-pro-11-m4-0.jpg'),
    d('Apple','iPad Pro 12.9 M2 (2022)','Tablet',550,['128GB','256GB','512GB','1TB','2TB'],{'128GB':0,'256GB':65,'512GB':130,'1TB':215,'2TB':320},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-pro-129-2022-0.jpg'),
    d('Apple','iPad Pro 11 M2 (2022)','Tablet',420,['128GB','256GB','512GB','1TB','2TB'],{'128GB':0,'256GB':60,'512GB':120,'1TB':200,'2TB':300},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-pro-11-2022-0.jpg'),
    d('Apple','iPad Air M2 (2024)','Tablet',460,['128GB','256GB','512GB','1TB'],{'128GB':0,'256GB':65,'512GB':130,'1TB':200},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-air-m2-2024-0.jpg'),
    d('Apple','iPad Air 5 (2022)','Tablet',320,['64GB','256GB'],{'64GB':0,'256GB':70},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-air-5-2022-0.jpg'),
    d('Apple','iPad (10th gen, 2022)','Tablet',240,['64GB','256GB'],{'64GB':0,'256GB':60},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-2022-0.jpg'),
    d('Apple','iPad (9th gen, 2021)','Tablet',170,['64GB','256GB'],{'64GB':0,'256GB':52},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-2021-0.jpg'),
    d('Apple','iPad mini 7 (2024)','Tablet',360,['128GB','256GB','512GB'],{'128GB':0,'256GB':60,'512GB':115},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-mini-7-0.jpg'),
    d('Apple','iPad mini 6 (2021)','Tablet',280,['64GB','256GB'],{'64GB':0,'256GB':65},'https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-mini-2021-0.jpg'),

    // ── Samsung Galaxy Tab ────────────────────────────────
    d('Samsung','Galaxy Tab S10 Ultra','Tablet',580,['256GB','512GB','1TB'],{'256GB':0,'512GB':75,'1TB':155},`${G}/samsung/samsung-galaxy-tab-s10-ultra-0.jpg`),
    d('Samsung','Galaxy Tab S10+','Tablet',460,['256GB','512GB'],{'256GB':0,'512GB':68},`${G}/samsung/samsung-galaxy-tab-s10-plus-0.jpg`),
    d('Samsung','Galaxy Tab S10','Tablet',365,['256GB','512GB'],{'256GB':0,'512GB':60},`${G}/samsung/samsung-galaxy-tab-s10-0.jpg`),
    d('Samsung','Galaxy Tab S9 Ultra','Tablet',480,['256GB','512GB','1TB'],{'256GB':0,'512GB':70,'1TB':142},`${G}/samsung/samsung-galaxy-tab-s9-ultra-0.jpg`),
    d('Samsung','Galaxy Tab S9+','Tablet',360,['256GB','512GB'],{'256GB':0,'512GB':62},`${G}/samsung/samsung-galaxy-tab-s9-plus-0.jpg`),
    d('Samsung','Galaxy Tab S9','Tablet',285,['128GB','256GB'],{'128GB':0,'256GB':48},`${G}/samsung/samsung-galaxy-tab-s9-0.jpg`),
    d('Samsung','Galaxy Tab S9 FE','Tablet',210,['128GB','256GB'],{'128GB':0,'256GB':38},`${G}/samsung/samsung-galaxy-tab-s9-fe-0.jpg`),
    d('Samsung','Galaxy Tab S8 Ultra','Tablet',350,['128GB','256GB','512GB'],{'128GB':0,'256GB':52,'512GB':105},`${G}/samsung/samsung-galaxy-tab-s8-ultra-0.jpg`),
    d('Samsung','Galaxy Tab A9+','Tablet',145,['64GB','128GB'],{'64GB':0,'128GB':32},`${G}/samsung/samsung-galaxy-tab-a9-plus-0.jpg`),

    // ── Microsoft Surface ─────────────────────────────────
    d('Microsoft','Surface Pro 11','Tablet',680,['256GB','512GB','1TB'],{'256GB':0,'512GB':120,'1TB':230},'https://fdn2.gsmarena.com/vv/pics/microsoft/microsoft-surface-pro-11-0.jpg'),
    d('Microsoft','Surface Pro 9','Tablet',480,['128GB','256GB','512GB'],{'128GB':0,'256GB':100,'512GB':195},'https://fdn2.gsmarena.com/vv/pics/microsoft/microsoft-surface-pro-9-0.jpg'),

    // ══════════════════════════════════════════════════════
    //                  💻 LAPTOPS
    // ══════════════════════════════════════════════════════

    // ── Apple MacBook ─────────────────────────────────────
    d('Apple','MacBook Pro 16 M4 (2024)','Laptop',1600,['512GB','1TB','2TB'],{'512GB':0,'1TB':180,'2TB':380},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-pro-16-2024-0.jpg'),
    d('Apple','MacBook Pro 14 M4 (2024)','Laptop',1200,['512GB','1TB','2TB'],{'512GB':0,'1TB':155,'2TB':320},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-pro-14-2024-0.jpg'),
    d('Apple','MacBook Pro 16 M3 (2023)','Laptop',1380,['512GB','1TB','2TB','4TB'],{'512GB':0,'1TB':165,'2TB':340,'4TB':600},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-pro-16-2023-0.jpg'),
    d('Apple','MacBook Pro 14 M3 (2023)','Laptop',1050,['512GB','1TB','2TB'],{'512GB':0,'1TB':145,'2TB':295},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-pro-14-2023-0.jpg'),
    d('Apple','MacBook Pro 16 M2 (2022)','Laptop',1100,['512GB','1TB','2TB','4TB'],{'512GB':0,'1TB':150,'2TB':305,'4TB':530},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-pro-16-2022-0.jpg'),
    d('Apple','MacBook Pro 14 M2 (2022)','Laptop',850,['512GB','1TB','2TB'],{'512GB':0,'1TB':130,'2TB':265},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-pro-14-2022-0.jpg'),
    d('Apple','MacBook Air 15 M3 (2024)','Laptop',860,['256GB','512GB','1TB','2TB'],{'256GB':0,'512GB':90,'1TB':175,'2TB':310},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-air-15-2024-0.jpg'),
    d('Apple','MacBook Air 13 M3 (2024)','Laptop',720,['256GB','512GB','1TB','2TB'],{'256GB':0,'512GB':85,'1TB':165,'2TB':290},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-air-13-2024-0.jpg'),
    d('Apple','MacBook Air 15 M2 (2023)','Laptop',720,['256GB','512GB','1TB'],{'256GB':0,'512GB':80,'1TB':158},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-air-15-0.jpg'),
    d('Apple','MacBook Air 13 M2 (2022)','Laptop',580,['256GB','512GB','1TB'],{'256GB':0,'512GB':75,'1TB':148},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-air-13-m2-0.jpg'),
    d('Apple','MacBook Air M1 (2020)','Laptop',420,['256GB','512GB','1TB'],{'256GB':0,'512GB':68,'1TB':135},'https://fdn2.gsmarena.com/vv/pics/apple/apple-macbook-air-2020-0.jpg'),

    // ── Dell ──────────────────────────────────────────────
    d('Dell','XPS 15 (2024)','Laptop',880,['512GB','1TB','2TB'],{'512GB':0,'1TB':145,'2TB':295},'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/512px-Dell_Logo.svg.png'),
    d('Dell','XPS 13 (2024)','Laptop',620,['256GB','512GB','1TB'],{'256GB':0,'512GB':90,'1TB':175},'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/512px-Dell_Logo.svg.png'),
    d('Dell','Latitude 14','Laptop',420,['256GB','512GB'],{'256GB':0,'512GB':75},'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/512px-Dell_Logo.svg.png'),
    d('Dell','Inspiron 15','Laptop',280,['256GB','512GB'],{'256GB':0,'512GB':55},'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/512px-Dell_Logo.svg.png'),

    // ── Lenovo ────────────────────────────────────────────
    d('Lenovo','ThinkPad X1 Carbon','Laptop',540,['256GB','512GB','1TB'],{'256GB':0,'512GB':85,'1TB':168},'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/512px-Lenovo_logo_2015.svg.png'),
    d('Lenovo','ThinkPad T14','Laptop',380,['256GB','512GB'],{'256GB':0,'512GB':72},'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/512px-Lenovo_logo_2015.svg.png'),
    d('Lenovo','IdeaPad 5','Laptop',260,['256GB','512GB'],{'256GB':0,'512GB':52},'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/512px-Lenovo_logo_2015.svg.png'),
    d('Lenovo','Yoga 9i','Laptop',580,['512GB','1TB'],{'512GB':0,'1TB':120},'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/512px-Lenovo_logo_2015.svg.png'),

    // ── HP ────────────────────────────────────────────────
    d('HP','EliteBook 840','Laptop',380,['256GB','512GB'],{'256GB':0,'512GB':70},'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/512px-HP_logo_2012.svg.png'),
    d('HP','Spectre x360','Laptop',620,['512GB','1TB'],{'512GB':0,'1TB':115},'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/512px-HP_logo_2012.svg.png'),
    d('HP','Pavilion 15','Laptop',230,['256GB','512GB'],{'256GB':0,'512GB':48},'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/512px-HP_logo_2012.svg.png'),

    // ── Microsoft Surface Laptop ──────────────────────────
    d('Microsoft','Surface Laptop 6','Laptop',720,['256GB','512GB','1TB'],{'256GB':0,'512GB':110,'1TB':210},'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png'),
    d('Microsoft','Surface Laptop 5','Laptop',520,['256GB','512GB','1TB'],{'256GB':0,'512GB':95,'1TB':185},'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png'),

    // ══════════════════════════════════════════════════════
    //                  🎮 GAMING CONSOLES
    // ══════════════════════════════════════════════════════

    d('Sony','PlayStation 5 (Disc)','Gaming',280,['825GB'],{'825GB':0},'https://fdn2.gsmarena.com/vv/pics/sony/sony-playstation-5-1.jpg'),
    d('Sony','PlayStation 5 Slim','Gaming',260,['1TB'],{'1TB':0},'https://fdn2.gsmarena.com/vv/pics/sony/sony-playstation-5-slim-0.jpg'),
    d('Sony','PlayStation 5 Digital','Gaming',220,['825GB'],{'825GB':0},'https://fdn2.gsmarena.com/vv/pics/sony/sony-playstation-5-digital-0.jpg'),
    d('Sony','PlayStation 4 Pro','Gaming',120,['1TB','2TB'],{'1TB':0,'2TB':25},'https://fdn2.gsmarena.com/vv/pics/sony/sony-playstation-4-pro-1.jpg'),
    d('Sony','PlayStation 4 Slim','Gaming',80,['500GB','1TB'],{'500GB':0,'1TB':18},'https://fdn2.gsmarena.com/vv/pics/sony/sony-playstation-4-slim-1.jpg'),

    d('Microsoft','Xbox Series X','Gaming',220,['1TB'],{'1TB':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/512px-Xbox_one_logo.svg.png'),
    d('Microsoft','Xbox Series S','Gaming',148,['512GB'],{'512GB':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/512px-Xbox_one_logo.svg.png'),
    d('Microsoft','Xbox One X','Gaming',88,['1TB'],{'1TB':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/512px-Xbox_one_logo.svg.png'),

    d('Nintendo','Switch OLED','Gaming',158,['64GB'],{'64GB':0},'https://fdn2.gsmarena.com/vv/pics/nintendo/nintendo-switch-oled-0.jpg'),
    d('Nintendo','Switch V2','Gaming',115,['32GB'],{'32GB':0},'https://fdn2.gsmarena.com/vv/pics/nintendo/nintendo-switch-2017-0.jpg'),
    d('Nintendo','Switch Lite','Gaming',88,['32GB'],{'32GB':0},'https://fdn2.gsmarena.com/vv/pics/nintendo/nintendo-switch-lite-0.jpg'),

    // ══════════════════════════════════════════════════════
    //                  ⌚ SMARTWATCHES
    // ══════════════════════════════════════════════════════

    d('Apple','Apple Watch Ultra 2','Smartwatch',440,['49mm'],{'49mm':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-ultra-2-0.jpg'),
    d('Apple','Apple Watch Ultra 1','Smartwatch',340,['49mm'],{'49mm':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-ultra-1.jpg'),
    d('Apple','Apple Watch Series 10','Smartwatch',280,['42mm','46mm'],{'42mm':0,'46mm':30},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-series-10-0.jpg'),
    d('Apple','Apple Watch Series 9','Smartwatch',230,['41mm','45mm'],{'41mm':0,'45mm':28},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-series-9-0.jpg'),
    d('Apple','Apple Watch Series 8','Smartwatch',175,['41mm','45mm'],{'41mm':0,'45mm':25},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-series-8-0.jpg'),
    d('Apple','Apple Watch Series 7','Smartwatch',130,['41mm','45mm'],{'41mm':0,'45mm':22},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-series-7-0.jpg'),
    d('Apple','Apple Watch SE (2nd gen)','Smartwatch',118,['40mm','44mm'],{'40mm':0,'44mm':20},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-se-2022-0.jpg'),
    d('Apple','Apple Watch SE (1st gen)','Smartwatch',82,['40mm','44mm'],{'40mm':0,'44mm':18},'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-se-2020-0.jpg'),

    d('Samsung','Galaxy Watch 7','Smartwatch',175,['40mm','44mm'],{'40mm':0,'44mm':25},`${G}/samsung/samsung-galaxy-watch7-0.jpg`),
    d('Samsung','Galaxy Watch Ultra','Smartwatch',280,['47mm'],{'47mm':0},`${G}/samsung/samsung-galaxy-watch-ultra-0.jpg`),
    d('Samsung','Galaxy Watch 6 Classic','Smartwatch',145,['43mm','47mm'],{'43mm':0,'47mm':28},`${G}/samsung/samsung-galaxy-watch6-classic-0.jpg`),
    d('Samsung','Galaxy Watch 6','Smartwatch',110,['40mm','44mm'],{'40mm':0,'44mm':22},`${G}/samsung/samsung-galaxy-watch6-0.jpg`),
    d('Samsung','Galaxy Watch 5 Pro','Smartwatch',95,['45mm'],{'45mm':0},`${G}/samsung/samsung-galaxy-watch5-pro-0.jpg`),

    d('Garmin','Fenix 8','Smartwatch',420,['47mm','51mm'],{'47mm':0,'51mm':48},'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Garmin_Logo_2006.svg/512px-Garmin_Logo_2006.svg.png'),
    d('Garmin','Forerunner 965','Smartwatch',285,['47mm'],{'47mm':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Garmin_Logo_2006.svg/512px-Garmin_Logo_2006.svg.png'),

    // ══════════════════════════════════════════════════════
    //                  🎧 AUDIO
    // ══════════════════════════════════════════════════════

    d('Apple','AirPods Pro (2nd gen)','Audio',120,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-airpods-pro-2.jpg'),
    d('Apple','AirPods Pro (1st gen)','Audio',72,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-airpods-pro-2019.jpg'),
    d('Apple','AirPods (4th gen)','Audio',85,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-airpods-4-0.jpg'),
    d('Apple','AirPods (3rd gen)','Audio',55,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-airpods-3.jpg'),
    d('Apple','AirPods Max','Audio',255,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/apple/apple-airpods-max-1.jpg'),

    d('Sony','WH-1000XM5','Audio',148,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/sony/sony-wh-1000xm5-0.jpg'),
    d('Sony','WH-1000XM4','Audio',95,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/sony/sony-wh-1000xm4-0.jpg'),
    d('Sony','WF-1000XM5','Audio',110,['1 Pair'],{'1 Pair':0},'https://fdn2.gsmarena.com/vv/pics/sony/sony-wf-1000xm5-0.jpg'),

    d('Bose','QuietComfort 45','Audio',118,['1 Pair'],{'1 Pair':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Bose_wordmark.svg/512px-Bose_wordmark.svg.png'),
    d('Bose','QuietComfort Ultra','Audio',155,['1 Pair'],{'1 Pair':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Bose_wordmark.svg/512px-Bose_wordmark.svg.png'),
    d('Bose','QuietComfort Earbuds II','Audio',88,['1 Pair'],{'1 Pair':0},'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Bose_wordmark.svg/512px-Bose_wordmark.svg.png'),

    d('Samsung','Galaxy Buds3 Pro','Audio',85,['1 Pair'],{'1 Pair':0},`${G}/samsung/samsung-galaxy-buds3-pro-0.jpg`),
    d('Samsung','Galaxy Buds2 Pro','Audio',55,['1 Pair'],{'1 Pair':0},`${G}/samsung/samsung-galaxy-buds2-pro-0.jpg`),
];

// ─── Seed Function ────────────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`\n📦 Total devices to seed: ${devices.length}\n`);

    const summary = {};
    let inserted = 0, updated = 0;

    for (const device of devices) {
        const existing = await DeviceBlueprint.findOne({ model: device.model, brand: device.brand });
        if (existing) {
            await DeviceBlueprint.updateOne({ _id: existing._id }, { $set: device });
            updated++;
        } else {
            await DeviceBlueprint.create(device);
            inserted++;
        }
        summary[device.category] = (summary[device.category] || 0) + 1;
    }

    console.log('\n📊 Seeded by Category:');
    Object.entries(summary).forEach(([cat, count]) => {
        console.log(`  ${cat.padEnd(15)} → ${count} devices`);
    });
    console.log(`\n🎉 Done! Inserted: ${inserted}, Updated: ${updated}, Total: ${devices.length}`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
