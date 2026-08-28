export interface HeroMediaSettings {
    mode: 'content' | 'video';
    videoUrl?: string;
    posterUrl?: string;
    altText?: string;
    updatedAt?: string;
}

export interface HeroSettings {
    bgStart: string;
    bgEnd: string;
    headline: string;
    subheadline: string;
    subheadlineAr?: string;
    accentColor: string;
    tagline?: string;
    buttonMarket?: string;
    buttonValuation?: string;
    trustBadge1?: string;
    trustBadge2?: string;
    trustBadge3?: string;
    heroImage?: string;
    productLabel?: string;
    productName?: string;
    productPrice?: string;
    stat1Title?: string;
    stat1Value?: string;
    stat2Title?: string;
    stat2Value?: string;
    media?: HeroMediaSettings;
}

export interface ContentSettings {
    accessoriesTitle: string;
    accessoriesSubtitle: string;
    repairTitle: string;
    repairSubtitle: string;
}

export interface StatsSettings {
    devicesRepaired: number;
    happyCustomers: number;
    averageRating: number;
    marketExperience: number;
    successRate?: number;
    yearsExperience?: number;
}

export interface RepairArchiveSettings {
    title: string;
    subtitle: string;
    buttonText: string;
    totalRepairs: number;
}

export interface SectionSettings {
    hero: boolean;
    stats: boolean;
    repairGallery: boolean;
    marketplace: boolean;
    accessories: boolean;
    contact: boolean;
    marketplacePage?: boolean;
    marketplacePageComingSoon?: boolean;
    valuationPage?: boolean;
    valuationPageComingSoon?: boolean;
    repairPage?: boolean;
    repairPageComingSoon?: boolean;
    trackRepairPage?: boolean;
    trackRepairPageComingSoon?: boolean;
    accessoriesPage?: boolean;
    accessoriesPageComingSoon?: boolean;
    authSystem?: boolean;
    authSystemComingSoon?: boolean;
}

export interface WhatsAppSettings {
  enabled: boolean;
  repairEnabled?: boolean;
  phoneNumber: string;
  message: string;
}

export interface FooterSettings {
    aboutText?: string;
    tagline?: string;
    copyright?: string;
    quickLinks: boolean;
    legalLinks: boolean;
    newsletter: boolean;
    socialLinks: boolean;
    columns?: { title: string; links: { label: string; url: string }[] }[];
    bottomLinks?: { label: string; url: string }[];
}

export type LocalizedText = {
    de: string;
    en: string;
    ar: string;
};

export type ServiceTerminalIcon =
    | 'monitor'
    | 'battery'
    | 'smartphone'
    | 'wrench'
    | 'camera'
    | 'zap'
    | 'shield'
    | 'headphones';

export interface ServiceTerminalService {
    id: string;
    enabled: boolean;
    title: LocalizedText;
    priceLabel: LocalizedText;
    icon: ServiceTerminalIcon;
    iconColor: string;
    cardBackground: string;
    order: number;
}

export interface ServiceTerminalSettings {
    enabled: boolean;
    eyebrow: LocalizedText;
    title: LocalizedText;
    servicesLinkLabel: LocalizedText;
    servicesLinkUrl: string;
    services: ServiceTerminalService[];
    cta: {
        enabled: boolean;
        title: LocalizedText;
        description: LocalizedText;
        buttonLabel: LocalizedText;
        buttonUrl: string;
    };
}

export interface Settings {
    siteName?: string;
    contactEmail?: string;
    footerText?: string;
    language?: string;
    navbar?: {
        logoText?: string;
        logoAccentText?: string;
        showLanguageSwitcher?: boolean;
        links?: { labelKey?: string; defaultLabel: string; path: string; iconName?: string }[];
    };
    hero: HeroSettings;
    valuation: {
        step1Title: string;
        step2Title?: string;
        step3Title?: string;
        screenConditions?: { id: string; title: string; desc: string; }[];
        bodyConditions?: { id: string; title: string; desc: string; }[];
    };
    content: ContentSettings;
    stats: StatsSettings;
    repairArchive: RepairArchiveSettings;
    sections: SectionSettings;
    footerSection?: FooterSettings;
    contactSection?: {
        address?: string;
        phone?: string;
        email?: string;
        mapUrl?: string;
        formTitle?: string;
        formButton?: string;
        socialLinks?: {
            platform: string;
            url: string;
            iconName: string;
            colorClass: string;
        }[];
        whatsappPhone?: string;
        whatsappMessage?: string;
    };
    announcementBanner?: {
        enabled?: boolean;
        text?: string;
        color?: string;
        dismissible?: boolean;
        link?: string;
        linkText?: string;
    };
    promoPopup?: {
        enabled?: boolean;
        title?: string;
        message?: string;
        couponCode?: string;
        delay?: number;
        couponDetails?: {
            discountType: 'percentage' | 'fixed';
            discountValue: number;
            validUntil: string;
            usageLimit: number | null;
            usedCount: number;
        };
    };
    featuredServices?: {
        tagline: string;
        heading: string;
        cards: {
            id: string;
            iconName: string;
            title: string;
            desc: string;
            cta: string;
            route: string;
            gradient: string;
            border: string;
            iconColor: string;
            ctaColor: string;
        }[];
    };

    repairPreviewCards?: {
        iconName: string;
        label: string;
        price: string;
        color: string;
        bg: string;
    }[];
    serviceTerminal?: ServiceTerminalSettings;
    accessoryCategories?: any[];
    accessoryFaqs?: { question: string; answer: string; }[];
    features?: {
        comparisonEngine?: boolean;
        cartUpselling?: boolean;
        whatsappOrders?: WhatsAppSettings;
        loyalty?: {
            enabled: boolean;
            earnRate: number;
            redeemRate: number;
            silverThreshold: number;
            goldThreshold: number;
            platinumThreshold: number;
        };
    };
    socialAuth?: {
        google?: boolean;
        facebook?: boolean;
    };
    productFaqs?: {
        question: string;
        answer: string;
    }[];
    seo?: {
        defaultMetaTitle?: string;
        defaultMetaDescription?: string;
        defaultKeywords?: string;
        defaultOgImage?: string;
        faviconUrl?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        googleSiteVerificationId?: string;
    };
    cookieConsent?: {
        enabled?: boolean;
        title?: string;
        message?: string;
        acceptAllBtn?: string;
        rejectAllBtn?: string;
        manageBtn?: string;
        saveBtn?: string;
        strictlyNecessaryTitle?: string;
        strictlyNecessaryDesc?: string;
        functionalTitle?: string;
        functionalDesc?: string;
        analyticsTitle?: string;
        analyticsDesc?: string;
        marketingTitle?: string;
        marketingDesc?: string;
    };
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
    };
    freeShippingThreshold?: number;
    payment?: {
        stripe?: {
            enabled: boolean;
            publicKey: string;
            secretKey?: string;
            webhookSecret?: string;
        };
        paypal?: {
            enabled: boolean;
            clientId: string;
            secretKey?: string;
        };
        klarna?: { enabled: boolean; publicKey: string; secretKey?: string; };
        giropay?: { enabled: boolean; publicKey: string; secretKey?: string; };
        sepa?: { enabled: boolean; publicKey: string; secretKey?: string; };
        sofort?: { enabled: boolean; publicKey: string; secretKey?: string; };
        cashOnDelivery?: { enabled: boolean; };
        bankTransfer?: {
            enabled: boolean;
            instructions: string;
            bankName?: string;
            accountHolder?: string;
            iban?: string;
            bic?: string;
        };
    };
}

export interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => Promise<void>;
    loading: boolean;
    error: boolean;
}
