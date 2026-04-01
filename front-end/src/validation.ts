export const validateEmail = (email: string): boolean => {
    if (email.length > 254) return false;
    // Stricter regex:
    // 1. Local part: allows alphanumeric, dots, underscores, plus, hyphen. No consecutive dots.
    // 2. Domain: allows alphanumeric, hyphen.
    // 3. TLD: at least 2 chars.
    const re = /^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 12 || password.length > 128) {
        return { isValid: false, message: 'Password must be between 12 and 128 characters long.' };
    }
    if (!/[A-Za-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[@$!%*#?&]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character (@$!%*#?&).' };
    }
    return { isValid: true };
};

export const validatePhone = (phone: string): boolean => {
    if (phone.length > 20) return false;
    // Basic international phone regex or generic check
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone.replace(/[\s-]/g, ''));
};

export const validateName = (name: string): boolean => {
    if (name.length > 100) return false;
    return name.trim().length > 0;
};

export const validateMessage = (message: string): boolean => {
    if (message.length > 1000) return false;
    return message.trim().length > 0;
};

export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0;
};
