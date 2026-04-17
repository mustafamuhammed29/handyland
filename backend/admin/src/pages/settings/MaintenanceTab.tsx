import { Wrench, AlertTriangle, Clock, Terminal } from 'lucide-react';

export const MaintenanceSettingsTab = ({ settings, handleChange }: any) => {
    // Default safe objects if settings has an empty maintenanceMode object
    const mode = {
        enabled: settings.maintenanceMode?.enabled || false,
        title: settings.maintenanceMode?.title || 'Wartungsarbeiten',
        message: settings.maintenanceMode?.message || 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!',
        estimatedTime: settings.maintenanceMode?.estimatedTime || 'wenige Minuten'
    };

    const updateField = (key: string, value: any) => {
        handleChange(null, 'maintenanceMode', { ...mode, [key]: value });
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <Wrench className="w-5 h-5 text-amber-500" />
                    Maintenance Mode
                </h3>
                <p className="text-slate-400 text-sm">
                    Enable this mode to lock the storefront for customers. The admin panel and API will remain accessible to you for making changes.
                </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${mode.enabled ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-900/50 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="font-semibold text-white flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-slate-400" />
                            System Lock Status
                        </h4>
                        <p className={`text-sm mt-1 ${mode.enabled ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
                            {mode.enabled ? 'Maintenance is currently ACTIVE. Storefront is locked.' : 'Storefront is Live and accessible.'}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            title="Toggle Maintenance Mode"
                            aria-label="Toggle Maintenance Mode"
                            className="sr-only peer"
                            checked={mode.enabled}
                            onChange={(e) => updateField('enabled', e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>

                {mode.enabled && (
                    <div className="mt-4 p-3 bg-amber-500/10 text-amber-400 rounded-lg text-sm flex items-start gap-2 border border-amber-500/30">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Customers visiting the site will now see the maintenance screen. Ensure you test your changes before turning this off again.</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 shadow-sm space-y-6">
                <div>
                    <h4 className="font-semibold text-white mb-4">Maintenance Customer Screen</h4>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Main Title
                            </label>
                            <input
                                type="text"
                                value={mode.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="w-full bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl text-white focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="e.g. Wartungsarbeiten"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Explanation Message
                            </label>
                            <textarea
                                value={mode.message}
                                onChange={(e) => updateField('message', e.target.value)}
                                className="w-full bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl text-white focus:ring-amber-500 focus:border-amber-500 transition-colors h-24 resize-none"
                                placeholder="Explain why the site is down..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                Estimated Recovery Time
                            </label>
                            <input
                                type="text"
                                value={mode.estimatedTime}
                                onChange={(e) => updateField('estimatedTime', e.target.value)}
                                className="w-full bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl text-white focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="e.g. wenige Minuten / 2 hours"
                            />
                            <p className="text-xs text-slate-500 mt-1">This gives customers an idea of when to check back.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 shadow-sm space-y-6">
                <div>
                    <h4 className="font-semibold text-white mb-4">Status Indicators Text</h4>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Status Indicator 1
                            </label>
                            <input
                                type="text"
                                value={mode.statusText1}
                                onChange={(e) => updateField('statusText1', e.target.value)}
                                className="w-full bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl text-white focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="e.g. System wird diagnostiziert..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Status Indicator 2
                            </label>
                            <input
                                type="text"
                                value={mode.statusText2}
                                onChange={(e) => updateField('statusText2', e.target.value)}
                                className="w-full bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl text-white focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="e.g. Neue Reparaturen werden angewendet..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
