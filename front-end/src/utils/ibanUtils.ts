// IBAN validation for DE/AT/CH
export const validateIban = (iban: string, t: any): { valid: boolean; message?: string } => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 15 || cleaned.length > 34) {
        return { valid: false, message: t('sellDevice.ibanLength', { length: 34 }) };
    }
    const countryCode = cleaned.substring(0, 2);
    const lengths: Record<string, number> = { DE: 22, AT: 20, CH: 21 };
    const patterns: Record<string, RegExp> = {
        DE: /^DE\d{20}$/,
        AT: /^AT\d{18}$/,
        CH: /^CH\d{19}$/
    };

    if (!lengths[countryCode]) {
        return { valid: false, message: t('sellDevice.ibanCountryOnly') };
    }

    if (lengths[countryCode] && cleaned.length !== lengths[countryCode]) {
        return { valid: false, message: t('sellDevice.ibanCountryError', { country: countryCode, length: lengths[countryCode] }) };
    }
    if (patterns[countryCode] && !patterns[countryCode].test(cleaned)) {
        return { valid: false, message: t('sellDevice.ibanFormat') };
    }
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
        return { valid: false, message: t('sellDevice.ibanFormat') };
    }
    return { valid: true };
};

export const formatIban = (value: string): string => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

export const maskIban = (iban: string) => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 10) return iban;
    return cleaned.slice(0, 6) + ' **** **** ' + cleaned.slice(-4);
};
