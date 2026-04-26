const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['verify_email', 'reset_password', 'order_confirmation', 'sell_device_confirmation', 'abandoned_cart']
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    html: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    variables: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Auto-seed the default templates if they don't exist
emailTemplateSchema.statics.seedDefaults = async function () {
    const templates = [
        {
            name: 'verify_email',
            subject: 'Bestätige deine E-Mail-Adresse - HandyLand',
            description: 'Gesendet an neue Benutzer zur Bestätigung der E-Mail-Adresse.',
            variables: ['{{userName}}', '{{verificationUrl}}'],
            html: `<h1>Willkommen bei HandyLand!</h1><p>Hallo {{userName}},</p><p>Bitte bestätige deine E-Mail-Adresse, indem du <a href="{{verificationUrl}}">hier klickst</a>.</p>`
        },
        {
            name: 'reset_password',
            subject: 'Anfrage zum Zurücksetzen des Passworts - HandyLand',
            description: 'Gesendet, wenn ein Benutzer ein Passwort zurücksetzen möchte.',
            variables: ['{{userName}}', '{{resetUrl}}'],
            html: `<h1>Passwort zurücksetzen</h1><p>Hallo {{userName}},</p><p>Du hast das Zurücksetzen deines Passworts angefordert. Bitte klicke <a href="{{resetUrl}}">hier</a>, um es zurückzusetzen. Dieser Link läuft in 1 Stunde ab.</p>`
        },
        {
            name: 'order_confirmation',
            subject: 'Bestellbestätigung - HandyLand',
            description: 'Gesendet, nachdem ein Benutzer erfolgreich eine Bestellung aufgegeben hat.',
            variables: ['{{orderNumber}}', '{{totalAmount}}'],
            html: `<h1>Vielen Dank für deine Bestellung!</h1><p>Deine Bestellnummer ist <strong>{{orderNumber}}</strong></p><p>Gesamtbetrag: <strong>{{totalAmount}}€</strong></p><p>Wir benachrichtigen dich, sobald deine Bestellung versandt wurde.</p>`
        },
        {
            name: 'sell_device_confirmation',
            subject: 'Versandetikett für Verkauf {{quoteRef}}',
            description: 'Gesendet an Kunden, wenn sie den Verkauf eines Geräts bestätigen.',
            variables: ['{{customerName}}', '{{device}}', '{{price}}', '{{quoteRef}}', '{{bankName}}', '{{ibanSnippet}}'],
            html: `<h1>Verkaufsbestätigung</h1><p>Liebe/r {{customerName}},</p><p>vielen Dank, dass du dein <strong>{{device}}</strong> für <strong>{{price}}€</strong> an HandyLand verkaufst.</p><p>Bitte drucke das beigefügte Versandetikett aus und sende dein Gerät innerhalb von 2 Werktagen ein.</p><div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9;"><strong>Nächste Schritte:</strong><ol><li>Setze dein Gerät auf die Werkseinstellungen zurück und entferne die iCloud/Google-Sperre.</li><li>Verpacke das Gerät sicher.</li><li>Klebe das untenstehende Etikett auf den Karton.</li><li>Gib es bei der nächsten Postfiliale ab.</li></ol></div><p>Wir werden das Gerät nach Erhalt prüfen und deine Zahlung an <strong>{{bankName}} (Endet auf {{ibanSnippet}})</strong> überweisen.</p>`
        },
        {
            name: 'abandoned_cart',
            subject: 'Dein Warenkorb wartet auf dich! 🛒',
            description: 'Gesendet an Kunden, die Artikel im Warenkorb lassen, ohne zur Kasse zu gehen.',
            variables: ['{{userName}}', '{{cartUrl}}'],
            html: `<h2>Hallo {{userName}},</h2><p>wir haben bemerkt, dass du einige tolle Artikel in deinem Warenkorb bei HandyLand gelassen hast!</p><p>Verpasse nicht die Chance und schließe deinen Kauf jetzt ab, bevor der Vorrat aufgebraucht ist.</p><br><a href="{{cartUrl}}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">Jetzt Kauf abschließen</a>`
        }
    ];

    for (const tpl of templates) {
        const exists = await this.findOne({ name: tpl.name });
        if (!exists) {
            await this.create(tpl);
            console.log(`Seeded email template: ${tpl.name}`);
        }
    }
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
