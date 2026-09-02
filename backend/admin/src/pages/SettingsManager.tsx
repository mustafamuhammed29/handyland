import { useEffect, useState } from 'react';
import { Save, Layers, MonitorPlay, BarChart, ScanLine, LayoutTemplate, MessageSquare, Edit3, X, Eye, EyeOff, AlertCircle, Shield, Gift, Globe, FileText, Zap, Wrench, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';


// Extracted Tab Components
import { HeroSettingsTab } from './settings/HeroSettingsTab';
import { SocialAuthTab } from './settings/SocialAuthTab';
import { SectionsTab } from './settings/SectionsTab';
import { ContactSettingsTab } from './settings/ContactSettingsTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { FinancialSettingsTab } from './settings/FinancialSettingsTab';
import { InvoiceSettingsTab } from './settings/InvoiceSettingsTab';
import { FeaturesTab } from './settings/FeaturesTab';
import { MaintenanceSettingsTab } from './settings/MaintenanceTab';
import { ProductFaqsTab } from './settings/ProductFaqsTab';
import { AccessoryCategoriesTab } from './settings/AccessoryCategoriesTab';
import { EmailSettingsTab } from './settings/EmailSettingsTab';
import { CookieSettingsTab } from './settings/CookieSettingsTab';
import { SEOTab } from './settings/SEOTab';
import { RepairCardsTab } from './settings/RepairCardsTab';
import { FeaturedServicesTab } from './settings/FeaturedServicesTab';
import { SuspensionSettingsTab } from './settings/SuspensionSettingsTab';
import { StatsSettingsTab } from './settings/StatsSettingsTab';
import { ArchiveSettingsTab } from './settings/ArchiveSettingsTab';
import { ContentSettingsTab } from './settings/ContentSettingsTab';
import { ScriptsSettingsTab } from './settings/ScriptsSettingsTab';
import { PromoSettingsTab } from './settings/PromoSettingsTab';
import { ValuationSettingsTab } from './settings/ValuationSettingsTab';
import { BannerSettingsTab } from './settings/BannerSettingsTab';
import DOMPurify from 'dompurify';

export interface HeroMediaSettings {
    mode: 'content' | 'video';
    videoUrl?: string;
    posterUrl?: string;
    altText?: string;
    updatedAt?: string;
}

interface HeroSettings {
    headline: string;
    subheadline: string;
    subheadlineAr?: string;
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
    media?: HeroMediaSettings;
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
    marketplacePage?: boolean;
    valuationPage?: boolean;
    repairPage?: boolean;
    trackRepairPage?: boolean;
    authSystem?: boolean;
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
        googleSiteVerificationId?: string;
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
    accountSuspension?: {
        title: string;
        subtitle: string;
        message: string;
        supportEmail: string;
        supportLabel: string;
    };
    productFaqs?: {
        question: string;
        answer: string;
    }[];
    accessoryCategories?: {
        id: string;
        label: string;
        icon: string;
    }[];
    cookieConsent?: {
        enabled: boolean;
        title: string;
        message: string;
        acceptAllBtn: string;
        rejectAllBtn: string;
        manageBtn: string;
        saveBtn: string;
        strictlyNecessaryTitle: string;
        strictlyNecessaryDesc: string;
        functionalTitle: string;
        functionalDesc: string;
        analyticsTitle: string;
        analyticsDesc: string;
        marketingTitle: string;
        marketingDesc: string;
    };
    repairPreviewCards?: any[];
    serviceTerminal?: any;
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
    verify_email: '✉️ Email Verification',
    reset_password: '🔑 Password Reset',
    order_confirmation: '🛒 Order Confirmation',
};

const EMAIL_TEMPLATE_ICONS: Record<string, string> = {
    verify_email: '✉️',
    reset_password: '🔑',
    order_confirmation: '🛒',
};

const PERMISSION_ERROR_PATTERNS = ['row-level security', 'permission denied', 'not authorized', 'rls'];
const SAFE_PERMISSION_MESSAGE = 'Speichern nicht möglich. Bitte prüfen Sie die Server-Berechtigungen und versuchen Sie es erneut.';

export const getErrorMessage = (error: unknown, fallback = 'Failed to save settings.'): string => {
    if (!error) return fallback;

    if (typeof error === 'string') {
        const trimmed = error.trim();
        if (!trimmed) return fallback;
        const lower = trimmed.toLowerCase();
        if (PERMISSION_ERROR_PATTERNS.some(p => lower.includes(p))) {
            return SAFE_PERMISSION_MESSAGE;
        }
        return trimmed;
    }

    let extracted: string | null = null;

    if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, any>;
        const respData = errObj.response?.data;

        // a. response.data.message as a non-empty string
        if (typeof respData?.message === 'string' && respData.message.trim()) {
            extracted = respData.message.trim();
        }
        // b. response.data.error.message as a non-empty string
        else if (typeof respData?.error?.message === 'string' && respData.error.message.trim()) {
            extracted = respData.error.message.trim();
        }
        // c. response.data.error as a non-empty string
        else if (typeof respData?.error === 'string' && respData.error.trim()) {
            extracted = respData.error.trim();
        }
        // d. error.message as a non-empty string
        else if (typeof errObj.message === 'string' && errObj.message.trim()) {
            extracted = errObj.message.trim();
        }
    }

    if (!extracted) {
        return fallback;
    }

    const lower = extracted.toLowerCase();
    if (PERMISSION_ERROR_PATTERNS.some(p => lower.includes(p))) {
        return SAFE_PERMISSION_MESSAGE;
    }

    return extracted;
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
            headline: '', subheadline: '', subheadlineAr: '', bgStart: '', bgEnd: '', accentColor: '',
            buttonMarket: '', buttonValuation: '', trustBadge1: '', trustBadge2: '', trustBadge3: '',
            heroImage: '', productName: '', productPrice: '', productLabel: '',
            stat1Title: '', stat1Value: '', stat2Title: '', stat2Value: '',
            media: { mode: 'content', videoUrl: '', posterUrl: '', altText: '' }
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
        sections: { hero: true, stats: true, repairGallery: true, marketplace: true, accessories: true, contact: true, marketplacePage: true, valuationPage: true, repairPage: true, trackRepairPage: true, authSystem: true },
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
        },
        accountSuspension: {
            title: 'Account Suspended',
            subtitle: 'حسابك محظور من قِبَل الإدارة',
            message: 'Your account has been suspended. Please contact support for assistance.',
            supportEmail: 'support@handyland.com',
            supportLabel: 'Contact Support'
        },
        productFaqs: [
            {
                question: 'Ist das Gerät ohne Simlock?',
                answer: 'Ja, alle unsere Geräte sind werksseitig entsperrt (ohne Simlock) und können mit jedem Netzbetreiber weltweit verwendet werden.'
            },
            {
                question: 'Was ist im Lieferumfang enthalten?',
                answer: 'Jedes Smartphone wird mit einem kompatiblen Ladekabel geliefert. Um Elektroschrott zu reduzieren, sind Netzteil und Kopfhörer nicht im Standard-Lieferumfang enthalten.'
            },
            {
                question: 'Wie lange ist die Garantie?',
                answer: 'Wir bieten standardmäßig 12 Monate Garantie auf alle unsere generalüberholten und neuen Geräte. Dies deckt alle technischen Defekte ab.'
            },
            {
                question: 'Kann ich das Gerät zurückgeben?',
                answer: 'Ja, Sie haben ein 14-tägiges Rückgaberecht ohne Angabe von Gründen, sofern sich das Gerät im gleichen Zustand wie bei der Lieferung befindet.'
            }
        ],
        accessoryCategories: [
            { id: 'audio', label: 'Audio', icon: 'Headphones' },
            { id: 'power', label: 'Energie', icon: 'Zap' },
            { id: 'protection', label: 'Schutz', icon: 'Shield' },
            { id: 'wearables', label: 'Wearables', icon: 'Watch' }
        ],
        cookieConsent: {
            enabled: true,
            title: 'Ihre Privatsphäre ist uns wichtig',
            message: 'Wir verwenden Cookies für eine Reihe von Auswertungen, um damit Ihren Besuch auf unserer Website kontinuierlich verbessern zu können (z. B. damit Ihnen Ihre Login-Daten erhalten bleiben).\n\nSie können Ihre Einstellungen ändern und verschiedenen Arten von Cookies erlauben, auf Ihrem Rechner gespeichert zu werden, während Sie unsere Webseite besuchen. Sie können auf Ihrem Rechner gespeicherte Cookies ebenso weitgehend wieder entfernen. Bitte bedenken Sie aber, dass dadurch Teile unserer Website möglicherweise nicht mehr in der gedachten Art und Weise nutzbar sind.',
            acceptAllBtn: 'Alle akzeptieren',
            rejectAllBtn: 'Ich lehne ab',
            manageBtn: 'Einstellungen ändern',
            saveBtn: 'Einstellungen speichern',
            strictlyNecessaryTitle: 'Technisch notwendige Cookies',
            strictlyNecessaryDesc: 'Erforderlich für die sichere Funktion der Website. Kann nicht deaktiviert werden.',
            functionalTitle: 'Funktions Cookies',
            functionalDesc: 'Ermöglicht der Website, erweiterte Funktionalität und Personalisierung bereitzustellen.',
            analyticsTitle: 'Tracking und Performance Cookies',
            analyticsDesc: 'Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, um die Benutzererfahrung zu verbessern.',
            marketingTitle: 'Targeting und Werbung Cookies',
            marketingDesc: 'Wird verwendet, um Werbung zu liefern, die relevanter für Sie und Ihre Interessen ist.'
        }
    });
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    const showSaveToast = (type: 'success' | 'error', text: unknown) => {
        const safeText = typeof text === 'string' && text.trim()
            ? text.trim()
            : getErrorMessage(text, 'Failed to save settings.');
        if (type === 'success') toast.success(safeText);
        else toast.error(safeText);
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
                const data = (response as any)?.data || response;

                // Extract actual settings object from the response wrapper
                const settingsData = data.settings || data.data || {};

                setSettings(prev => ({
                    ...prev,
                    ...settingsData,
                    features: { ...prev.features, ...(settingsData.features || {}) },
                    promoPopup: { ...prev.promoPopup, ...(settingsData.promoPopup || {}) },
                    announcementBanner: { ...prev.announcementBanner, ...(settingsData.announcementBanner || {}) },
                    seo: { ...prev.seo, ...(settingsData.seo || {}) },
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
        if (settings.hero?.media?.mode === 'video' && !settings.hero?.media?.videoUrl?.trim()) {
            showSaveToast('error', 'A valid video URL is required in Video Mode. Please upload a video file or switch to Content Mode before saving.');
            return;
        }

        try {
            await api.put('/api/settings', settings);
            showSaveToast('success', 'Settings saved successfully!');
        } catch (error: unknown) {
            console.error('Failed to save settings:', (error as any)?.response?.data || error);
            const serverMsg = getErrorMessage(error, 'Failed to save settings.');
            showSaveToast('error', serverMsg);
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
        { id: 'maintenance', label: 'Maintenance Mode', icon: Wrench },
        { id: 'suspension', label: '🚫 Account Suspension', icon: AlertCircle },
        { id: 'hero', label: 'Hero Section', icon: MonitorPlay },
        { id: 'features', label: 'Feature Controls', icon: Zap },
        { id: 'stats', label: 'Live Stats', icon: BarChart },
        { id: 'archive', label: 'Repair Archive', icon: ScanLine },
        { id: 'faqs', label: 'Product FAQs', icon: HelpCircle },
        { id: 'categories', label: 'Accessory Categories', icon: Layers },
        { id: 'content', label: 'Content', icon: MessageSquare },
        { id: 'contact', label: 'Contact Info', icon: MessageSquare },
        { id: 'layout', label: 'Layout Control', icon: LayoutTemplate },
        { id: 'banner', label: '📢 Announcement', icon: Layers },
        { id: 'promo', label: '🎁 Promo Popup', icon: Layers },
        { id: 'invoice', label: '🧾 Invoice Settings', icon: FileText },
        { id: 'cookie', label: '🍪 Cookie Consent', icon: Layers },
        { id: 'seo', label: 'SEO & Meta', icon: Globe },
        { id: 'repair-cards', label: '🔧 Service Terminal', icon: Wrench },
        { id: 'featured-services', label: '🌟 Featured Services', icon: Layers },
        { id: 'scripts', label: '💬 Support Scripts', icon: MessageSquare },
        { id: 'email-server', label: '📧 E-Mail Server', icon: Layers },
    ];

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">Global Settings</h2>
                    <p className="text-slate-400 mt-1">Configure your application appearance and text</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex w-full md:w-auto justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Save size={20} /> Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Tabs Selector */}
                <div className="sticky top-0 z-20 bg-slate-950/85 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0 lg:static lg:bg-transparent lg:p-0 w-full lg:w-64 shrink-0">
                    {/* Mobile Quick-Jump Dropdown */}
                    <div className="lg:hidden mb-3">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            aria-label="Select settings category"
                            className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3.5 w-full font-bold focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all shadow-inner"
                        >
                            {tabs.map(tab => (
                                <option key={tab.id} value={tab.id}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Horizontal / Sidebar Tab Bar */}
                    <div
                        role="tablist"
                        aria-label="Settings categories"
                        className="w-full flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar snap-x"
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                role="tab"
                                type="button"
                                aria-selected={activeTab === tab.id}
                                aria-controls={`panel-${tab.id}`}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl transition-all shrink-0 snap-start lg:w-full focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === tab.id
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800 border border-transparent'
                                    }`}
                            >
                                <tab.icon size={18} className="shrink-0" />
                                <span className="font-bold whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div
                    role="tabpanel"
                    id={`panel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-8"
                >
                    {activeTab === 'general' && <AppearanceTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'features' && <FeaturesTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'financials' && <FinancialSettingsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'auth' && <SocialAuthTab />}
                    {activeTab === 'maintenance' && <MaintenanceSettingsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'hero' && <HeroSettingsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'layout' && <SectionsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'invoice' && <InvoiceSettingsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'faqs' && <ProductFaqsTab settings={settings} handleChange={handleChange} />}
                    {activeTab === 'categories' && <AccessoryCategoriesTab settings={settings} handleChange={handleChange} />}
                    { activeTab === 'cookie' && <CookieSettingsTab settings={settings} handleChange={handleChange} /> }
                    { activeTab === 'seo' && <SEOTab settings={settings} handleChange={handleChange} /> }
                    { activeTab === 'repair-cards' && <RepairCardsTab settings={settings} handleChange={handleChange} /> }
                    { activeTab === 'featured-services' && <FeaturedServicesTab settings={settings} handleChange={handleChange} /> }
                    { activeTab === 'email-server' && <EmailSettingsTab /> }

                    {activeTab === 'suspension' && <SuspensionSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'stats' && <StatsSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'archive' && <ArchiveSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'valuation' && <ValuationSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'content' && <ContentSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'contact' && <ContactSettingsTab settings={settings} handleChange={handleChange} />}


                    {activeTab === 'scripts' && <ScriptsSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'banner' && <BannerSettingsTab settings={settings} handleChange={handleChange} />}

                    {activeTab === 'promo' && <PromoSettingsTab settings={settings} handleChange={handleChange} />}

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
                                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editHtml) }} />
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
