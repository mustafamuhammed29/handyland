export const validateEmail = (email: string): boolean => {
    // Stricter regex:
    // 1. Local part: allows alphanumeric, dots, underscores, plus, hyphen. No consecutive dots.
    // 2. Domain: allows alphanumeric, hyphen.
    // 3. TLD: at least 2 chars.
    const re = /^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 12) {
        return { isValid: false, message: 'Password must be at least 12 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number.' };
    }
    return { isValid: true };
};

export const validatePhone = (phone: string): boolean => {
    // Basic international phone regex or generic check
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone.replace(/[\s-]/g, ''));
};

export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0;
};
