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
    // Ensure the phone number starts with country code and removes any +, spaces, or dashes.
    // Example: +49 151 12345678 -> 4915112345678
    let phone = config.phoneNumber.replace(/[\s\+\-\(\)]/g, '');
    
    let message = config.messageTemplate || 'Hallo, ich interessiere mich für:';

    if (config.serviceName) {
        message += `\n\nService: *${config.serviceName}*`;
    }

    if (config.items && config.items.length > 0) {
        message += `\n\nProdukte:\n`;
        config.items.forEach(item => {
            message += `- ${item.quantity}x ${item.name} ${item.price ? `(€${item.price.toFixed(2)})` : ''}\n`;
        });
    }

    if (config.totalAmount) {
        message += `\n*Ungefährer Gesamtbetrag: €${config.totalAmount.toFixed(2)}*`;
    }

    // Add current page URL as reference
    if (typeof window !== 'undefined') {
        message += `\n\nReferenzlink:\n${window.location.href}`;
    }

    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${phone}?text=${encodedMessage}`;
};
