import { Input, Toggle } from '../SettingsManager';

export const FeaturesTab = ({ settings, handleChange }: any) => {
    // Defend against uninitialized features object
    const features = settings.features || {
        comparisonEngine: true,
        cartUpselling: true,
        loyalty: {
            enabled: true,
            earnRate: 10,
            redeemRate: 100,
            silverThreshold: 500,
            goldThreshold: 2000,
            platinumThreshold: 5000
        }
    };

    const updateFeature = (key: string, value: any) => {
        handleChange('features', key, value);
    };

    const updateLoyalty = (key: string, value: any) => {
        const currentLoyalty = features.loyalty || {};
        handleChange('features', 'loyalty', { ...currentLoyalty, [key]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h3 className="text-xl font-bold text-white">Global Features Control</h3>
                <p className="text-slate-400 text-sm mt-1">Enable or disable major storefront features here.</p>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-blue-400 font-bold border-b border-slate-800 pb-2">Core Storefront Engines</h4>
                <div className="grid gap-6">
                    <div className="flex flex-col gap-2">
                        <Toggle 
                            label="Product Comparison Engine" 
                            value={features.comparisonEngine ?? true} 
                            onChange={(v: boolean) => updateFeature('comparisonEngine', v)} 
                        />
                        <p className="text-xs text-slate-500 ml-14 -mt-2">Enable the '/compare' page and 'Add to Compare' buttons across the marketplace.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Toggle 
                            label="Smart Cart Upselling" 
                            value={features.cartUpselling ?? true} 
                            onChange={(v: boolean) => updateFeature('cartUpselling', v)} 
                        />
                        <p className="text-xs text-slate-500 ml-14 -mt-2">Display "Frequently Bought Together" accessory recommendations in the shopping cart.</p>
                    </div>
                </div>
            </div>

            <div className="p-5 border border-purple-900/40 rounded-xl bg-purple-950/20 space-y-4">
                <div className="flex justify-between items-center border-b border-purple-900/50 pb-2">
                    <h4 className="text-purple-400 font-bold">Smart Loyalty & Rewards Engine</h4>
                    <Toggle 
                        label="" 
                        value={features.loyalty?.enabled ?? true} 
                        onChange={(v: boolean) => updateLoyalty('enabled', v)} 
                    />
                </div>
                
                {features.loyalty?.enabled !== false && (
                    <div className="space-y-6 pt-2 animate-in slide-in-from-top-2">
                        <div>
                            <h5 className="text-sm font-bold text-white mb-3">Points Economics</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Earn Rate (Points per €1 spent)" 
                                    value={features.loyalty?.earnRate?.toString() || '10'} 
                                    onChange={(v: string) => updateLoyalty('earnRate', Number(v))} 
                                    type="number" 
                                />
                                <Input 
                                    label="Redeem Rate (Points to get €1 discount)" 
                                    value={features.loyalty?.redeemRate?.toString() || '100'} 
                                    onChange={(v: string) => updateLoyalty('redeemRate', Number(v))} 
                                    type="number" 
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded border border-white/5">
                                Current configuration: A customer spending €1000 earns {(features.loyalty?.earnRate || 10) * 1000} PTS. 
                                By redeeming {(features.loyalty?.earnRate || 10) * 1000} PTS, they receive a €{((features.loyalty?.earnRate || 10) * 1000) / (features.loyalty?.redeemRate || 100)} discount.
                            </p>
                        </div>

                        <div>
                            <h5 className="text-sm font-bold text-white mb-3">Tier Thresholds (Points Required)</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input 
                                    label="🥈 Silver Tier" 
                                    value={features.loyalty?.silverThreshold?.toString() || '500'} 
                                    onChange={(v: string) => updateLoyalty('silverThreshold', Number(v))} 
                                    type="number" 
                                />
                                <Input 
                                    label="🥇 Gold Tier" 
                                    value={features.loyalty?.goldThreshold?.toString() || '2000'} 
                                    onChange={(v: string) => updateLoyalty('goldThreshold', Number(v))} 
                                    type="number" 
                                />
                                <Input 
                                    label="👑 Platinum Tier" 
                                    value={features.loyalty?.platinumThreshold?.toString() || '5000'} 
                                    onChange={(v: string) => updateLoyalty('platinumThreshold', Number(v))} 
                                    type="number" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
