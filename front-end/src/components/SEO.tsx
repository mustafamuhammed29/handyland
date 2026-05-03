import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl } from '../utils/imageUrl';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogImage?: string;
    ogType?: string;
    twitterHandle?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    canonical,
    ogImage,
    ogType = 'website',
    twitterHandle = '@handyland'
}) => {
    const { settings } = useSettings();
    const seoSettings = settings?.seo || {};

    // Fallback logic
    const siteTitle = settings?.siteName || localStorage.getItem('handyland_sitename') || 'HandyLand';
    
    // If a specific title is given, use it. Otherwise, use global default, otherwise use site name.
    const finalTitle = title 
        ? `${title} | ${siteTitle}` 
        : (seoSettings.defaultMetaTitle || siteTitle);
        
    const finalDescription = description || seoSettings.defaultMetaDescription || '';
    const finalKeywords = keywords || seoSettings.defaultKeywords || '';
    
    // Resolve absolute paths for images to ensure they show up in external link sharing
    const rawOg = ogImage || seoSettings.defaultOgImage || '/og-image.jpg';
    const finalOgImage = rawOg.startsWith('http') ? rawOg : getImageUrl(rawOg);

    React.useEffect(() => {
        const link = document.getElementById('app-favicon') as HTMLLinkElement;
        if (link) {
            link.href = seoSettings.faviconUrl ? getImageUrl(seoSettings.faviconUrl) : '/favicon.ico?v=4';
            link.removeAttribute('type');
        }
    }, [seoSettings.faviconUrl]);

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{finalTitle}</title>
            <meta name='description' content={finalDescription} />
            {finalKeywords && <meta name='keywords' content={finalKeywords} />}
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph tags */}
            {seoSettings.googleSiteVerificationId && (
                <meta name="google-site-verification" content={seoSettings.googleSiteVerificationId} />
            )}
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={finalOgImage} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content={twitterHandle} />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={finalOgImage} />

            {/* Dynamic Favicon is handled via useEffect below to prevent duplicates */}

            {/* Google Analytics */}
            {seoSettings.googleAnalyticsId && (
                <script async src={`https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalyticsId}`}></script>
            )}
            {seoSettings.googleAnalyticsId && (
                <script type="text/javascript" dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${seoSettings.googleAnalyticsId}');
                    `
                }} />
            )}

            {/* Facebook Pixel */}
            {seoSettings.facebookPixelId && (
                <script type="text/javascript" dangerouslySetInnerHTML={{
                    __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${seoSettings.facebookPixelId}');
                        fbq('track', 'PageView');
                    `
                }} />
            )}

            {/* Advanced SEO Structured Data (JSON-LD) for Google */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": siteTitle,
                    "url": canonical || (typeof window !== 'undefined' ? window.location.origin : 'https://handyland.com'),
                    "description": finalDescription
                })}
            </script>
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": ["LocalBusiness", "MobilePhoneStore", "ElectronicsStore"],
                    "name": siteTitle,
                    "image": finalOgImage,
                    "description": finalDescription,
                    "priceRange": "€€",
                    "address": {
                        "@type": "PostalAddress",
                        "addressCountry": "DE"
                    }
                })}
            </script>
        </Helmet>
    );
};
