const fs = require('fs');
const path = require('path');

const fileReplacements = {
    'LoanerManager.tsx': [
        ['Geräte gesamt', 'Total Devices'],
        ['Verfügbar', 'Available'],
        ['Suchen nach', 'Search by'] // Placeholder if it says that
    ],
    'RefundManager.tsx': [
        ['Alle', 'All'],
        ['Nichtig', 'Void'], // if used here
        ['Keine Rückerstattungen gefunden', 'No refunds found']
    ],
    'WarrantyManager.tsx': [
        ['Alle', 'All'],
        ['Nichtig', 'Void'],
        ['Neue Garantie', 'New Warranty']
    ],
    'ValuationManager.tsx': [
        ['Preisrecherche', 'Price Research'],
        ['Recherchiert', 'Researched']
    ],
    'PriceResearchManager.tsx': [
        ['Preisrecherche', 'Price Research'],
        ['Recherchiert', 'Researched']
    ],
    'ValuationSettings.tsx': [
        ['Spielekonsolen', 'Gaming Consoles'],
        ['Audio & Kopfhörer', 'Audio & Headphones']
    ],
    'ShippingManager.tsx': [
        ['Lieferung in 2-4 Werktagen', 'Delivery in 2-4 business days'],
        ['Lieferung am nächsten Werktag', 'Next business day delivery'],
        ['Kostenloser Standardversand', 'Free Standard Shipping']
    ]
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

            const basename = path.basename(fullPath);
            if (fileReplacements[basename]) {
                for (const [de, en] of fileReplacements[basename]) {
                    content = content.split(de).join(en);
                }
            }

            // Also global pass for common stuff like "Suchen nach..."
            content = content.replace(/Geräte gesamt/gi, 'Total Devices');
            content = content.replace(/Suchen nach/gi, 'Search by');
            content = content.replace(/Keine.*?gefunden/gi, 'No data found');
            content = content.replace(/Preisrecherche/g, 'Price Research');
            content = content.replace(/Recherchiert/g, 'Researched');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Translated content in', fullPath);
            }
        }
    }
}

fixFiles(srcDir);
