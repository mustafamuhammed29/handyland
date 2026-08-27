import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Cpu, Activity, Clock, ShieldCheck, Wrench, ChevronRight } from 'lucide-react';
import { RepairDevice } from './types';
import { getServiceIcon } from './utils';
import { LazyImage } from '../ui/LazyImage';
import { getCleanDeviceModel, getDeviceImage } from './RepairCatalogList';

interface RepairDeviceModalProps {
    selectedDevice: RepairDevice;
    setSelectedDevice: (device: RepairDevice | null) => void;
    handleBookRepair: (deviceModel: string, serviceLabel?: string, price?: number) => void;
}

export const RepairDeviceModal: React.FC<RepairDeviceModalProps> = ({
    selectedDevice,
    setSelectedDevice,
    handleBookRepair,
}) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-slate-900 border-4 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 flex flex-col md:flex-row max-h-[85vh]">

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                <button
                    type="button"
                    aria-label="Close Details"
                    onClick={() => setSelectedDevice(null)}
                    className="absolute top-4 right-4 z-[110] p-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors border border-slate-700"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* LEFT: Device Visual & ID */}
                <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-900/80 to-slate-950/90 border-r border-slate-800/80 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="text-[10px] font-bold text-blue-400 mb-6 tracking-[0.2em] uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shadow-sm shadow-blue-500/10">
                        {t('repair.targetSystem', 'Target Device')}
                    </div>
                    
                    <div className="relative w-56 h-72 mb-8 group perspective-1000">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-2xl rounded-full opacity-40 group-hover:opacity-70 transition-all duration-700 group-hover:scale-110"></div>
                        <LazyImage
                            src={getDeviceImage(selectedDevice)}
                            alt={getCleanDeviceModel(selectedDevice)}
                            className="relative w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] z-10 group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 ease-out"
                        />
                        {/* Premium Scan Line */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_#60a5fa] animate-[scan_3s_ease-in-out_infinite] opacity-60 z-20"></div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-white text-center mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        {getCleanDeviceModel(selectedDevice)}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800/80 shadow-inner">
                        <Cpu className="w-3.5 h-3.5 text-blue-500" />
                        <span>SN: {(selectedDevice.brand?.substring(0, 3) || 'SYS').toUpperCase()}-{(selectedDevice.model?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4) || 'RDY').toUpperCase()}</span>
                    </div>
                </div>

                {/* RIGHT: Service List */}
                <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-slate-950/95 relative custom-scrollbar">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h4 className="text-2xl font-black text-white tracking-tight">{t('repair.title', 'Available Services')}</h4>
                            <p className="text-sm text-slate-400 mt-1">{t('repair.subtitle', 'Select a repair option below')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {(selectedDevice.services || []).map((service, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleBookRepair(selectedDevice.model || 'Unknown Device', service.label, service.price)}
                                className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-800/60 cursor-pointer overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                            >
                                {/* Hover highlight effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-0"></div>
                                
                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 sm:gap-2 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all shadow-inner shrink-0 group-hover:scale-105">
                                            {getServiceIcon(service.type)}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                                {service.label || 
                                                 (service.type === 'screen' ? t('repair.screenReplacement', 'Displayreparatur') :
                                                 service.type === 'battery' ? t('repair.batteryReplacement', 'Akkutausch') :
                                                 service.type === 'charging' ? t('repair.chargingPort', 'Ladebuchse') :
                                                 service.type === 'camera' ? t('repair.camera', 'Kamera') :
                                                 service.type === 'backglass' ? t('repair.backGlass', 'Rückglas') :
                                                 service.type === 'faceid' ? t('repair.faceId', 'Face ID') :
                                                 service.type)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 mt-1">
                                                <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800/80">
                                                    <Clock className="w-3 h-3 text-emerald-400" /> {service.duration}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800/80">
                                                    <ShieldCheck className="w-3 h-3 text-purple-400" /> {service.warranty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-slate-800/60 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 transition-all">
                                                {service.price && service.price > 0 ? `${service.price}€` : t('repair.na', 'On Request')}
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('repair.inclTax', 'Inkl. MwSt')}</div>
                                        </div>
                                        
                                        <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all shrink-0">
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex gap-3 items-start">
                        <div className="p-2 bg-slate-800/50 rounded-lg text-slate-300 shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                        <p className="leading-relaxed mt-0.5">{t('repair.note', 'HINWEIS: Preise beinhalten Arbeit und Premium-Teile. Diagnosescan vor endgültiger Reparaturbestätigung erforderlich.')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
