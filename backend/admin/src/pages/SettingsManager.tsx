import { useEffect, useState } from 'react';
import { Save, Trash2, Layers, MonitorPlay, BarChart, ScanLine, LayoutTemplate, MessageSquare, ArrowRight, Edit3, X, Eye, EyeOff, AlertCircle, Shield, Bell, Gift, Globe, FileText, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import ImageUpload from '../components/ImageUpload';

// Extracted Tab Components
import { HeroSettingsTab } from './settings/HeroSettingsTab';
import { SocialAuthTab } from './settings/SocialAuthTab';
import { SectionsTab } from './settings/SectionsTab';
import { ContactSettingsTab } from './settings/ContactSettingsTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { FinancialSettingsTab } from './settings/FinancialSettingsTab';
import { InvoiceSettingsTab } from './settings/InvoiceSettingsTab';
import { FeaturesTab } from './settings/FeaturesTab';

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

interface FeatureSettings {
    comparisonEngine: boolean;
    cartUpselling: boolean;
    loyalty: {
        enabled: boolean;
        earnRate: number;
        redeemRate: number;
        silverThreshold: number;
        goldThreshold: number;
        platinumThreshold: number;
    }
}

interface Settings {
    siteName: string;
    contactEmail: string;
    footerText: string;
    freeShippingThreshold: number;
    language?: string;
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
    seo?: {
        defaultMetaTitle: string;
        defaultMetaDescription: string;
        defaultKeywords: string;
        defaultOgImage: string;
        faviconUrl: string;
        googleAnalyticsId: string;
        facebookPixelId: string;
    };
    taxRate: number;
    vipTiers: {
        id: string;
        name: string;
        color: string;
        minSpent: number;
        maxSpent: number;
    }[];
    ecoImpact?: {
        enabled: boolean;
        co2PerDevice: number;
        eWastePerDevice: number;
    };
    invoice?: {
        logoUrl: string;
        primaryColor: string;
        companyName: string;
        companyAddress: string;
        vatNumber: string;
        bankName: string;
        iban: string;
        bic: string;
        footerText: string;
        prefix: string;
        titleLabel: string;
        dateLabel: string;
        numberLabel: string;
        vatIdLabel: string;
        subtotalLabel: string;
        taxLabel: string;
        shippingLabel: string;
        discountLabel: string;
        totalLabel: string;
        printBtnLabel: string;
        closeBtnLabel: string;
        itemLabel: string;
        quantityLabel: string;
        priceLabel: string;
    };
    features?: FeatureSettings;
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
        language: 'de',
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
        ],
        seo: {
            defaultMetaTitle: 'HandyLand - E-Commerce & Repair Services',
            defaultMetaDescription: 'Your one-stop shop for electronics, mobile phones, and reliable repair services.',
            defaultKeywords: 'handyland, electronics, mobile repair, buy phones, sell phones',
            defaultOgImage: '',
            faviconUrl: '',
            googleAnalyticsId: '',
            facebookPixelId: ''
        },
        taxRate: 19,
        vipTiers: [
            { id: 'bronze', name: 'Bronze', color: 'from-[#cd7f32] to-[#8b5a2b]', minSpent: 0, maxSpent: 500 },
            { id: 'silver', name: 'Silver', color: 'from-slate-300 to-slate-500', minSpent: 500, maxSpent: 2000 },
            { id: 'gold', name: 'Gold', color: 'from-amber-400 to-yellow-600', minSpent: 2000, maxSpent: 5000 },
            { id: 'platinum', name: 'Platinum', color: 'from-slate-200 to-slate-400', minSpent: 5000, maxSpent: 10000 },
            { id: 'diamond', name: 'Diamond', color: 'from-cyan-300 to-blue-500', minSpent: 10000, maxSpent: 50000 }
        ],
        ecoImpact: {
            enabled: true,
            co2PerDevice: 79,
            eWastePerDevice: 0.18
        },
        invoice: {
            logoUrl: '',
            primaryColor: '#00bcd4',
            companyName: 'HandyLand GmbH',
            companyAddress: 'Tech Street 123 - 10115 Berlin - Germany',
            vatNumber: 'DE123456789',
            bankName: '',
            iban: '',
            bic: '',
            footerText: 'Thank you for your business!',
            prefix: 'HL-',
            titleLabel: 'Invoice',
            dateLabel: 'Date:',
            numberLabel: 'Invoice #:',
            vatIdLabel: 'VAT ID:',
            subtotalLabel: 'Subtotal:',
            taxLabel: 'VAT',
            shippingLabel: 'Shipping:',
            discountLabel: 'Discount',
            totalLabel: 'Total:',
            printBtnLabel: 'Print Invoice',
            closeBtnLabel: 'Close',
            itemLabel: 'Item',
            quantityLabel: 'Quantity',
            priceLabel: 'Price'
        },
        features: {
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
        }
    });
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    const showSaveToast = (type: 'success' | 'error', text: string) => {
        if (type === 'success') toast.success(text);
        else toast.error(text);
    };

    // Email Templates State
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplateData[]>([]);
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplateData | null>(null);
    const [emailEditMode, setEmailEditMode] = useState(false);
    const [editSubject, setEditSubject] = useState('');
    const [editHtml, setEditHtml] = useState('');
    const [emailPreview, setEmailPreview] = useState(false);
    const [emailSaving, setEmailSaving] = useState(false);
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
                    features: { ...prev.features, ...(data.features || {}) },
                    promoPopup: { ...prev.promoPopup, ...(data.promoPopup || {}) },
                    announcementBanner: { ...prev.announcementBanner, ...(data.announcementBanner || {}) },
                    seo: { ...prev.seo, ...(data.seo || {}) },
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
        if (type === 'success') toast.success(text);
        else toast.error(text);
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
        { id: 'financials', label: 'Financials & Loyalty', icon: Gift },
        { id: 'auth', label: 'Authentication', icon: Shield },
        { id: 'hero', label: 'Hero Section', icon: MonitorPlay },
        { id: 'features', label: 'Feature Controls', icon: Zap },
        { id: 'stats', label: 'Live Stats', icon: BarChart },
        { id: 'archive', label: 'Repair Archive', icon: ScanLine },
        { id: 'content', label: 'Content', icon: MessageSquare },
        { id: 'contact', label: 'Contact Info', icon: MessageSquare },
        { id: 'layout', label: 'Layout Control', icon: LayoutTemplate },
        { id: 'banner', label: '📢 Announcement', icon: Layers },
        { id: 'promo', label: '🎁 Promo Popup', icon: Layers },
        { id: 'invoice', label: '🧾 Invoice Settings', icon: FileText },
        { id: 'seo', label: 'SEO & Meta', icon: Globe },
        { id: 'scripts', label: '💬 Support Scripts', icon: MessageSquare },
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
                    {activeTab === 'general' && <AppearanceTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'features' && <FeaturesTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'financials' && <FinancialSettingsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'auth' && <SocialAuthTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'hero' && <HeroSettingsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'layout' && <SectionsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'invoice' && <InvoiceSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-500/10 rounded-xl">
                                    <BarChart className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Live Performance Stats</h3>
                                    <p className="text-slate-400 text-sm">Control the numbers displayed in the impact statistics row.</p>
                                </div>
                            </div>
                            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                                <h4 className="text-emerald-400 font-bold mb-4">Core Numbers</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Devices Repaired / Traded" value={settings.stats?.devicesRepaired?.toString()} onChange={(v) => handleChange('stats', 'devicesRepaired', Number(v))} type="number" />
                                    <Input label="Happy Customers" value={settings.stats?.happyCustomers?.toString()} onChange={(v) => handleChange('stats', 'happyCustomers', Number(v))} type="number" />
                                    <Input label="Average Rating (out of 5)" value={settings.stats?.averageRating?.toString()} onChange={(v) => handleChange('stats', 'averageRating', Number(v))} type="number" />
                                    <Input label="Years Experience in Market" value={settings.stats?.marketExperience?.toString()} onChange={(v) => handleChange('stats', 'marketExperience', Number(v))} type="number" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-500/10 rounded-xl">
                                        <ScanLine className="text-purple-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Repair Archive Overview</h3>
                                        <p className="text-slate-400 text-sm">Configure the texts and metrics of the Repair Showcase section.</p>
                                    </div>
                                </div>
                                <Link to="/archive" className="flex items-center gap-2 text-cyan-400 hover:text-white font-bold text-sm bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition">
                                    Manage Repair Cases <ArrowRight size={16} />
                                </Link>
                            </div>
                            
                            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                                <h4 className="text-purple-400 font-bold mb-2">Typography & CTA</h4>
                                <Input label="Section Main Title" value={settings.repairArchive?.title} onChange={(v) => handleChange('repairArchive', 'title', v)} placeholder="REPAIR ARCHIVE" />
                                <Input label="Section Subtitle" value={settings.repairArchive?.subtitle} onChange={(v) => handleChange('repairArchive', 'subtitle', v)} placeholder="Real documentation of our successful operations" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 mt-4">
                                    <Input label="Action Button Text" value={settings.repairArchive?.buttonText} onChange={(v) => handleChange('repairArchive', 'buttonText', v)} placeholder="View Full Archive" />
                                    <Input label="Live Counter: Total Success Stories" value={settings.repairArchive?.totalRepairs?.toString()} onChange={(v) => handleChange('repairArchive', 'totalRepairs', Number(v))} type="number" />
                                </div>
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
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <MessageSquare className="text-amber-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Section Typography Context</h3>
                                    <p className="text-slate-400 text-sm">Manage the dynamic headers for various blocks on the homepage.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                                    <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2">Accessories Block</h4>
                                    <div className="space-y-4">
                                        <Input label="Block Title" value={settings.content.accessoriesTitle} onChange={(v) => handleChange('content', 'accessoriesTitle', v)} placeholder="Premium Cases & Wraps" />
                                        <Input label="Block Subtitle" value={settings.content.accessoriesSubtitle} onChange={(v) => handleChange('content', 'accessoriesSubtitle', v)} placeholder="We offer more than just repairs." />
                                    </div>
                                </div>
                                <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                                    <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">Repair Services Block</h4>
                                    <div className="space-y-4">
                                        <Input label="Block Title" value={settings.content.repairTitle} onChange={(v) => handleChange('content', 'repairTitle', v)} placeholder="Certified Component Exchange" />
                                        <Input label="Block Subtitle" value={settings.content.repairSubtitle} onChange={(v) => handleChange('content', 'repairSubtitle', v)} placeholder="Only OEM or top-grade components." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && <ContactSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <Globe className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">SEO & Meta Tags</h3>
                                    <p className="text-slate-400 text-sm">Configure default search engine optimization tags and analytics tracking.</p>
                                </div>
                            </div>

                            <div className="p-5 border border-slate-700 rounded-xl space-y-5">
                                <h4 className="text-blue-400 font-bold mb-2">Global Meta Details</h4>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Default Meta Title</label>
                                    <input
                                        type="text"
                                        placeholder="HandyLand — Germany's #1 Phone Marketplace"
                                        value={settings.seo?.defaultMetaTitle || ''}
                                        onChange={e => handleChange('seo', 'defaultMetaTitle', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Default Meta Description</label>
                                    <textarea
                                        placeholder="Describe your site for search engines..."
                                        value={settings.seo?.defaultMetaDescription || ''}
                                        onChange={e => handleChange('seo', 'defaultMetaDescription', e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Recommended 150-160 characters.</p>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Default Keywords</label>
                                    <input
                                        type="text"
                                        value={settings.seo?.defaultKeywords || ''}
                                        onChange={e => handleChange('seo', 'defaultKeywords', e.target.value)}
                                        placeholder="Comma-separated keywords"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="mt-4">
                                    <ImageUpload
                                        label="Default OpenGraph Image (Used when sharing links)"
                                        value={settings.seo?.defaultOgImage || ''}
                                        onChange={(url: string) => handleChange('seo', 'defaultOgImage', url)}
                                    />
                                </div>
                                <div className="mt-4">
                                    <ImageUpload
                                        label="Global Site Favicon (Browser Tab Icon)"
                                        value={settings.seo?.faviconUrl || ''}
                                        onChange={url => handleChange('seo', 'faviconUrl', url)}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Recommended size: 32x32px or 64x64px (PNG or ICO).</p>
                                </div>
                            </div>

                            <div className="p-5 border border-slate-700 rounded-xl space-y-5">
                                <h4 className="text-blue-400 font-bold mb-2">Analytics & Tracking</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">Google Analytics ID (G-XXXX)</label>
                                        <input
                                            type="text"
                                            value={settings.seo?.googleAnalyticsId || ''}
                                            onChange={e => handleChange('seo', 'googleAnalyticsId', e.target.value)}
                                            placeholder="G-..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2">Facebook Pixel ID</label>
                                        <input
                                            type="text"
                                            value={settings.seo?.facebookPixelId || ''}
                                            onChange={e => handleChange('seo', 'facebookPixelId', e.target.value)}
                                            placeholder="1234567890..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
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
                                            placeholder="5"
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

export const Input = ({ label, value, onChange, type = "text", textarea = false, placeholder }: InputProps) => (
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

export const Toggle = ({ label, value, onChange }: { label: string, value: boolean | undefined, onChange: (val: boolean) => void }) => (
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
