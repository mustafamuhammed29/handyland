const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['verify_email', 'reset_password', 'order_confirmation', 'sell_device_confirmation', 'abandoned_cart', 'order_status_update', 'repair_status_update', 'valuation_quote', 'valuation_device_received', 'valuation_payment_sent', 'refund_status_update']
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
        },
        {
            name: 'order_status_update',
            subject: 'Bestellungs-Update - HandyLand',
            description: 'Gesendet, wenn sich der Status einer Bestellung ändert (z. B. Versand, Stornierung).',
            variables: ['{{customerName}}', '{{orderNumber}}', '{{status}}', '{{trackingNumber}}', '{{adminNote}}', '{{frontendUrl}}'],
            html: `<h1>Status-Update für deine Bestellung</h1><p>Hallo {{customerName}},</p><p>Der Status deiner Bestellung <strong>{{orderNumber}}</strong> hat sich geändert.</p><p>Neuer Status: <strong>{{status}}</strong></p><p>Tracking: <strong>{{trackingNumber}}</strong></p><p>Nachricht vom Team: {{adminNote}}</p><p><a href="{{frontendUrl}}/dashboard?tab=orders">Bestellung ansehen</a></p>`
        },
        {
            name: 'repair_status_update',
            subject: 'Reparatur-Update - HandyLand',
            description: 'Gesendet, wenn sich der Status einer Reparatur ändert (z. B. in Bearbeitung, abgeschlossen).',
            variables: ['{{customerName}}', '{{device}}', '{{status}}', '{{frontendUrl}}'],
            html: `<h1>Status-Update für deine Reparatur</h1><p>Hallo {{customerName}},</p><p>Der Status deiner Reparatur für <strong>{{device}}</strong> hat sich geändert.</p><p>Neuer Status: <strong>{{status}}</strong></p><p><a href="{{frontendUrl}}/dashboard?tab=repairs">Reparatur ansehen</a></p>`
        },
        {
            name: 'valuation_quote',
            subject: 'Dein Angebot von HandyLand – {{quoteRef}}',
            description: 'Gesendet, wenn ein Kunde ein Bewertungsangebot für sein Gerät erhält.',
            variables: ['{{customerName}}', '{{quoteRef}}', '{{device}}', '{{price}}', '{{quoteUrl}}'],
            html: `<h1>Dein Angebot ist da!</h1><p>Hallo {{customerName}},</p><p>Wir haben dein <strong>{{device}}</strong> bewertet.</p><p>Unser Angebot: <strong>€{{price}}</strong></p><p>Referenz: <strong>{{quoteRef}}</strong></p><p>Dieses Angebot ist <strong>48 Stunden</strong> gültig.</p><p><a href="{{quoteUrl}}">Angebot ansehen und bestätigen</a></p>`
        },
        {
            name: 'valuation_device_received',
            subject: 'Wir haben dein Gerät erhalten – {{quoteRef}}',
            description: 'Gesendet, wenn das eingesandte Gerät bei HandyLand angekommen ist.',
            variables: ['{{customerName}}', '{{device}}', '{{quoteRef}}', '{{price}}'],
            html: `<h2>Dein Gerät ist bei uns angekommen!</h2><p>Liebe/r {{customerName}},</p><p>Wir haben dein <strong>{{device}}</strong> (Ref: {{quoteRef}}) erhalten und prüfen es gerade.</p><p>Nach erfolgreicher Prüfung wird die Zahlung von <strong>€{{price}}</strong> an dein Konto überwiesen.</p><p>Dies dauert in der Regel <strong>1–2 Werktage</strong>.</p><br><p>Vielen Dank für dein Vertrauen in HandyLand!</p>`
        },
        {
            name: 'valuation_payment_sent',
            subject: 'Zahlung veranlasst – {{quoteRef}}',
            description: 'Gesendet, wenn die Zahlung für ein verkauftes Gerät veranlasst wurde.',
            variables: ['{{customerName}}', '{{device}}', '{{quoteRef}}', '{{price}}'],
            html: `<h2>Deine Zahlung wurde veranlasst! 🎉</h2><p>Liebe/r {{customerName}},</p><p>Wir haben <strong>€{{price}}</strong> für dein <strong>{{device}}</strong> (Ref: {{quoteRef}}) an dein Konto überwiesen.</p><p>Der Betrag sollte innerhalb von <strong>1–3 Werktagen</strong> auf deinem Konto erscheinen.</p><br><p>Vielen Dank – wir freuen uns, dich wieder bei HandyLand begrüßen zu dürfen!</p>`
        },
        {
            name: 'refund_status_update',
            subject: 'Rückerstattungs-Update – HandyLand',
            description: 'Gesendet, wenn der Status einer Rückerstattungsanfrage aktualisiert wird.',
            variables: ['{{customerName}}', '{{orderNumber}}', '{{status}}', '{{adminComments}}'],
            html: `<h2>Hallo {{customerName}},</h2><p>Deine Rückerstattungsanfrage für Bestellung <strong>{{orderNumber}}</strong> wurde <strong>{{status}}</strong>.</p><p>{{adminComments}}</p><p>Falls du Fragen hast, kontaktiere bitte unser Support-Team.</p><p>Dein HandyLand Team</p>`
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
