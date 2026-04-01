import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan: (barcode: string) => void) {
    const minLength = 5;
    const scannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const barcodeKeys = useRef<string>('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is currently typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === 'Enter') {
                if (barcodeKeys.current.length >= minLength) {
                    onScan(barcodeKeys.current);
                }
                barcodeKeys.current = '';
                if (scannerTimer.current) clearTimeout(scannerTimer.current);
                return;
            }

            // Only capture standard characters
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                barcodeKeys.current += e.key;
                
                // Clear the buffer if the next keystroke doesn't happen fast enough
                // Scanners usually type 10-20 ms per character. Normal typing is >50ms.
                if (scannerTimer.current) clearTimeout(scannerTimer.current);
                scannerTimer.current = setTimeout(() => {
                    barcodeKeys.current = '';
                }, 100); 
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (scannerTimer.current) clearTimeout(scannerTimer.current);
        };
    }, [onScan]);
}
