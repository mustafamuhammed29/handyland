import { Toggle } from '../SettingsManager';
import { Layers, MonitorPlay, BarChart, ShoppingBag, Headphones, Smartphone, Wrench, Search, User as UserIcon } from 'lucide-react';

export const SectionsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <Layers className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">App Modules & Features Control</h3>
                    <p className="text-slate-400 text-sm">Toggle visibility of core application routes and homepage building blocks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Marketplace Module */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.marketplacePage !== false ? 'bg-amber-900/20 border-amber-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.marketplacePage !== false ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Marketplace Module</h4>
                                <p className="text-[11px] text-slate-500 mt-1">/marketplace route & homepage block</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.marketplacePage !== false} onChange={(v: boolean) => handleChange('sections', 'marketplacePage', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-amber-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.marketplacePageComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'marketplacePageComingSoon', v)} />
                    </div>
                </div>

                {/* Accessories Module */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.accessoriesPage !== false ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.accessoriesPage !== false ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Accessories Module</h4>
                                <p className="text-[11px] text-slate-500 mt-1">/accessories route & homepage block</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.accessoriesPage !== false} onChange={(v: boolean) => handleChange('sections', 'accessoriesPage', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-cyan-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.accessoriesPageComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'accessoriesPageComingSoon', v)} />
                    </div>
                </div>

                {/* Repair Module */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.repairPage !== false ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.repairPage !== false ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Wrench size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Repair Service Module</h4>
                                <p className="text-[11px] text-slate-500 mt-1">/repair route, ticket creation & gallery</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.repairPage !== false} onChange={(v: boolean) => handleChange('sections', 'repairPage', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-blue-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.repairPageComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'repairPageComingSoon', v)} />
                    </div>
                </div>

                {/* Valuation Page */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.valuationPage !== false ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.valuationPage !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <BarChart size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Sell Device Workflow</h4>
                                <p className="text-[11px] text-slate-500 mt-1">/valuation page & calculation</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.valuationPage !== false} onChange={(v: boolean) => handleChange('sections', 'valuationPage', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-emerald-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.valuationPageComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'valuationPageComingSoon', v)} />
                    </div>
                </div>

                {/* Track Repair Page */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.trackRepairPage !== false ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.trackRepairPage !== false ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Search size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Track Repair</h4>
                                <p className="text-[11px] text-slate-500 mt-1">/track-repair verification tool</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.trackRepairPage !== false} onChange={(v: boolean) => handleChange('sections', 'trackRepairPage', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-yellow-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.trackRepairPageComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'trackRepairPageComingSoon', v)} />
                    </div>
                </div>

                {/* Wallet Module */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.wallet !== false ? 'bg-fuchsia-900/20 border-fuchsia-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.wallet !== false ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-800 text-slate-400'}`}>
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Digital Wallet Module</h4>
                                <p className="text-[11px] text-slate-500 mt-1">Customer digital balance & top-ups</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.wallet !== false} onChange={(v: boolean) => handleChange('sections', 'wallet', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-fuchsia-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.walletComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'walletComingSoon', v)} />
                    </div>
                </div>

                {/* Auth System */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.authSystem !== false ? 'bg-rose-900/20 border-rose-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.authSystem !== false ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                                <UserIcon size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Login & Authentication</h4>
                                <p className="text-[11px] text-slate-500 mt-1">User registration, login, dashboard</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.authSystem !== false} onChange={(v: boolean) => handleChange('sections', 'authSystem', v)} />
                    </div>
                    {/* Coming Soon Toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-medium text-rose-400/80">Coming Soon Mode (Keep visible but show coming soon)</span>
                        <Toggle label="" value={settings.sections?.authSystemComingSoon || false} onChange={(v: boolean) => handleChange('sections', 'authSystemComingSoon', v)} />
                    </div>
                </div>

                {/* Hero */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.hero !== false ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.hero !== false ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                                <MonitorPlay size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Homepage: Hero Section</h4>
                                <p className="text-[11px] text-slate-500 mt-1">The primary 3D header block</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.hero !== false} onChange={(v: boolean) => handleChange('sections', 'hero', v)} />
                    </div>
                </div>

                {/* Stats */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.stats !== false ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.stats !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <BarChart size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Homepage: Statistics</h4>
                                <p className="text-[11px] text-slate-500 mt-1">Four column data numbers row</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.stats !== false} onChange={(v: boolean) => handleChange('sections', 'stats', v)} />
                    </div>
                </div>

                {/* Contact */}
                <div className={`p-4 rounded-xl border transition-all ${settings.sections?.contact !== false ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.sections?.contact !== false ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Headphones size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-tight">Homepage: Contact Form</h4>
                                <p className="text-[11px] text-slate-500 mt-1">Map, address, social and ticket form</p>
                            </div>
                        </div>
                        <Toggle label="" value={settings.sections?.contact !== false} onChange={(v: boolean) => handleChange('sections', 'contact', v)} />
                    </div>
                </div>

            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-300 text-sm mt-6 mb-8 shadow-inner shadow-black/20">
                <strong className="text-white">Note:</strong> Disabling a Master Module completely locks out that specific route across the entire frontend app, redirecting visitors to the home page, and automatically hiding its corresponding blocks and links.
            </div>

        </div>
    );
};
