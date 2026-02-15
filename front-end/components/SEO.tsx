import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    ogImage?: string;
    ogType?: string;
    twitterHandle?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonical,
    ogImage = '/og-image.jpg',
    ogType = 'website',
    twitterHandle = '@handyland'
}) => {
    const siteTitle = 'HandyLand';
    const fullTitle = `${title} | ${siteTitle}`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name='description' content={description} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph tags */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content={twitterHandle} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    );
};
