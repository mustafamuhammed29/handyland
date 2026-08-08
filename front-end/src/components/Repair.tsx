import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { Search, Wrench, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { RepairDevice } from './repair/types';
import { RepairDeviceModal } from './repair/RepairDeviceModal';
import { RepairCatalogList } from './repair/RepairCatalogList';
import { useCart } from '../context/CartContext';

interface RepairProps {
    lang: LanguageCode;
}

export const Repair: React.FC<RepairProps> = ({ lang }) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { isAuthenticated, user } = useAuth();
    const { addToast } = useToast();
    const { addToCart, setIsCartOpen } = useCart();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<RepairDevice | null>(null);
    const [repairCatalog, setRepairCatalog] = useState<RepairDevice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRepairs = async () => {
            try {
                setLoading(true);
                const response = await api.get<RepairDevice[]>(`/api/repairs?search=${searchTerm}`);

                // Axios returns the data in the .data property, but interceptor already unwraps it.
                // The new backend returns { devices, currentPage, totalPages, totalDevices }
                const responseData: any = response;
                let repairsData = [];
                
                if (Array.isArray(responseData)) {
                    repairsData = responseData; // old backend
                } else if (responseData && Array.isArray(responseData.devices)) {
                    repairsData = responseData.devices; // new paginated backend
                } else if (responseData && responseData.data && Array.isArray(responseData.data.devices)) {
                    repairsData = responseData.data.devices; // fallback
                }

                setRepairCatalog(repairsData);
            } catch (err) {
                addToast('Failed to load repair catalog. Check console.', 'error');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            loadRepairs();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const filteredDevices = repairCatalog;

    const handleBookRepair = (deviceModel: string, serviceLabel?: string, price?: number) => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/repair');
            return;
        }

        const whatsappMode = settings?.features?.whatsappOrders;
        if (whatsappMode?.repairEnabled && whatsappMode?.phoneNumber) {
            import('../utils/whatsappHelper').then(({ generateWhatsAppLink }) => {
                const url = generateWhatsAppLink({
                    phoneNumber: whatsappMode.phoneNumber,
                    messageTemplate: whatsappMode.message,
                    serviceName: `${serviceLabel || 'General Diagnostic'} - ${deviceModel}`
                });
                window.location.href = url;
            });
            return;
        }

        addToCart({
            id: `repair_${Date.now()}`,
            title: `Reparatur: ${deviceModel}`,
            subtitle: serviceLabel || 'General Diagnostic',
            price: price || 0,
            image: '',
            category: 'repair',
            stock: 1,
        });

        addToast(t('repair.addedToCart', 'Service in den Warenkorb gelegt!'), 'success');
        setSelectedDevice(null);
        setIsCartOpen(true);
    };

    return (
        <div className="relative min-h-0 md:min-h-[100dvh] pt-24 md:pt-32 page-container pb-16 md:pb-20 overflow-hidden bg-slate-50 dark:bg-[#0a0f1c]">

            {/* Abstract Background Tech Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>

            {/* --- SERVICE DETAIL MODAL (BLUEPRINT STYLE) --- */}
            {selectedDevice && (
                <RepairDeviceModal
                    selectedDevice={selectedDevice}
                    setSelectedDevice={setSelectedDevice}
                    handleBookRepair={handleBookRepair}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-5 h-5 text-blue-500" />
                            <span className="text-blue-500 font-mono text-xs md:text-sm tracking-widest uppercase">{t('repair.title', 'Service Terminal')}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">
                            {settings?.content?.repairTitle || t('repair.title', 'Service Terminal')}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 font-light border-l-2 border-blue-900 pl-4 text-sm md:text-base">
                            {settings?.content?.repairSubtitle || t('repair.subtitle', 'Professionelle Reparaturen für alle Geräte')}
                        </p>
                    </div>
                </div>

                {/* Search & Interface Panel */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-3xl p-1 mb-8 md:mb-10 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('repair.searchPlaceholder', 'Gerätemodell suchen (z.B. iPhone 15, S24)...')}
                            className="w-full pl-12 pr-6 py-3.5 md:py-5 bg-slate-100/50 dark:bg-black/50 border border-slate-200 dark:border-transparent rounded-xl md:rounded-2xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base md:text-lg font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Search className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* DEVICE CATALOG GRID */}
                <RepairCatalogList
                    filteredDevices={filteredDevices}
                    setSelectedDevice={setSelectedDevice}
                    searchTerm={searchTerm}
                />

            </div>
        </div>
    );
};
