import React from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Battery, ChevronRight, AlertTriangle } from 'lucide-react';
import { RepairDevice } from './types';
import { LazyImage } from '../ui/LazyImage';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

interface RepairCatalogListProps {
    filteredDevices: RepairDevice[];
    setSelectedDevice: (device: RepairDevice) => void;
    searchTerm?: string;
}

export const RepairCatalogList: React.FC<RepairCatalogListProps> = ({ filteredDevices, setSelectedDevice, searchTerm = '' }) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.length > 0 ? (
                filteredDevices.map((device) => (
                    <button
                        key={device.id}
                        onClick={() => setSelectedDevice(device)}
                        className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/60 text-left w-full"
                    >
                        {/* Status Light */}
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-blue-400 transition-colors">
                                {device.services?.length || 0} Services
                            </span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                        </div>

                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 group-hover:border-blue-500/30 transition-colors flex items-center justify-center">
                                <LazyImage
                                    src={device.image || (device as any).images?.[0]}
                                    alt={device.model}
                                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <div>
                                <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">{device.brand}</div>
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                    {(device.model && !device.model.includes('يشر')) ? device.model : 'Unknown Device'}
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                <span className="text-slate-500 text-xs flex items-center gap-2">
                                    <Monitor className="w-3 h-3" /> Screen Repair
                                </span>
                                <span className="text-white font-mono text-xs font-bold">
                                    {(() => {
                                        const p = device.services?.find(s => s.type === 'screen')?.price;
                                        return (p && p > 0) ? `${p}€` : 'N/A';
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                <span className="text-slate-500 text-xs flex items-center gap-2">
                                    <Battery className="w-3 h-3" /> Battery
                                </span>
                                <span className="text-white font-mono text-xs font-bold">
                                    {(() => {
                                        const p = device.services?.find(s => s.type === 'battery')?.price;
                                        return (p && p > 0) ? `${p}€` : 'N/A';
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 group-hover:border-blue-500/20">
                            <span className="text-xs text-slate-500 font-mono">STATUS: SERVICEABLE</span>
                            <div className="flex items-center gap-1 text-blue-500 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                Open Diagnostics <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    {searchTerm ? (
                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-bold text-white mb-2">{t('repair.deviceNotFound', 'Device Not Found')}</h3>
                            <p className="text-slate-500 mb-6">{t('repair.noPricingYet', 'We don\'t have standard pricing for "{{device}}" yet.', { device: searchTerm })}</p>
                            <Link 
                                to={`/contact?subject=Repair Inquiry: ${searchTerm}`}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                            >
                                <MessageSquare className="w-5 h-5" />
                                {t('repair.contactForQuote', 'Contact Us for a Quote')}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-bold text-white mb-2">Service Catalog Empty</h3>
                            <p className="text-slate-500 mb-6">There are currently no standard repair services listed.</p>
                            <Link 
                                to="/contact"
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
                            >
                                <MessageSquare className="w-5 h-5" />
                                Contact Support
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
