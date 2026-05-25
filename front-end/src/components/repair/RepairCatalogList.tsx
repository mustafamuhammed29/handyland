import React from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Battery, ChevronRight, Wrench, MessageSquare } from 'lucide-react';
import { RepairDevice } from './types';
import { LazyImage } from '../ui/LazyImage';
import { Link } from 'react-router-dom';

interface RepairCatalogListProps {
    filteredDevices: RepairDevice[];
    setSelectedDevice: (device: RepairDevice) => void;
    searchTerm?: string;
}

export const getCleanDeviceModel = (device: RepairDevice): string => {
    let model = device.model || '';
    if (device.brand?.toLowerCase() === 'apple' && !model.toLowerCase().includes('iphone')) {
        model = `iPhone ${model}`;
    }
    return model;
};

export const getDeviceImage = (device: RepairDevice): string => {
    const img = device.image || (device as any).images?.[0];
    const isApple = device.brand?.toLowerCase() === 'apple';
    const isSamsung = device.brand?.toLowerCase() === 'samsung';
    
    if (!img || 
        img.includes('placeholder') || 
        img.includes('room') || 
        img.includes('hotel') || 
        img.includes('interior') || 
        img.includes('unsplash.com/photo-1540518614-') ||
        img.includes('compressed-1778456262699-718780140')
    ) {
        if (isApple) {
            return 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop'; // iPhone 15 Pro mockup
        }
        if (isSamsung) {
            return 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop'; // Galaxy device mockup
        }
        return 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?q=80&w=600&auto=format&fit=crop';
    }
    return img;
};

export const RepairCatalogList: React.FC<RepairCatalogListProps> = ({ filteredDevices, setSelectedDevice, searchTerm = '' }) => {
    const { t } = useTranslation();

    const getScreenPrice = (device: RepairDevice) => {
        const p = device.services?.find(s => s.type === 'screen')?.price;
        if (p && p > 0) return `${p}€`;
        const modelName = getCleanDeviceModel(device).toLowerCase();
        if (modelName.includes('15 pro max')) return '299€';
        if (modelName.includes('15 pro')) return '279€';
        if (modelName.includes('15')) return '249€';
        return '149€';
    };

    const getBatteryPrice = (device: RepairDevice) => {
        const p = device.services?.find(s => s.type === 'battery')?.price;
        if (p && p > 0) return `${p}€`;
        const modelName = getCleanDeviceModel(device).toLowerCase();
        if (modelName.includes('15')) return '89€';
        if (modelName.includes('14')) return '79€';
        return '69€';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.length > 0 ? (
                filteredDevices.map((device) => {
                    const cleanModel = getCleanDeviceModel(device);
                    const cleanImage = getDeviceImage(device);
                    return (
                        <button
                            key={device.id}
                            onClick={() => setSelectedDevice(device)}
                            className="group relative bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-none hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left w-full"
                        >
                            {/* Status Light */}
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase group-hover:text-blue-400 transition-colors">
                                    {device.services?.length || 0} {t('repair.services', 'Dienste')}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                            </div>

                            <div className="flex items-center gap-6 mb-6">
                                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-blue-500/30 transition-colors flex items-center justify-center">
                                    <LazyImage
                                        src={cleanImage}
                                        alt={cleanModel}
                                        className="w-full h-full opacity-85 group-hover:opacity-100 transition-opacity object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">{device.brand}</div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">
                                        {cleanModel}
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                    <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                                        <Monitor className="w-3 h-3" /> {t('repair.screenReplacement', 'Displayreparatur')}
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-mono text-xs font-bold">
                                        {getScreenPrice(device)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                    <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                                        <Battery className="w-3 h-3" /> {t('repair.batteryReplacement', 'Akkutausch')}
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-mono text-xs font-bold">
                                        {getBatteryPrice(device)}
                                    </span>
                                </div>
                                {/* Render any additional services beyond screen & battery */}
                                {device.services?.filter(s => s.type !== 'screen' && s.type !== 'battery').map((s, idx) => {
                                    const typeLabels: Record<string, string> = {
                                        charging: t('repair.chargingPort', 'Ladebuchse'),
                                        camera: t('repair.camera', 'Kamera'),
                                        backglass: t('repair.backGlass', 'Rückglas'),
                                        faceid: t('repair.faceId', 'Face ID'),
                                    };
                                    const label = s.label || typeLabels[s.type] || s.type;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                            <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                                                <Wrench className="w-3 h-3" /> {label}
                                            </span>
                                            <span className="text-slate-900 dark:text-white font-mono text-xs font-bold">
                                                {s.price > 0 ? `${s.price}€` : t('repair.onRequest', 'Auf Anfrage')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 group-hover:border-blue-500/20">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t('repair.statusServiceable', 'STATUS: VERFÜGBAR')}</span>
                                <div className="flex items-center gap-1 text-blue-500 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                    {t('repair.openDiagnostics', 'Diagnostik öffnen')} <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="col-span-full py-16 px-6 text-center bg-white/40 dark:bg-slate-900/20 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-xl flex flex-col items-center max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <Wrench className="w-10 h-10" />
                    </div>
                    {searchTerm ? (
                        <div className="flex flex-col items-center">
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                                {t('repair.deviceNotFound', 'Modell nicht gefunden')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm text-sm leading-relaxed">
                                {t('repair.noPricingYet', 'Wir haben derzeit keine Standardpreise für "{{device}}" gelistet. Wir reparieren es trotzdem!', { device: searchTerm })}
                            </p>
                            <Link 
                                to={`/contact?subject=Reparaturanfrage: ${encodeURIComponent(searchTerm)}`}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 animate-bounce"
                            >
                                <MessageSquare className="w-5 h-5" />
                                {t('repair.contactForQuote', 'Individuelles Angebot anfordern')}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                                {t('repair.catalogEmpty', 'Servicekatalog leer')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm text-sm leading-relaxed">
                                {t('repair.noServicesListed', 'Derzeit sind keine Standard-Reparaturdienste gelistet.')}
                            </p>
                            <Link 
                                to="/contact"
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <MessageSquare className="w-5 h-5" />
                                {t('repair.contactSupport', 'Support kontaktieren')}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
