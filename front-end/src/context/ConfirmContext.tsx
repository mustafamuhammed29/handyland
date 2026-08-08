import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
    const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>(() => () => {});

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolvePromise(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolvePromise(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                isOpen={isOpen}
                title={options.title || 'Confirm Action'}
                message={options.message}
                confirmLabel={options.confirmLabel || 'Confirm'}
                cancelLabel={options.cancelLabel || 'Cancel'}
                variant={options.variant || 'warning'}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
