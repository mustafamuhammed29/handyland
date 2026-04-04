import React from 'react';
import { useSettings } from '../context/SettingsContext';

export const WhatsAppWidget = () => {
    const { settings } = useSettings();

    // Using global shop phone number or fallback
    const rawPhone = import.meta.env.VITE_WHATSAPP_PHONE || settings?.contactSection?.whatsappPhone || settings?.contactSection?.phone || '4915123456789';
    const phoneNumber = rawPhone.replace(/\D/g, ''); // Extract only digits for wa.me link

    const message = settings?.contactSection?.whatsappMessage || "Hello, I need help with HandyLand services.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 hover:bg-green-400 transition-all z-50 group cursor-pointer"
            aria-label="Chat on WhatsApp"
        >
            <div className="absolute right-16 px-4 py-2 bg-slate-900 border border-slate-700 text-white text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                Hilfe benötigt? Chatte mit uns!
                <div className="absolute top-1/2 -right-1 -mt-1 border-t-4 border-b-4 border-l-4 border-transparent border-l-slate-700"></div>
            </div>
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-white"
            >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.488-1.761-1.663-2.059-.175-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
        </a>
    );
};
