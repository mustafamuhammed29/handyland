import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Cpu, Activity, Clock, ShieldCheck, Wrench } from 'lucide-react';
import { RepairDevice } from './types';
import { getServiceIcon } from './utils';
import { LazyImage } from '../ui/LazyImage';

interface RepairDeviceModalProps {
    selectedDevice: RepairDevice;
    setSelectedDevice: (device: RepairDevice | null) => void;
    handleOpenTicketModal: (deviceModel: string, serviceLabel?: string) => void;
}

export const RepairDeviceModal: React.FC<RepairDeviceModalProps> = ({
    selectedDevice,
    setSelectedDevice,
    handleOpenTicketModal,
}) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-slate-900 border-4 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 flex flex-col md:flex-row max-h-[85vh]">

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                <button
                    type="button"
                    aria-label="Close Details"
                    onClick={() => setSelectedDevice(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors border border-slate-700"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* LEFT: Device Visual & ID */}
                <div className="w-full md:w-1/3 bg-slate-900/50 border-r border-slate-800 p-8 flex flex-col items-center justify-center relative">
                    <div className="text-xs font-mono text-blue-500 mb-4 tracking-widest uppercase">{t('repair.targetSystem', 'ZIELSYSTEM')}</div>
                    <div className="relative w-48 h-64 mb-6 group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        <LazyImage
                            src={selectedDevice.image || (selectedDevice as any).images?.[0]}
                            alt={(selectedDevice.model && !selectedDevice.model.includes('يشر')) ? selectedDevice.model : 'Unknown Device'}
                            className="relative w-full h-full object-contain drop-shadow-2xl z-10"
                        />
                        {/* Scan Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-[scan_2s_linear_infinite] opacity-50 z-20"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white text-center mb-1">
                        {(() => {
                            const name = selectedDevice.model || '';
                            const isValidName = (n: string) => /^[\x00-\x7F\u00C0-\u024F\u0400-\u04FF]+$/.test(n);
                            return isValidName(name) ? name : 'Standard Device';
                        })()}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-black/40 px-3 py-1 rounded-full border border-slate-800">
                        <Cpu className="w-3 h-3" />
                        <span>ID: {selectedDevice.id?.toUpperCase() || 'N/A'}</span>
                    </div>
                </div>

                {/* RIGHT: Service List */}
                <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-slate-950/80">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">{t('repair.title')}</h4>
                    </div>

                    <div className="space-y-3">
                        {(selectedDevice.services || []).map((service, idx) => (
                            <div
                                key={idx}
                                className="group relative bg-black/40 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 hover:bg-blue-900/5"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                                            {getServiceIcon(service.type)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white group-hover:text-blue-200 transition-colors">{service.label}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {service.duration}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1 border-l border-slate-800 pl-3">
                                                    <ShieldCheck className="w-3 h-3" /> {service.warranty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="text-xl font-bold text-blue-400">
                                            {service.price && service.price > 0 ? `${service.price}€` : t('repair.na', 'On Request')}
                                        </div>
                                        <button
                                            onClick={() => handleOpenTicketModal(selectedDevice.model || 'Unknown Device', service.label)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                                        >
                                            <Wrench className="w-3 h-3" /> {t('repair.bookRepair')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 font-mono">
                        <p>{t('repair.note', 'HINWEIS: Preise beinhalten Arbeit und Premium-Teile. Diagnosescan vor endgültiger Reparaturbestätigung erforderlich.')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
