import React, { useState } from 'react';
import { X, Megaphone, ExternalLink } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

/**
 * Admin-controlled announcement banner. Shown at the top of every page.
 * Configuration is managed via Settings > Announcement Banner in the admin panel.
 */
export const AnnouncementBanner: React.FC = () => {
    const { settings } = useSettings();
    const [dismissed, setDismissed] = useState(false);

    const banner = settings?.announcementBanner;

    if (!banner?.enabled || !banner?.text || dismissed) return null;

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-600 text-white',
        green: 'bg-emerald-600 text-white',
        yellow: 'bg-amber-500 text-black',
        red: 'bg-red-600 text-white',
        purple: 'bg-purple-600 text-white',
        cyan: 'bg-brand-primary text-white',
    };

    const colorClass = colorMap[banner.color] || colorMap.blue;

    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] ${colorClass} px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium shadow-lg`}>
            <Megaphone className="w-4 h-4 flex-shrink-0" />
            <span>{banner.text}</span>
            {banner.link && banner.linkText && (
                <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                    {banner.linkText} <ExternalLink className="w-3 h-3" />
                </a>
            )}
            {banner.dismissible !== false && (
                <button
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss announcement"
                    className="ml-auto p-1 rounded-full hover:bg-black/20 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
