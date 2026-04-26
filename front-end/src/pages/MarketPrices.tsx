import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, TrendingUp, DollarSign, Smartphone, ShoppingBag, Info, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

export const MarketPrices: React.FC = () => {
    const { t } = useTranslation();
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeBrand, setActiveBrand] = useState('All');

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await api.get('/api/valuation/devices');
                const data = (res as any)?.data || res;
                if (Array.isArray(data)) {
                    setDevices(data);
                } else {
                    setError('Received invalid data format from server.');
                }
            } catch (err) {
                console.error('Failed to fetch devices', err);
                setError('Failed to load market prices. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    const brands = ['All', ...Array.from(new Set(devices.map(d => d.brand)))];

    const filteredDevices = devices.filter(d => {
        const matchesBrand = activeBrand === 'All' || d.brand === activeBrand;
        const matchesSearch = d.modelName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesBrand && matchesSearch;
    });

    return (
        <div className="min-h-[100dvh] bg-slate-950 pt-32 pb-24 text-white font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-brand-primary/20 blur-[100px] rounded-full -z-10"></div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary text-sm font-bold mb-6">
                        <TrendingUp className="w-4 h-4" /> Live Market Tracking via eBay
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        {t('catalog.title', 'Live Used Device Market Prices')}
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        {t('catalog.subtitle', 'We continuously scan the used market to ensure you get the fairest and most accurate buyback price possible.')}
                    </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-slate-900/40 p-2 md:p-4 rounded-3xl border border-slate-800 backdrop-blur-xl">
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto pb-2 md:pb-0">
                        {brands.map(brand => (
                            <button
                                key={brand}
                                onClick={() => setActiveBrand(brand)}
                                className={`px-6 py-2.5 rounded-2xl whitespace-nowrap font-bold text-sm transition-all duration-300 ${
                                    activeBrand === brand 
                                    ? 'bg-brand-primary text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('catalog.search', 'Search for a device model...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary transition-all focus:ring-1 focus:ring-brand-primary/50 placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Devices Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-slate-800 border-t-brand-primary rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-900/10 rounded-3xl border border-red-500/20">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h3>
                        <p className="text-slate-400">{error}</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                        <Smartphone className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No devices found</h3>
                        <p className="text-slate-500">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDevices.map((device, index) => {
                            const marketAvg = device.priceResearch?.marketAvg || 0;
                            const isUpdated = !!device.priceResearch?.lastUpdated && marketAvg > 0;
                            const buybackPrice = device.basePrice;

                            return (
                                <div 
                                    key={device._id} 
                                    className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:border-brand-primary/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1 flex flex-col"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Action Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                                            {isUpdated ? (
                                                <><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span> <span className="text-xs font-bold text-slate-300">Live API</span></>
                                            ) : (
                                                <><span className="w-2 h-2 rounded-full bg-amber-400"></span> <span className="text-xs font-bold text-slate-300">Est. Price</span></>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-xl">
                                            {device.validStorages?.[0] || '128GB'} Base
                                        </div>
                                    </div>

                                    {/* Device Image */}
                                    <div className="h-48 w-full flex items-center justify-center mb-6 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-20"></div>
                                        {device.imageUrl ? (
                                            <img 
                                                src={device.imageUrl} 
                                                alt={device.modelName} 
                                                className="h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 relative z-20"
                                            />
                                        ) : (
                                            <Smartphone className="w-20 h-20 text-slate-700" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center mb-6 flex-grow">
                                        <div className="text-sm font-bold text-brand-primary mb-1 tracking-wider uppercase">{device.brand}</div>
                                        <h2 className="text-2xl font-black text-white">{device.modelName}</h2>
                                    </div>

                                    {/* Pricing Block */}
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 mb-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/5 blur-[30px] rounded-full"></div>
                                        
                                        <div className="flex justify-between items-end mb-4 relative z-10">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3"/> Market Average
                                                </p>
                                                <div className="text-xl font-bold text-slate-200">
                                                    {isUpdated ? `€${marketAvg}` : '€---'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-emerald-400 mb-1">Our Offer (Up To)</p>
                                                <div className="text-3xl font-black text-brand-secondary drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                                    €{buybackPrice}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar indicating the margin */}
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-emerald-500 to-brand-primary transition-all duration-1000"
                                                style={{ width: isUpdated ? `${Math.min((buybackPrice / marketAvg) * 100, 100)}%` : '60%' }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 text-center">Data algorithmically synced from latest completed sales.</p>
                                    </div>

                                    {/* Sell Button */}
                                    <a href={`/sell-device?device=${encodeURIComponent(device.modelName)}`} className="w-full relative group/btn block">
                                        <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover/btn:opacity-100 blur-[15px] transition-opacity duration-300 rounded-xl"></div>
                                        <button className="relative w-full py-4 bg-slate-800 hover:bg-brand-primary rounded-xl text-white font-black uppercase tracking-wider text-sm transition-all duration-300 flex items-center justify-center gap-2 group-hover/btn:text-slate-950">
                                            <ShoppingBag className="w-5 h-5" /> 
                                            {t('catalog.sellNow', 'Sell This Device')}
                                        </button>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
