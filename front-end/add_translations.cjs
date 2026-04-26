const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'public', 'locales');
const languages = ['en', 'de', 'ar', 'fa', 'ru', 'tr'];

const translations = {
    en: {
        cartReserve: "Reserve via WhatsApp",
        productReserve: "Reserve via WhatsApp",
        productReserveShort: "WhatsApp"
    },
    de: {
        cartReserve: "Über WhatsApp reservieren",
        productReserve: "Über WhatsApp reservieren",
        productReserveShort: "WhatsApp"
    },
    ar: {
        cartReserve: "احجز عبر الواتساب",
        productReserve: "احجز عبر الواتساب",
        productReserveShort: "واتساب"
    },
    fa: {
        cartReserve: "رزرو از طریق واتساپ",
        productReserve: "رزرو از طریق واتساپ",
        productReserveShort: "واتساپ"
    },
    ru: {
        cartReserve: "Забронировать через WhatsApp",
        productReserve: "Забронировать через WhatsApp",
        productReserveShort: "WhatsApp"
    },
    tr: {
        cartReserve: "WhatsApp ile Rezerve Et",
        productReserve: "WhatsApp ile Rezerve Et",
        productReserveShort: "WhatsApp"
    }
};

languages.forEach(lang => {
    const filePath = path.join(localesPath, lang, 'translation.json');
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.cart) {
            data.cart.reserveWhatsapp = translations[lang].cartReserve;
        }
        
        if (data.product) {
            data.product.reserveWhatsapp = translations[lang].productReserve;
            data.product.reserveWhatsappShort = translations[lang].productReserveShort;
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated translations for ${lang}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
