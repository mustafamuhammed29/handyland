require('dotenv').config();
const mongoose = require('mongoose');
const Translation = require('./models/Translation');

const translationsToAdd = [
    {
        key: 'cart.reserveWhatsapp',
        namespace: 'translation',
        values: {
            en: 'Reserve via WhatsApp',
            de: 'Über WhatsApp reservieren',
            ar: 'احجز عبر الواتساب',
            fa: 'رزرو از طریق واتساپ',
            ru: 'Забронировать через WhatsApp',
            tr: 'WhatsApp ile Rezerve Et'
        }
    },
    {
        key: 'product.reserveWhatsapp',
        namespace: 'translation',
        values: {
            en: 'Reserve via WhatsApp',
            de: 'Über WhatsApp reservieren',
            ar: 'احجز عبر الواتساب',
            fa: 'رزرو از طریق واتساپ',
            ru: 'Забронировать через WhatsApp',
            tr: 'WhatsApp ile Rezerve Et'
        }
    },
    {
        key: 'product.reserveWhatsappShort',
        namespace: 'translation',
        values: {
            en: 'WhatsApp',
            de: 'WhatsApp',
            ar: 'واتساب',
            fa: 'واتساپ',
            ru: 'WhatsApp',
            tr: 'WhatsApp'
        }
    }
];

async function seed() {
    try {
        console.log('Connecting to database...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        for (const item of translationsToAdd) {
            const existing = await Translation.findOne({ key: item.key });
            if (existing) {
                console.log(`Updating existing key: ${item.key}`);
                existing.values = { ...existing.values, ...item.values };
                await existing.save();
            } else {
                console.log(`Creating new key: ${item.key}`);
                await Translation.create(item);
            }
        }
        
        console.log('Done.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

seed();
