import React from 'react';
import { Toggle } from '../SettingsManager';
import { Layers, MonitorPlay, BarChart, Image as ImageIcon, ShoppingBag, Headphones, Smartphone } from 'lucide-react';

export const SectionsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <Layers className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Layout & Sections Control</h3>
                    <p className="text-slate-400 text-sm">Toggle visibility of home page building blocks to sculpt your landing experience.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Hero */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.hero ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.hero ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                                <MonitorPlay size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Hero 3D Section</h4>
                                <p className="text-xs text-slate-500 mt-1">The primary header block</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.hero || false} onChange={(v: boolean) => handleChange('sections', 'hero', v)} />
                    </div>
                </div>

                {/* Stats */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.stats ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.stats ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <BarChart size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Impact Statistics</h4>
                                <p className="text-xs text-slate-500 mt-1">Four column data numbers row</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.stats || false} onChange={(v: boolean) => handleChange('sections', 'stats', v)} />
                    </div>
                </div>

                {/* Repair Gallery */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.repairGallery ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.repairGallery ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Repair Archive & Gallery</h4>
                                <p className="text-xs text-slate-500 mt-1">Showcase past successful fixes</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.repairGallery || false} onChange={(v: boolean) => handleChange('sections', 'repairGallery', v)} />
                    </div>
                </div>

                {/* Marketplace */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.marketplace ? 'bg-amber-900/20 border-amber-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.marketplace ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Market Highlights</h4>
                                <p className="text-xs text-slate-500 mt-1">Carousels of new/refurbished devices</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.marketplace || false} onChange={(v: boolean) => handleChange('sections', 'marketplace', v)} />
                    </div>
                </div>

                {/* Accessories */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.accessories ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.accessories ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Accessories Block</h4>
                                <p className="text-xs text-slate-500 mt-1">Showcase cases, chargers, guards</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.accessories || false} onChange={(v: boolean) => handleChange('sections', 'accessories', v)} />
                    </div>
                </div>

                {/* Contact */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.contact ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.contact ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Headphones size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Contact & Secure Form</h4>
                                <p className="text-xs text-slate-500 mt-1">Map, address, social and ticket form</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.contact || false} onChange={(v: boolean) => handleChange('sections', 'contact', v)} />
                    </div>
                </div>

            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-300 text-sm mt-6">
                <strong>Note:</strong> Disabling a section hides it completely from the home page. Customers will not be able to interact with it, but the data remains safe in your database.
            </div>

        </div>
    );
};
