import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const variantStyles = {
    danger: {
        icon: 'text-red-400',
        button: 'bg-red-600 hover:bg-red-500',
    },
    warning: {
        icon: 'text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-500',
    },
    info: {
        icon: 'text-cyan-400',
        button: 'bg-cyan-600 hover:bg-cyan-500',
    },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'warning',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 ${styles.icon}`}>
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl ${styles.button} text-white font-bold transition-all`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
