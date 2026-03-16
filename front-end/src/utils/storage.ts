import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY || 'handyland-storage-secret-key-123';

/**
 * Encrypt and save data to localStorage
 */
export const setSecureItem = (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        const encrypted = CryptoJS.AES.encrypt(jsonValue, SECRET_KEY).toString();
        localStorage.setItem(key, encrypted);
    } catch (error) {
        console.error(`Error encrypting key ${key}:`, error);
    }
};

/**
 * Get and decrypt data from localStorage
 */
export const getSecureItem = (key: string): any | null => {
    try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;

        const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) return null;
        return JSON.parse(decrypted);
    } catch (error) {
        console.error(`Error decrypting key ${key}:`, error);
        return null;
    }
};

/**
 * Remove item from localStorage
 */
export const removeSecureItem = (key: string) => {
    localStorage.removeItem(key);
};
