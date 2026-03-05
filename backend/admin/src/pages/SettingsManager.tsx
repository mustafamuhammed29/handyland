import { useEffect, useState } from 'react';
import { Save, Trash2, Layers, MonitorPlay, BarChart, ScanLine, LayoutTemplate, MessageSquare, ArrowRight, Edit3, X, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Bell, Gift } from 'lucide-react';
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
    whatsappPhone: string;
    whatsappMessage: string;
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

interface SocialAuthSettings {
    google: boolean;
    facebook: boolean;
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
    announcementBanner: {
        enabled: boolean;
        text: string;
        color: string;
        dismissible: boolean;
        link: string;
        linkText: string;
    };
    promoPopup: {
        enabled: boolean;
        title: string;
        message: string;
        couponCode: string;
        delay: number;
    };
    socialAuth: SocialAuthSettings;
    quickReplies?: string[];
}

interface EmailTemplateData {
    _id: string;
    name: string;
    description: string;
    subject: string;
    html: string;
    variables: string[];
    isActive: boolean;
}

const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
    verify_email: '✉️ تأكيد البريد الإلكتروني',
    reset_password: '🔑 إعادة تعيين كلمة المرور',
    order_confirmation: '🛒 تأكيد الطلب',
};

const EMAIL_TEMPLATE_ICONS: Record<string, string> = {
    verify_email: '✉️',
    reset_password: '🔑',
    order_confirmation: '🛒',
};

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
            socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
            whatsappPhone: '', whatsappMessage: ''
        },
        footerSection: { tagline: '', copyright: '' },
        announcementBanner: { enabled: false, text: '', color: 'blue', dismissible: true, link: '', linkText: '' },
        promoPopup: { enabled: false, title: '', message: '', couponCode: '', delay: 5 },
        socialAuth: { google: false, facebook: false },
        quickReplies: [
            "We have received your message and are looking into it.",
            "Please provide us with your order number so we can investigate further.",
            "Your repair is currently in progress. We will update you soon.",
            "Thank you for reaching out. Your issue has been resolved."
        ]
    });
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    // Toast state for settings save feedback
    const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const showSaveToast = (type: 'success' | 'error', text: string) => {
        setSaveToast({ type, text });
        setTimeout(() => setSaveToast(null), 3500);
    };

    // Email Templates State
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplateData[]>([]);
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplateData | null>(null);
    const [emailEditMode, setEmailEditMode] = useState(false);
    const [editSubject, setEditSubject] = useState('');
    const [editHtml, setEditHtml] = useState('');
    const [emailPreview, setEmailPreview] = useState(false);
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailNotification, setEmailNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/settings');
                // Admin API interceptor does NOT unwrap response.data, so we need to handle both cases
                const data = (response as any)?.data || response;
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    promoPopup: { ...prev.promoPopup, ...(data.promoPopup || {}) },
                    announcementBanner: { ...prev.announcementBanner, ...(data.announcementBanner || {}) },
                }));
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();

        // Fetch Email Templates whenever tab becomes active
        fetchEmailTemplates();
    }, []);

    const handleChange = (section: keyof Settings | null, key: string, value: string | number | boolean | any) => {
        if (section) {
            setSettings(prev => ({
                ...prev,
                [section]: { ...(prev[section] as any), [key]: value }
            }));
        } else {
            setSettings(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/api/settings', settings);
            showSaveToast('success', 'Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showSaveToast('error', 'Failed to save settings.');
        }
    };

    const fetchEmailTemplates = async () => {
        setEmailLoading(true);
        try {
            const response = await api.get('/api/email-templates');
            const data = (response as any)?.data || response;
            if (data.success) setEmailTemplates(data.data);
        } catch (err) {
            console.error('Failed to load email templates', err);
        } finally {
            setEmailLoading(false);
        }
    };

    const showEmailNotification = (type: 'success' | 'error', text: string) => {
        setEmailNotification({ type, text });
        setTimeout(() => setEmailNotification(null), 4000);
    };

    const startEmailEdit = (template: EmailTemplateData) => {
        setSelectedEmailTemplate(template);
        setEditSubject(template.subject);
        setEditHtml(template.html);
        setEmailEditMode(true);
        setEmailPreview(false);
    };

    const saveEmailTemplate = async () => {
        if (!selectedEmailTemplate) return;
        setEmailSaving(true);
        try {
            const response = await api.put(`/api/email-templates/${selectedEmailTemplate._id}`, {
                subject: editSubject,
                html: editHtml
            });
            const data = (response as any)?.data || response;
            if (data.success) {
                showEmailNotification('success', '✅ Template saved successfully!');
                setEmailTemplates(prev => prev.map(t => t._id === selectedEmailTemplate._id ? data.data : t));
                setEmailEditMode(false);
            } else {
                showEmailNotification('error', data.message || 'Failed to save');
            }
        } catch (err) {
            showEmailNotification('error', 'Error saving template');
        } finally {
            setEmailSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Layers },
        { id: 'auth', label: 'Authentication', icon: Shield },
        { id: 'hero', label: 'Hero Section', icon: MonitorPlay },
        { id: 'stats', label: 'Live Stats', icon: BarChart },
        { id: 'archive', label: 'Repair Archive', icon: ScanLine },
        { id: 'content', label: 'Content', icon: MessageSquare },
        { id: 'contact', label: 'Contact Info', icon: MessageSquare },
        { id: 'layout', label: 'Layout Control', icon: LayoutTemplate },
        { id: 'banner', label: '📢 Announcement', icon: Layers },
        { id: 'promo', label: '🎁 Promo Popup', icon: Layers },
        { id: 'scripts', label: '💬 Support Scripts', icon: MessageSquare },
    ];

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div>
            {/* Global Save Toast */}
            {saveToast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-4 ${saveToast.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-900/90 border-red-500/50 text-red-300'
                    }`}>
                    {saveToast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {saveToast.text}
                </div>
            )}
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

                    {activeTab === 'auth' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Social Login & Authentication</h3>
                            <p className="text-slate-400 text-sm">Control which login methods are available to your users.</p>

                            <div className="p-4 border border-slate-700 rounded-xl space-y-4 bg-slate-900/50">
                                <h4 className="text-blue-400 font-bold mb-4">Social Auth Providers</h4>
                                <Toggle
                                    label="Enable Google Login"
                                    value={settings.socialAuth?.google || false}
                                    onChange={(v) => handleChange('socialAuth', 'google', v)}
                                />
                                <Toggle
                                    label="Enable Facebook Login"
                                    value={settings.socialAuth?.facebook || false}
                                    onChange={(v) => handleChange('socialAuth', 'facebook', v)}
                                />
                                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300 flex gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>Note: To use social login, ensure you have configured your Client IDs and Secrets in the backend <code>.env</code> file.</p>
                                </div>
                            </div>
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
                                    <h4 className="text-green-500 font-bold mb-4 flex items-center gap-2"><MessageSquare size={18} /> WhatsApp Widget Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="WhatsApp Number (e.g. 4915123456789)" value={settings.contactSection?.whatsappPhone} onChange={(v) => handleChange('contactSection', 'whatsappPhone', v)} placeholder="4915123456789" />
                                        <Input label="Default Welcome Message" value={settings.contactSection?.whatsappMessage} onChange={(v) => handleChange('contactSection', 'whatsappMessage', v)} placeholder="Hello, I need help" />
                                    </div>
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

                    {activeTab === 'scripts' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Support Scripts & Quick Replies</h3>
                            <p className="text-slate-400 text-sm mb-4">Manage predefined responses to answer customer queries quickly.</p>

                            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                                <h4 className="text-white font-bold mb-4 flex justify-between items-center">
                                    Quick Replies
                                    <button
                                        onClick={() => {
                                            const newReplies = [...(settings.quickReplies || []), "New Quick Reply"];
                                            handleChange(null, 'quickReplies', newReplies);
                                        }}
                                        className="text-xs bg-cyan-600 px-3 py-1.5 rounded text-white hover:bg-cyan-500 flex items-center gap-1 font-bold"
                                    >
                                        + Add Reply
                                    </button>
                                </h4>
                                <div className="space-y-3">
                                    {(settings.quickReplies || []).map((reply, idx) => (
                                        <div key={idx} className="flex gap-3 items-start bg-slate-800 p-3 rounded-lg border border-slate-700">
                                            <textarea
                                                value={reply}
                                                onChange={(e) => {
                                                    const newReplies = [...(settings.quickReplies || [])];
                                                    newReplies[idx] = e.target.value;
                                                    handleChange(null, 'quickReplies', newReplies);
                                                }}
                                                className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white flex-1 resize-y outline-none focus:border-blue-500"
                                                placeholder="Enter predefined response..."
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => {
                                                    const newReplies = (settings.quickReplies || []).filter((_, i) => i !== idx);
                                                    handleChange(null, 'quickReplies', newReplies);
                                                }}
                                                className="text-red-400 hover:text-white hover:bg-red-500/20 p-2 rounded transition-colors mt-2"
                                                title="Delete Reply"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!settings.quickReplies || settings.quickReplies.length === 0) && (
                                        <p className="text-slate-500 text-sm text-center py-4">No quick replies defined.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'banner' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <Bell className="text-amber-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Announcement Banner</h3>
                                    <p className="text-slate-400 text-sm">Shows a dismissible banner at the top of every page for all visitors.</p>
                                </div>
                            </div>

                            <div className="p-5 border border-slate-700 rounded-xl space-y-5">
                                {/* Enable Toggle */}
                                <div className="flex items-center justify-between py-3 border border-slate-700 rounded-xl px-4">
                                    <span className="text-white font-bold">Enable Banner</span>
                                    <button
                                        type="button"
                                        aria-label={settings.announcementBanner?.enabled ? 'Disable Banner' : 'Enable Banner'}
                                        onClick={() => handleChange('announcementBanner', 'enabled', !settings.announcementBanner?.enabled)}
                                        className={`relative w-12 h-6 rounded-full transition-all ${settings.announcementBanner?.enabled ? 'bg-blue-500' : 'bg-slate-700'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.announcementBanner?.enabled ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                {/* Banner Text */}
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Banner Text</label>
                                    <input
                                        type="text"
                                        value={settings.announcementBanner?.text || ''}
                                        onChange={e => handleChange('announcementBanner', 'text', e.target.value)}
                                        placeholder="🎉 Free shipping on orders over €100!"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                {/* Banner Color */}
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-3">Banner Color</label>
                                    <div className="flex gap-3">
                                        {['blue', 'green', 'orange', 'red', 'purple', 'teal'].map(color => {
                                            const colorMap: Record<string, string> = {
                                                blue: 'bg-blue-600', green: 'bg-green-600',
                                                orange: 'bg-orange-500', red: 'bg-red-600',
                                                purple: 'bg-purple-600', teal: 'bg-teal-500'
                                            };
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    aria-label={`Select ${color} color`}
                                                    onClick={() => handleChange('announcementBanner', 'color', color)}
                                                    className={`w-9 h-9 rounded-full ${colorMap[color]} transition-all ${settings.announcementBanner?.color === color
                                                        ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                                                        : 'opacity-70 hover:opacity-100'
                                                        }`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Link */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">Link URL (optional)</label>
                                        <input
                                            type="url"
                                            value={settings.announcementBanner?.link || ''}
                                            onChange={e => handleChange('announcementBanner', 'link', e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">Link Text</label>
                                        <input
                                            type="text"
                                            value={settings.announcementBanner?.linkText || ''}
                                            onChange={e => handleChange('announcementBanner', 'linkText', e.target.value)}
                                            placeholder="Shop Now →"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Dismissible */}
                                <div className="flex items-center justify-between py-3 border border-slate-700 rounded-xl px-4">
                                    <span className="text-white font-bold">Allow users to dismiss banner</span>
                                    <button
                                        type="button"
                                        aria-label={settings.announcementBanner?.dismissible ? 'Disable dismiss' : 'Enable dismiss'}
                                        onClick={() => handleChange('announcementBanner', 'dismissible', !settings.announcementBanner?.dismissible)}
                                        className={`relative w-12 h-6 rounded-full transition-all ${settings.announcementBanner?.dismissible ? 'bg-blue-500' : 'bg-slate-700'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.announcementBanner?.dismissible ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Live Preview */}
                            {settings.announcementBanner?.text && (
                                <div className="mt-4">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Live Preview</p>
                                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-white text-sm font-medium ${settings.announcementBanner.color === 'green' ? 'bg-green-600' :
                                        settings.announcementBanner.color === 'orange' ? 'bg-orange-500' :
                                            settings.announcementBanner.color === 'red' ? 'bg-red-600' :
                                                settings.announcementBanner.color === 'purple' ? 'bg-purple-600' :
                                                    settings.announcementBanner.color === 'teal' ? 'bg-teal-500' : 'bg-blue-600'
                                        }`}>
                                        <span>{settings.announcementBanner.text}</span>
                                        {settings.announcementBanner.link && (
                                            <span className="underline opacity-80">{settings.announcementBanner.linkText || 'Learn More'}</span>
                                        )}
                                        {settings.announcementBanner.dismissible && (
                                            <span className="opacity-60 text-xs ml-2">[×]</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'promo' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-pink-500/10 rounded-xl">
                                    <Gift className="text-pink-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Promo Popup</h3>
                                    <p className="text-slate-400 text-sm">A timed popup shown to new visitors with a special offer or coupon code.</p>
                                </div>
                            </div>

                            <div className="p-5 border border-slate-700 rounded-xl space-y-5">
                                {/* Enable Toggle */}
                                <div className="flex items-center justify-between py-3 border border-slate-700 rounded-xl px-4">
                                    <span className="text-white font-bold">Enable Promo Popup</span>
                                    <button
                                        type="button"
                                        aria-label={settings.promoPopup?.enabled ? 'Disable Popup' : 'Enable Popup'}
                                        onClick={() => handleChange('promoPopup', 'enabled', !settings.promoPopup?.enabled)}
                                        className={`relative w-12 h-6 rounded-full transition-all ${settings.promoPopup?.enabled ? 'bg-pink-500' : 'bg-slate-700'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.promoPopup?.enabled ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Popup Title</label>
                                    <input
                                        type="text"
                                        value={settings.promoPopup?.title || ''}
                                        onChange={e => handleChange('promoPopup', 'title', e.target.value)}
                                        placeholder="🎁 Special Offer!"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Popup Message</label>
                                    <textarea
                                        value={settings.promoPopup?.message || ''}
                                        onChange={e => handleChange('promoPopup', 'message', e.target.value)}
                                        placeholder="Get 10% off your first order! Use the code below at checkout."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">Coupon Code</label>
                                        <input
                                            type="text"
                                            value={settings.promoPopup?.couponCode || ''}
                                            onChange={e => handleChange('promoPopup', 'couponCode', e.target.value.toUpperCase())}
                                            placeholder="WELCOME10"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white font-mono tracking-wider focus:border-pink-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">Delay (seconds)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={120}
                                            value={settings.promoPopup?.delay ?? 5}
                                            onChange={e => handleChange('promoPopup', 'delay', Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300 flex gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>Make sure the coupon code you enter matches an active coupon in <strong>Coupon Manager</strong>. The popup will show after the delay only to new visitors (tracked via localStorage).</p>
                                </div>
                            </div>

                            {/* Live Preview */}
                            {settings.promoPopup?.title && (
                                <div className="mt-4">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Live Preview</p>
                                    <div className="max-w-sm mx-auto bg-slate-900 border border-pink-500/30 rounded-2xl p-6 shadow-2xl text-center">
                                        <div className="text-3xl mb-2">🎁</div>
                                        <h4 className="text-white font-black text-lg mb-2">{settings.promoPopup.title}</h4>
                                        <p className="text-slate-400 text-sm mb-4">{settings.promoPopup.message || 'Your message here...'}</p>
                                        {settings.promoPopup.couponCode && (
                                            <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/40 rounded-xl font-mono text-pink-400 font-bold text-lg mb-4 tracking-widest">
                                                {settings.promoPopup.couponCode}
                                            </div>
                                        )}
                                        <button className="w-full py-2 bg-pink-500 text-white font-bold rounded-xl text-sm">Copy Code</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'email-templates' && (
                        <div className="space-y-6">
                            {/* Notification */}
                            {emailNotification && (
                                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold ${emailNotification.type === 'success'
                                    ? 'bg-green-600/20 border-green-500/50 text-green-300'
                                    : 'bg-red-600/20 border-red-500/50 text-red-300'
                                    }`}>
                                    {emailNotification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    {emailNotification.text}
                                </div>
                            )}

                            {emailEditMode && selectedEmailTemplate ? (
                                /* ── Edit View ── */
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                {EMAIL_TEMPLATE_LABELS[selectedEmailTemplate.name] || selectedEmailTemplate.name}
                                            </h3>
                                            <p className="text-slate-400 text-sm">{selectedEmailTemplate.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEmailPreview(!emailPreview)}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                                            >
                                                {emailPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                {emailPreview ? 'Editor' : 'Preview'}
                                            </button>
                                            <button
                                                onClick={() => setEmailEditMode(false)}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                                            >
                                                <X className="w-4 h-4" /> Cancel
                                            </button>
                                            <button
                                                onClick={saveEmailTemplate}
                                                disabled={emailSaving}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" /> {emailSaving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">عنوان الرسالة (Subject)</label>
                                        <input
                                            type="text"
                                            aria-label="عنوان الرسالة"
                                            placeholder="أدخل عنوان الرسالة..."
                                            value={editSubject}
                                            onChange={e => setEditSubject(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>

                                    {/* Variables hint */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs text-slate-500 font-medium">المتغيرات:</span>
                                        {selectedEmailTemplate.variables.map(v => (
                                            <span key={v} className="text-xs font-mono bg-blue-600/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded">{v}</span>
                                        ))}
                                    </div>

                                    {/* HTML Editor / Preview */}
                                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                                        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-semibold">
                                            {emailPreview ? '👁 Preview' : '✏️ HTML Editor'}
                                        </div>
                                        {emailPreview ? (
                                            <div className="p-6 bg-white rounded-b-xl min-h-[200px]">
                                                <div dangerouslySetInnerHTML={{ __html: editHtml }} />
                                            </div>
                                        ) : (
                                            <textarea
                                                value={editHtml}
                                                onChange={e => setEditHtml(e.target.value)}
                                                rows={14}
                                                className="w-full px-4 py-3 bg-slate-950 text-slate-200 font-mono text-sm focus:outline-none resize-y"
                                                placeholder="Enter HTML content..."
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* ── List View ── */
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-6">📧 قوالب البريد الإلكتروني</h3>
                                    {emailLoading ? (
                                        <div className="flex justify-center py-10">
                                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {emailTemplates.map(template => (
                                                <div key={template._id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="text-2xl">{EMAIL_TEMPLATE_ICONS[template.name] || '📧'}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${template.isActive ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                            {template.isActive ? 'نشط' : 'معطّل'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-white font-bold mb-1 text-sm">{EMAIL_TEMPLATE_LABELS[template.name] || template.name}</h4>
                                                    <p className="text-slate-500 text-xs mb-3">{template.description}</p>
                                                    <p className="text-xs font-mono text-slate-500 truncate mb-4">📌 {template.subject}</p>
                                                    <div className="flex flex-wrap gap-1 mb-4">
                                                        {template.variables.map(v => (
                                                            <span key={v} className="text-xs font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{v}</span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => startEmailEdit(template)}
                                                        className="w-full py-2 flex items-center justify-center gap-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 rounded-lg text-xs font-semibold transition-all"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" /> تعديل القالب
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'banner' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">📢 Announcement Banner</h3>
                            <p className="text-slate-400 text-sm">Shows a dismissible banner at the top of every page for all visitors.</p>

                            <div className="p-4 border border-slate-700 rounded-xl space-y-4">
                                <Toggle label="Enable Banner" value={settings.announcementBanner?.enabled || false} onChange={(v) => setSettings(prev => ({ ...prev, announcementBanner: { ...prev.announcementBanner, enabled: v } }))} />
                                <Input label="Banner Text" value={settings.announcementBanner?.text} onChange={(v) => setSettings(prev => ({ ...prev, announcementBanner: { ...prev.announcementBanner, text: v } }))} placeholder="🔥 Free shipping on orders over €50 this weekend!" />

                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Banner Color</label>
                                    <div className="flex gap-2">
                                        {['blue', 'green', 'yellow', 'red', 'purple', 'cyan'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSettings(prev => ({ ...prev, announcementBanner: { ...prev.announcementBanner, color } }))}
                                                className={`w-8 h-8 rounded-lg border-2 transition-all ${settings.announcementBanner?.color === color ? 'border-white scale-110' : 'border-transparent opacity-70'
                                                    }`}
                                                style={{ backgroundColor: color === 'cyan' ? '#0891b2' : color === 'blue' ? '#2563eb' : color === 'green' ? '#059669' : color === 'yellow' ? '#d97706' : color === 'red' ? '#dc2626' : '#9333ea' }}
                                                aria-label={`Set banner color to ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Link URL (optional)" value={settings.announcementBanner?.link} onChange={(v) => setSettings(prev => ({ ...prev, announcementBanner: { ...prev.announcementBanner, link: v } }))} placeholder="https://..." />
                                    <Input label="Link Text" value={settings.announcementBanner?.linkText} onChange={(v) => setSettings(prev => ({ ...prev, announcementBanner: { ...prev.announcementBanner, linkText: v } }))} placeholder="Learn More" />
                                </div>

                                <Toggle label="Allow users to dismiss banner" value={settings.announcementBanner?.dismissible !== false} onChange={(v) => setSettings(prev => ({ ...prev, announcementBanner: { ...prev.announcementBanner, dismissible: v } }))} />
                            </div>

                            {/* Live Preview */}
                            {settings.announcementBanner?.enabled && settings.announcementBanner?.text && (
                                <div className="p-4 border border-slate-700 rounded-xl">
                                    <p className="text-slate-400 text-xs font-bold mb-2 uppercase">Preview</p>
                                    <div
                                        className="px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium"
                                        style={{ backgroundColor: settings.announcementBanner.color === 'yellow' ? '#d97706' : settings.announcementBanner.color === 'green' ? '#059669' : settings.announcementBanner.color === 'red' ? '#dc2626' : settings.announcementBanner.color === 'purple' ? '#9333ea' : settings.announcementBanner.color === 'cyan' ? '#0891b2' : '#2563eb', color: settings.announcementBanner.color === 'yellow' ? 'black' : 'white' }}
                                    >
                                        📢 {settings.announcementBanner.text}
                                        {settings.announcementBanner.linkText && <span className="underline font-bold ml-2">{settings.announcementBanner.linkText} →</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'promo' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">🎁 Promotional Popup</h3>
                            <p className="text-slate-400 text-sm">Configure a centered popup that appears to visitors offering a discount or special message.</p>

                            <div className="p-4 border border-slate-700 rounded-xl space-y-4">
                                <Toggle label="Enable Promo Popup" value={settings.promoPopup?.enabled || false} onChange={(v) => handleChange('promoPopup', 'enabled', v)} />

                                <Input label="Popup Title" value={settings.promoPopup?.title} onChange={(v) => handleChange('promoPopup', 'title', v)} placeholder="Special Offer!" />
                                <Input textarea label="Popup Message" value={settings.promoPopup?.message} onChange={(v) => handleChange('promoPopup', 'message', v)} placeholder="Get 10% off your first repair with our exclusive coupon code." />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Coupon Code to Display" value={settings.promoPopup?.couponCode} onChange={(v) => handleChange('promoPopup', 'couponCode', v)} placeholder="WELCOME10" />
                                    <Input type="number" label="Delay before appearing (Seconds)" value={settings.promoPopup?.delay?.toString()} onChange={(v) => handleChange('promoPopup', 'delay', Number(v))} placeholder="5" />
                                </div>
                                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300 flex gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>The popup will only be shown once per visitor session to avoid spamming the user.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
