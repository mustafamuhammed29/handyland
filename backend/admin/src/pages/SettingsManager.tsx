import { useEffect, useState } from 'react';
import { Save, Trash2, Layers, MonitorPlay, BarChart, ScanLine, LayoutTemplate, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface HeroSettings {
    headline: string;
    subheadline: string;
    bgStart: string;
    bgEnd: string;
    accentColor: string;
    buttonMarket: string;
    buttonValuation: string;
    trustBadge1: string;
    trustBadge2: string;
    trustBadge3: string;
    heroImage: string;
    productName: string;
    productPrice: string;
    productLabel: string;
    stat1Title: string;
    stat1Value: string;
    stat2Title: string;
    stat2Value: string;
}

interface ValuationSettings {
    step1Title: string;
    step1Subtitle: string;
    step1ModelTitle: string;
    step2Title: string;
    step3Title: string;
    resetBtn: string;
    saveBtn: string;
    sellBtn: string;
    brands: { id: string; name: string; icon: string }[];
    models: { id: string; name: string; brandId: string; basePrice: number }[];
    storageOptions: { label: string; multiplier: number }[];
    conditionOptions: { id: string; label: string; multiplier: number; color: string }[];
    batteryOptions: { id: string; label: string; multiplier: number }[];
}

interface ContentSettings {
    accessoriesTitle: string;
    accessoriesSubtitle: string;
    repairTitle: string;
    repairSubtitle: string;
}

interface StatsSettings {
    devicesRepaired: number;
    happyCustomers: number;
    averageRating: number;
    marketExperience: number;
}

interface RepairArchiveSettings {
    title: string;
    subtitle: string;
    buttonText: string;
    totalRepairs: number;
}

interface SectionsSettings {
    hero: boolean;
    stats: boolean;
    repairGallery: boolean;
    marketplace: boolean;
    accessories: boolean;
    contact: boolean;
}

interface ContactSettings {
    address: string;
    phone: string;
    email: string;
    formTitle: string;
    formButton: string;
    mapUrl: string;
    socialLinks: {
        facebook: string;
        instagram: string;
        twitter: string;
        linkedin: string;
        youtube: string;
    };
}

interface NavbarSettings {
    logoText: string;
    logoAccentText: string;
    showLanguageSwitcher: boolean;
}

interface FooterSettings {
    tagline: string;
    copyright: string;
}

interface Settings {
    siteName: string;
    contactEmail: string;
    footerText: string;
    freeShippingThreshold: number;
    navbar: NavbarSettings;
    hero: HeroSettings;
    valuation: ValuationSettings;
    content: ContentSettings;
    stats: StatsSettings;
    repairArchive: RepairArchiveSettings;
    sections: SectionsSettings;
    contactSection: ContactSettings;
    footerSection: FooterSettings;
}

export default function SettingsManager() {
    const [settings, setSettings] = useState<Settings>({
        siteName: '',
        contactEmail: '',
        footerText: '',
        freeShippingThreshold: 100,
        navbar: { logoText: 'HANDY', logoAccentText: 'LAND', showLanguageSwitcher: true },
        hero: {
            headline: '', subheadline: '', bgStart: '', bgEnd: '', accentColor: '',
            buttonMarket: '', buttonValuation: '', trustBadge1: '', trustBadge2: '', trustBadge3: '',
            heroImage: '', productName: '', productPrice: '', productLabel: '',
            stat1Title: '', stat1Value: '', stat2Title: '', stat2Value: ''
        },
        valuation: {
            step1Title: '', step1Subtitle: '', step1ModelTitle: '',
            step2Title: '', step3Title: '',
            resetBtn: '', saveBtn: '', sellBtn: '',
            brands: [], models: [],
            storageOptions: [], conditionOptions: [], batteryOptions: []
        },
        content: { accessoriesTitle: '', accessoriesSubtitle: '', repairTitle: '', repairSubtitle: '' },
        stats: { devicesRepaired: 0, happyCustomers: 0, averageRating: 0, marketExperience: 0 },
        repairArchive: { title: '', subtitle: '', buttonText: '', totalRepairs: 0 },
        sections: { hero: true, stats: true, repairGallery: true, marketplace: true, accessories: true, contact: true },
        contactSection: {
            address: '', phone: '', email: '', formTitle: '', formButton: '', mapUrl: '',
            socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }
        },
        footerSection: { tagline: '', copyright: '' }
    });
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/settings');
                setSettings(prev => ({ ...prev, ...response.data }));
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (section: keyof Settings | null, key: string, value: string | number | boolean | any) => {
        if (section === 'hero' || section === 'valuation' || section === 'content' || section === 'stats' || section === 'repairArchive' || section === 'sections' || section === 'contactSection' || section === 'footerSection' || section === 'navbar') {
            setSettings(prev => ({
                ...prev,
                [section]: { ...prev[section], [key]: value }
            }));
        } else {
            setSettings(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/api/settings', settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert('Failed to save settings. Please check console for details.');
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Layers },
        { id: 'hero', label: 'Hero Section', icon: MonitorPlay },
        { id: 'stats', label: 'Live Stats', icon: BarChart },
        { id: 'archive', label: 'Repair Archive', icon: ScanLine },
        { id: 'valuation', label: 'Valuation', icon: LayoutTemplate },
        { id: 'content', label: 'Content', icon: MessageSquare },
        { id: 'contact', label: 'Contact Info', icon: MessageSquare },
        { id: 'layout', label: 'Layout Control', icon: LayoutTemplate },
    ];

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">Global Settings</h2>
                    <p className="text-slate-400 mt-1">Configure your application appearance and text</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Save size={20} /> Save Changes
                </button>
            </div>

            <div className="flex gap-8">
                {/* Tabs */}
                <div className="w-64 shrink-0 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                                : 'text-slate-400 hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="font-bold">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">General Information</h3>
                            <Input label="Site Name" value={settings.siteName} onChange={(v) => handleChange(null, 'siteName', v)} />

                            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                                <h4 className="text-blue-400 font-bold mb-4">Navbar Configuration</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Logo Text (Main)" value={settings.navbar?.logoText} onChange={(v) => handleChange('navbar', 'logoText', v)} placeholder="HANDY" />
                                    <Input label="Logo Accent (Color)" value={settings.navbar?.logoAccentText} onChange={(v) => handleChange('navbar', 'logoAccentText', v)} placeholder="LAND" />
                                </div>
                                <div className="mt-4">
                                    <Toggle label="Show Language Switcher" value={settings.navbar?.showLanguageSwitcher || false} onChange={(v) => handleChange('navbar', 'showLanguageSwitcher', v)} />
                                </div>
                            </div>

                            <Input label="Contact Email" value={settings.contactEmail} onChange={(v) => handleChange(null, 'contactEmail', v)} />
                            <Input label="Free Shipping Threshold (€)" value={settings.freeShippingThreshold.toString()} onChange={(v) => handleChange(null, 'freeShippingThreshold', Number(v))} type="number" />
                            <Input label="Footer Text" value={settings.footerText} onChange={(v) => handleChange(null, 'footerText', v)} />
                        </div>
                    )}

                    {activeTab === 'hero' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Hero Section Configuration</h3>
                            <Input label="Headline" value={settings.hero.headline} onChange={(v) => handleChange('hero', 'headline', v)} textarea />
                            <Input label="Subheadline" value={settings.hero.subheadline} onChange={(v) => handleChange('hero', 'subheadline', v)} />

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Button 1 (Market)" value={settings.hero.buttonMarket} onChange={(v) => handleChange('hero', 'buttonMarket', v)} />
                                <Input label="Button 2 (Valuation)" value={settings.hero.buttonValuation} onChange={(v) => handleChange('hero', 'buttonValuation', v)} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Trust Badge 1" value={settings.hero.trustBadge1} onChange={(v) => handleChange('hero', 'trustBadge1', v)} placeholder="VERIFIED SELLERS" />
                                <Input label="Trust Badge 2" value={settings.hero.trustBadge2} onChange={(v) => handleChange('hero', 'trustBadge2', v)} placeholder="24/7 SUPPORT" />
                                <Input label="Trust Badge 3" value={settings.hero.trustBadge3} onChange={(v) => handleChange('hero', 'trustBadge3', v)} placeholder="4.9 RATED" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Background Start Color" value={settings.hero.bgStart} onChange={(v) => handleChange('hero', 'bgStart', v)} type="color" />
                                <Input label="Background End Color" value={settings.hero.bgEnd} onChange={(v) => handleChange('hero', 'bgEnd', v)} type="color" />
                            </div>

                            <Input label="Accent Color" value={settings.hero.accentColor} onChange={(v) => handleChange('hero', 'accentColor', v)} type="color" />

                            <div className="p-4 border border-slate-700 rounded-xl mt-6">
                                <h4 className="text-blue-400 font-bold mb-4">Visuals & Product</h4>
                                <Input label="Phone Screen Image URL" value={settings.hero.heroImage} onChange={(v) => handleChange('hero', 'heroImage', v)} placeholder="https://..." />
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Input label="Product Name" value={settings.hero.productName} onChange={(v) => handleChange('hero', 'productName', v)} placeholder="iPhone 15 Pro" />
                                    <Input label="Product Price" value={settings.hero.productPrice} onChange={(v) => handleChange('hero', 'productPrice', v)} placeholder="€950" />
                                    <Input label="Label (e.g. Current Offer)" value={settings.hero.productLabel} onChange={(v) => handleChange('hero', 'productLabel', v)} placeholder="CURRENT OFFER" />
                                </div>
                            </div>

                            <div className="p-4 border border-slate-700 rounded-xl mt-6">
                                <h4 className="text-blue-400 font-bold mb-4">Floating Stats Cards</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Input label="Stat 1 Title" value={settings.hero.stat1Title} onChange={(v) => handleChange('hero', 'stat1Title', v)} placeholder="Device Sold" />
                                        <Input label="Stat 1 Value" value={settings.hero.stat1Value} onChange={(v) => handleChange('hero', 'stat1Value', v)} placeholder="+24% this week" />
                                    </div>
                                    <div>
                                        <Input label="Stat 2 Title" value={settings.hero.stat2Title} onChange={(v) => handleChange('hero', 'stat2Title', v)} placeholder="Customer Rating" />
                                        <Input label="Stat 2 Value" value={settings.hero.stat2Value} onChange={(v) => handleChange('hero', 'stat2Value', v)} placeholder="4.9/5.0 Excellent" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Live Performance Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Devices Repaired" value={settings.stats?.devicesRepaired?.toString()} onChange={(v) => handleChange('stats', 'devicesRepaired', Number(v))} type="number" />
                                <Input label="Happy Customers" value={settings.stats?.happyCustomers?.toString()} onChange={(v) => handleChange('stats', 'happyCustomers', Number(v))} type="number" />
                                <Input label="Average Rating (out of 5)" value={settings.stats?.averageRating?.toString()} onChange={(v) => handleChange('stats', 'averageRating', Number(v))} type="number" />
                                <Input label="Years Experience" value={settings.stats?.marketExperience?.toString()} onChange={(v) => handleChange('stats', 'marketExperience', Number(v))} type="number" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-white mb-4">Repair Archive Settings</h3>
                                <Link to="/archive" className="flex items-center gap-2 text-cyan-400 hover:text-white font-bold text-sm bg-slate-800 px-4 py-2 rounded-lg">
                                    Manage Repair Cases <ArrowRight size={16} />
                                </Link>
                            </div>
                            <Input label="Section Title" value={settings.repairArchive?.title} onChange={(v) => handleChange('repairArchive', 'title', v)} />
                            <Input label="Section Subtitle" value={settings.repairArchive?.subtitle} onChange={(v) => handleChange('repairArchive', 'subtitle', v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="CTA Button Text" value={settings.repairArchive?.buttonText} onChange={(v) => handleChange('repairArchive', 'buttonText', v)} />
                                <Input label="Total Repairs Counter" value={settings.repairArchive?.totalRepairs?.toString()} onChange={(v) => handleChange('repairArchive', 'totalRepairs', Number(v))} type="number" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'valuation' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Valuation Flow Control</h3>
                            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                                <h4 className="text-blue-400 font-bold mb-4">Step 1: Device Selection</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Main Title (Brand)" value={settings.valuation.step1Title} onChange={(v) => handleChange('valuation', 'step1Title', v)} placeholder="Select Manufacturer" />
                                    <Input label="Subtitle" value={settings.valuation.step1Subtitle} onChange={(v) => handleChange('valuation', 'step1Subtitle', v)} placeholder="Choose a brand to start" />
                                    <Input label="Model Selection Title" value={settings.valuation.step1ModelTitle} onChange={(v) => handleChange('valuation', 'step1ModelTitle', v)} placeholder="Select Model Blueprint" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Step 2 Title (Storage)" value={settings.valuation.step2Title} onChange={(v) => handleChange('valuation', 'step2Title', v)} placeholder="Memory Module" />
                                <Input label="Step 3 Title (Condition)" value={settings.valuation.step3Title} onChange={(v) => handleChange('valuation', 'step3Title', v)} placeholder="Physical Check" />
                            </div>

                            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50 mt-4">
                                <h4 className="text-blue-400 font-bold mb-4">Result Actions</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <Input label="Reset Button" value={settings.valuation.resetBtn} onChange={(v) => handleChange('valuation', 'resetBtn', v)} placeholder="Reset Scanner" />
                                    <Input label="Save Button" value={settings.valuation.saveBtn} onChange={(v) => handleChange('valuation', 'saveBtn', v)} placeholder="Save Quote" />
                                    <Input label="Sell Button" value={settings.valuation.sellBtn} onChange={(v) => handleChange('valuation', 'sellBtn', v)} placeholder="Sell Device" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                {/* Brands Manager */}
                                <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                                    <h4 className="text-white font-bold mb-4 flex justify-between items-center">
                                        Brands
                                        <button
                                            onClick={() => {
                                                const newBrand = { id: Date.now().toString(), name: 'New Brand', icon: '📱' };
                                                handleChange('valuation', 'brands', [...(settings.valuation.brands || []), newBrand]);
                                            }}
                                            className="text-xs bg-cyan-600 px-2 py-1 rounded text-white hover:bg-cyan-500"
                                        >
                                            + Add
                                        </button>
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {(settings.valuation.brands || []).map((brand, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-800 p-2 rounded">
                                                <input
                                                    value={brand.name}
                                                    onChange={(e) => {
                                                        const newBrands = [...settings.valuation.brands];
                                                        newBrands[idx] = { ...brand, name: e.target.value };
                                                        handleChange('valuation', 'brands', newBrands);
                                                    }}
                                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white w-24"
                                                    placeholder="Name"
                                                />
                                                <input
                                                    value={brand.icon}
                                                    onChange={(e) => {
                                                        const newBrands = [...settings.valuation.brands];
                                                        newBrands[idx] = { ...brand, icon: e.target.value };
                                                        handleChange('valuation', 'brands', newBrands);
                                                    }}
                                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white w-12 text-center"
                                                    placeholder="Icon"
                                                />
                                                <input
                                                    value={brand.id}
                                                    onChange={(e) => {
                                                        const newBrands = [...settings.valuation.brands];
                                                        newBrands[idx] = { ...brand, id: e.target.value };
                                                        handleChange('valuation', 'brands', newBrands);
                                                    }}
                                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-xs text-slate-400 w-16"
                                                    placeholder="ID"
                                                />
                                                <button
                                                    aria-label="Remove Brand"
                                                    onClick={() => {
                                                        const newBrands = settings.valuation.brands.filter((_, i) => i !== idx);
                                                        handleChange('valuation', 'brands', newBrands);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 ml-auto"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Models Manager */}
                                <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                                    <h4 className="text-white font-bold mb-4 flex justify-between items-center">
                                        Models
                                        <button
                                            onClick={() => {
                                                const newModel = { id: Date.now().toString(), name: 'New Model', brandId: settings.valuation.brands?.[0]?.id || '', basePrice: 500 };
                                                handleChange('valuation', 'models', [...(settings.valuation.models || []), newModel]);
                                            }}
                                            className="text-xs bg-cyan-600 px-2 py-1 rounded text-white hover:bg-cyan-500"
                                        >
                                            + Add
                                        </button>
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {(settings.valuation.models || []).map((model, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-800 p-2 rounded">
                                                <input
                                                    value={model.name}
                                                    onChange={(e) => {
                                                        const newModels = [...settings.valuation.models];
                                                        newModels[idx] = { ...model, name: e.target.value };
                                                        handleChange('valuation', 'models', newModels);
                                                    }}
                                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white flex-1"
                                                    placeholder="Model Name"
                                                />
                                                <input
                                                    value={model.basePrice}
                                                    onChange={(e) => {
                                                        const newModels = [...settings.valuation.models];
                                                        newModels[idx] = { ...model, basePrice: Number(e.target.value) };
                                                        handleChange('valuation', 'models', newModels);
                                                    }}
                                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white w-20"
                                                    placeholder="Price €"
                                                    type="number"
                                                />
                                                <select
                                                    aria-label="Select Brand"
                                                    value={model.brandId}
                                                    onChange={(e) => {
                                                        const newModels = [...settings.valuation.models];
                                                        newModels[idx] = { ...model, brandId: e.target.value };
                                                        handleChange('valuation', 'models', newModels);
                                                    }}
                                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white w-20"
                                                >
                                                    <option value="">Brand</option>
                                                    {settings.valuation.brands?.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    aria-label="Remove Model"
                                                    onClick={() => {
                                                        const newModels = settings.valuation.models.filter((_, i) => i !== idx);
                                                        handleChange('valuation', 'models', newModels);
                                                    }}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Section Content</h3>
                            <div className="p-4 border border-slate-700 rounded-xl mb-4">
                                <h4 className="text-blue-400 font-bold mb-4">Accessories Section</h4>
                                <Input label="Title" value={settings.content.accessoriesTitle} onChange={(v) => handleChange('content', 'accessoriesTitle', v)} />
                                <Input label="Subtitle" value={settings.content.accessoriesSubtitle} onChange={(v) => handleChange('content', 'accessoriesSubtitle', v)} />
                            </div>
                            <div className="p-4 border border-slate-700 rounded-xl">
                                <h4 className="text-blue-400 font-bold mb-4">Repair Section</h4>
                                <Input label="Title" value={settings.content.repairTitle} onChange={(v) => handleChange('content', 'repairTitle', v)} />
                                <Input label="Subtitle" value={settings.content.repairSubtitle} onChange={(v) => handleChange('content', 'repairSubtitle', v)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Contact & Footer Configuration</h3>

                            <div className="p-4 border border-slate-700 rounded-xl mb-6">
                                <h4 className="text-blue-400 font-bold mb-4">Contact Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Address / HQ" value={settings.contactSection?.address} onChange={(v) => handleChange('contactSection', 'address', v)} />
                                    <Input label="Phone Number" value={settings.contactSection?.phone} onChange={(v) => handleChange('contactSection', 'phone', v)} />
                                    <Input label="Email Address" value={settings.contactSection?.email} onChange={(v) => handleChange('contactSection', 'email', v)} />
                                    <Input label="Map URL (Embed)" value={settings.contactSection?.mapUrl} onChange={(v) => handleChange('contactSection', 'mapUrl', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Input label="Form Title" value={settings.contactSection?.formTitle} onChange={(v) => handleChange('contactSection', 'formTitle', v)} />
                                    <Input label="Form Button Text" value={settings.contactSection?.formButton} onChange={(v) => handleChange('contactSection', 'formButton', v)} />
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <h4 className="text-blue-400 font-bold mb-4 text-sm uppercase">Social Media Links</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Facebook URL" value={settings.contactSection?.socialLinks?.facebook} onChange={(v) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, facebook: v })} />
                                        <Input label="Instagram URL" value={settings.contactSection?.socialLinks?.instagram} onChange={(v) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, instagram: v })} />
                                        <Input label="Twitter (X) URL" value={settings.contactSection?.socialLinks?.twitter} onChange={(v) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, twitter: v })} />
                                        <Input label="LinkedIn URL" value={settings.contactSection?.socialLinks?.linkedin} onChange={(v) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, linkedin: v })} />
                                        <Input label="YouTube URL" value={settings.contactSection?.socialLinks?.youtube} onChange={(v) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, youtube: v })} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-slate-700 rounded-xl">
                                <h4 className="text-blue-400 font-bold mb-4">Footer Settings</h4>
                                <Input label="Footer Tagline" value={settings.footerSection?.tagline} onChange={(v) => handleChange('footerSection', 'tagline', v)} />
                                <Input label="Copyright Text" value={settings.footerSection?.copyright} onChange={(v) => handleChange('footerSection', 'copyright', v)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'layout' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Site Layout Control</h3>
                            <p className="text-slate-400 text-sm mb-6">Toggle visibility of home page sections.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Toggle label="Hero Section (Header)" value={settings.sections?.hero} onChange={(v) => handleChange('sections', 'hero', v)} />
                                <Toggle label="Live Stats Bar" value={settings.sections?.stats} onChange={(v) => handleChange('sections', 'stats', v)} />
                                <Toggle label="Repair Services Gallery" value={settings.sections?.repairGallery} onChange={(v) => handleChange('sections', 'repairGallery', v)} />
                                <Toggle label="Marketplace Highlights" value={settings.sections?.marketplace} onChange={(v) => handleChange('sections', 'marketplace', v)} />
                                <Toggle label="Accessories Section" value={settings.sections?.accessories} onChange={(v) => handleChange('sections', 'accessories', v)} />
                                <Toggle label="Contact / Footer Section" value={settings.sections?.contact} onChange={(v) => handleChange('sections', 'contact', v)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

interface InputProps {
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
    type?: string;
    textarea?: boolean;
    placeholder?: string;
}

const Input = ({ label, value, onChange, type = "text", textarea = false, placeholder }: InputProps) => (
    <div>
        <label className="block text-slate-400 text-sm font-bold mb-2">{label}</label>
        {textarea ? (
            <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none min-h-[100px]"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        ) : (
            <input
                type={type}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-12"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        )}
    </div>
);

const Toggle = ({ label, value, onChange }: { label: string, value: boolean | undefined, onChange: (val: boolean) => void }) => (
    <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
        <span className="text-white font-bold">{label}</span>
        <button
            aria-label={label}
            onClick={() => onChange(!value)}
            className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-7' : 'left-1'}`}></div>
        </button>
    </div>
);
