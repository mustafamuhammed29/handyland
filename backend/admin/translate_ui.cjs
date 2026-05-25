const fs = require('fs');
const path = require('path');

const translations = {
    // LoanerManager
    'Leihgeräte Manager': 'Loaner Phones',
    'GERÄTE GESAMT': 'TOTAL DEVICES',
    'VERFÜGBAR': 'AVAILABLE',
    // RefundManager
    'Rückerstattungen': 'Refunds',
    'OFFEN': 'OPEN',
    'IN PRÜFUNG': 'IN REVIEW',
    'GENEHMIGT': 'APPROVED',
    // WarrantyManager
    'Garantie Tracker': 'Warranty Tracker',
    'Aktiv': 'Active',
    'Abgelaufen': 'Expired',
    'Eingelöst': 'Claimed',
    // ValuationManager
    'Angebote': 'Offers',
    'BASISPREIS': 'BASE PRICE',
    'SPEICHERGRÖ0EN': 'STORAGE SIZES', // Keep the typo handling if any
    'SPEICHERGRÖßEN': 'STORAGE SIZES',
    'AKTIONEN': 'ACTIONS',
    // PriceResearchManager
    'eBay Preisrecherche': 'eBay Price Research',
    'Geräte gesamt': 'Total Devices',
    'Braucht Update': 'Needs Update',
    // ValuationSettings
    'Ankauf-Konfiguration': 'Valuation Settings',
    'Spielekonsolen': 'Gaming Consoles',
    'Audio & Kopfhörer': 'Audio & Headphones',
    // ShippingManager
    'Lieferung in 2-4 Werktagen': 'Delivery in 2-4 business days',
    'Lieferung am nächsten Werktag': 'Next business day delivery',
    'Kostenloser Standardversand': 'Free Standard Shipping'
};

const srcDir = path.join(__dirname, 'src/pages');

function fixFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            for (const [de, en] of Object.entries(translations)) {
                // simple global string replace
                content = content.split(de).join(en);
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Translated content in', fullPath);
            }
        }
    }
}

fixFiles(srcDir);
