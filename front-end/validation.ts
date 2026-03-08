export const validateEmail = (email: string): boolean => {
    // Stricter regex:
    // 1. Local part: allows alphanumeric, dots, underscores, plus, hyphen. No consecutive dots.
    // 2. Domain: allows alphanumeric, hyphen.
    // 3. TLD: at least 2 chars.
    const re = /^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8 || password.length > 20) {
        return { isValid: false, message: 'Password must be between 8 and 20 characters long.' };
    }
    if (!/[A-Za-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[@$!%*#?&]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character' };
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
