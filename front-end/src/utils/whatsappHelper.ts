/**
 * Helper utility to generate WhatsApp wa.me links
 */

export interface WhatsAppOrderConfig {
    phoneNumber: string;
    messageTemplate: string;
    items?: { name: string; quantity: number; price?: number }[];
    serviceName?: string;
    totalAmount?: number;
}

export const generateWhatsAppLink = (config: WhatsAppOrderConfig): string => {
    // Ensure the phone number starts with country code and removes any non-digits
    let phone = config.phoneNumber.replace(/\D/g, '');
    
    let message = config.messageTemplate || 'Hallo, ich habe eine Anfrage (Dies ist keine verbindliche Bestellung):';

    if (config.serviceName) {
        message += `\n\nAngefragter Service: *${config.serviceName}*`;
    }

    if (config.items && config.items.length > 0) {
        message += `\n\nAngefragte Artikel:\n`;
        config.items.forEach(item => {
            message += `- ${item.quantity}x ${item.name} ${item.price ? `(€${item.price.toFixed(2)})` : ''}\n`;
        });
    }

    if (config.totalAmount) {
        message += `\n*Ungefährer Wert der Anfrage: €${config.totalAmount.toFixed(2)}*`;
    }

    // Add current page URL as reference
    if (typeof window !== 'undefined') {
        message += `\n\nReferenzlink:\n${window.location.href}`;
    }

    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${phone}?text=${encodedMessage}`;
};
