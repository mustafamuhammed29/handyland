const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RepairCase = require('./models/RepairCase');
const Settings = require('./models/Settings');

dotenv.config();

mongoose.connect('mongodb://127.0.0.1:27017/handyland', {})
    .then(() => {
        console.log('MongoDB Connected');
        seed();
    })
    .catch(err => console.log(err));

const seed = async () => {
    try {
        // 1. Seed Repair Cases
        await RepairCase.deleteMany({}); // Clear old test data to avoid duplicates for this run
        console.log('Cleared old Repair Cases');

        const cases = [
            {
                title: "iPhone 13 Pro Screen Replacement",
                category: "screen",
                difficulty: "Med",
                time: "45m",
                labelBefore: "Shattered OLED",
                labelAfter: "Original Quality",
                imgBefore: "https://images.unsplash.com/photo-1605236453806-6ff36a86fa8e?q=80&w=600&auto=format&fit=crop",
                imgAfter: "https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=600&auto=format&fit=crop",
                description: "Complete screen assembly replacement using OEM-grade parts. Restored True Tone and Face ID functionality."
            },
            {
                title: "Samsung S22 Ultra Battery",
                category: "battery",
                difficulty: "Low",
                time: "30m",
                labelBefore: "Swollen Battery",
                labelAfter: "New Cell",
                imgBefore: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop",
                imgAfter: "https://images.unsplash.com/photo-1610945415295-d96bf06715e4?q=80&w=600&auto=format&fit=crop",
                description: "Replaced degraded battery that was causing random shutdowns. Capacity restored to 100%."
            },
            {
                title: "iPad Air 4 Water Damage",
                category: "water",
                difficulty: "Expert",
                time: "3 Days",
                labelBefore: "Corroded Board",
                labelAfter: "Cleaned & Soldered",
                imgBefore: "https://images.unsplash.com/photo-1597424214738-953e5eaf8886?q=80&w=600&auto=format&fit=crop",
                imgAfter: "https://images.unsplash.com/photo-1588515724527-074a7a56616c?q=80&w=600&auto=format&fit=crop",
                description: "Ultrasonic cleaning and microsoldering repair on logic board after sea water exposure. Full data recovery achieved."
            },
            {
                title: "Pixel 7 Camera Lens",
                category: "camera",
                difficulty: "Med",
                time: "1h",
                labelBefore: "Cracked Glass",
                labelAfter: "Crystal Clear",
                imgBefore: "https://images.unsplash.com/photo-1634455848520-222a76208573?q=80&w=600&auto=format&fit=crop",
                imgAfter: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?q=80&w=600&auto=format&fit=crop",
                description: "Rear camera glass replacement. Removed dust from sensor and replaced adhesive seal."
            }
        ];

        await RepairCase.insertMany(cases);
        console.log(`Added ${cases.length} Repair Cases`);

        // 2. Ensure Settings Exist
        const defaultSettings = {
            hero: {
                headline: "Reparatur & Service",
                subheadline: "Professionell, Schnell & Zuverlässig",
                bgStart: "#0a0a0a",
                bgEnd: "#1a1a1a",
                accentColor: "#3b82f6",
                buttonMarket: "Markt betreten",
                buttonValuation: "Gerät bewerten",
                trustBadge1: "Verifizierte Profis",
                trustBadge2: "24h Express",
                trustBadge3: "1 Jahr Garantie"
            },
            stats: {
                devicesRepaired: 15420,
                happyCustomers: 12500,
                averageRating: 4.9,
                marketExperience: 8
            },
            valuation: {
                step1Title: "Wähle dein Gerät",
                step2Title: "Zustand beschreiben",
                step3Title: "Angebot erhalten"
            },
            content: {
                accessoriesTitle: "Premium Zubehör",
                accessoriesSubtitle: "Schütze dein Gerät mit Stil",
                repairTitle: "Service Terminal",
                repairSubtitle: "Wähle deine Reparatur"
            },
            repairArchive: {
                title: "Reparatur Archiv",
                subtitle: "Unsere Erfolgsgeschichten",
                buttonText: "Mehr anzeigen",
                totalRepairs: 5000
            }
        };

        // Update settings but preserve existing ID if any
        await Settings.findOneAndUpdate({}, defaultSettings, { upsert: true, new: true });
        console.log('Settings Updated/Seeded');

        process.exit();
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};
