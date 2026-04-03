import React, { useState } from 'react';
import { Globe, Save, Layout, Phone, Type, Image as ImageIcon, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';

export const DashboardGlobalSettings: React.FC = () => {
    const { t } = useTranslation();
    const { settings, updateSettings, loading } = useSettings();
    const [activeTab, setActiveTab] = useState('hero');
    const [localSettings, setLocalSettings] = useState(settings);

    // Sync local state when settings load
    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = async () => {
        await updateSettings(localSettings);
    };

    const handleChange = (section: string, field: string, value: any) => {
        setLocalSettings(prev => {
            const currentSection = (prev as any)[section] || {};
            return {
                ...prev,
                [section]: {
                    ...(currentSection as any),
                    [field]: value
                }
            };
        });
    };

    if (loading) return <div className="text-white">{t('common.loading', 'Loading settings...')}</div>;

    const sections = [
        { id: 'theme', label: t('settings.global.tab.theme', 'Theme Colors'), icon: <Palette className="w-4 h-4" /> },
        { id: 'hero', label: t('settings.global.tab.hero', 'Hero Section'), icon: <Layout className="w-4 h-4" /> },
        { id: 'contact', label: t('settings.global.tab.contact', 'Contact Info'), icon: <Phone className="w-4 h-4" /> },
        { id: 'content', label: t('settings.global.tab.content', 'Text Content'), icon: <Type className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-400" />
                    {t('settings.global.title', 'Global Settings')}
                </h2>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {t('common.saveChanges', 'Save Changes')}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-1">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === section.id
                            ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        {section.icon}
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                {activeTab === 'theme' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('settings.global.theme.palette', 'Color Palette')}</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.theme.primary', 'Primary Color')}</label>
                                <div className="flex gap-3 items-center bg-slate-800 border border-slate-700 rounded-lg p-2">
                                    <input
                                        id="primaryColor"
                                        type="color"
                                        value={localSettings.theme?.primaryColor || '#06b6d4'} // Default to a cyan/blue
                                        onChange={e => handleChange('theme', 'primaryColor', e.target.value)}
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
                                        title={t('settings.global.theme.primary', 'Primary Color')}
                                    />
                                    <input
                                        type="text"
                                        aria-label={t('settings.global.theme.primaryHex', 'Primary Color Hex')}
                                        value={localSettings.theme?.primaryColor || '#06b6d4'}
                                        onChange={e => handleChange('theme', 'primaryColor', e.target.value)}
                                        className="w-full bg-transparent text-white border-0 outline-none font-mono"
                                        placeholder="#06b6d4"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{t('settings.global.theme.primaryHint', 'Used for main buttons, active links, and prominent highlights.')}</p>
                            </div>
                            <div>
                                <label htmlFor="secondaryColor" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.theme.secondary', 'Secondary Color')}</label>
                                <div className="flex gap-3 items-center bg-slate-800 border border-slate-700 rounded-lg p-2">
                                    <input
                                        id="secondaryColor"
                                        type="color"
                                        value={localSettings.theme?.secondaryColor || '#3b82f6'} // Default to a standard blue
                                        onChange={e => handleChange('theme', 'secondaryColor', e.target.value)}
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
                                        title={t('settings.global.theme.secondary', 'Secondary Color')}
                                    />
                                    <input
                                        type="text"
                                        aria-label={t('settings.global.theme.secondaryHex', 'Secondary Color Hex')}
                                        value={localSettings.theme?.secondaryColor || '#3b82f6'}
                                        onChange={e => handleChange('theme', 'secondaryColor', e.target.value)}
                                        className="w-full bg-transparent text-white border-0 outline-none font-mono"
                                        placeholder="#3b82f6"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{t('settings.global.theme.secondaryHint', 'Used for secondary buttons, gradients, and subtle accents.')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hero' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('settings.global.hero.config', 'Hero Configuration')}</h3>
                        <div>
                            <label htmlFor="heroHeadline" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.hero.headline', 'Headline')}</label>
                            <textarea
                                id="heroHeadline"
                                value={localSettings.hero?.headline || ''}
                                onChange={e => handleChange('hero', 'headline', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white h-24"
                                placeholder={t('settings.global.hero.headline', 'Headline')}
                            />
                        </div>
                        <div>
                            <label htmlFor="heroSubheadline" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.hero.subheadline', 'Subheadline')}</label>
                            <input
                                id="heroSubheadline"
                                type="text"
                                value={localSettings.hero?.subheadline || ''}
                                onChange={e => handleChange('hero', 'subheadline', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                placeholder={t('settings.global.hero.subheadline', 'Subheadline')}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="buttonMarket" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.hero.button1', 'Button 1 Text')}</label>
                                <input
                                    id="buttonMarket"
                                    type="text"
                                    value={localSettings.hero?.buttonMarket || ''}
                                    onChange={e => handleChange('hero', 'buttonMarket', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder={t('settings.global.hero.button1', 'Button 1 Text')}
                                />
                            </div>
                            <div>
                                <label htmlFor="buttonValuation" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.hero.button2', 'Button 2 Text')}</label>
                                <input
                                    id="buttonValuation"
                                    type="text"
                                    value={localSettings.hero?.buttonValuation || ''}
                                    onChange={e => handleChange('hero', 'buttonValuation', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder={t('settings.global.hero.button2', 'Button 2 Text')}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="heroImage" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.hero.image', 'Hero Image URL')}</label>
                            <div className="flex gap-2">
                                <input
                                    id="heroImage"
                                    type="text"
                                    value={localSettings.hero?.heroImage || ''}
                                    onChange={e => handleChange('hero', 'heroImage', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder={t('settings.global.hero.image', 'Hero Image URL')}
                                />
                                <button
                                    title={t('common.selectImage', 'Select Image')}
                                    className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('settings.global.contact.info', 'Contact Information')}</h3>
                        <div>
                            <label htmlFor="contactAddress" className="block text-sm font-medium text-slate-400 mb-1">{t('common.address', 'Address')}</label>
                            <input
                                id="contactAddress"
                                type="text"
                                value={localSettings.contactSection?.address || ''}
                                onChange={e => setLocalSettings(prev => ({
                                    ...prev,
                                    contactSection: { ...prev.contactSection, address: e.target.value }
                                }))}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                placeholder={t('common.address', 'Address')}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-400 mb-1">{t('common.phone', 'Phone')}</label>
                                <input
                                    id="contactPhone"
                                    type="text"
                                    value={localSettings.contactSection?.phone || ''}
                                    onChange={e => setLocalSettings(prev => ({
                                        ...prev,
                                        contactSection: { ...prev.contactSection, phone: e.target.value }
                                    }))}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder={t('common.phone', 'Phone')}
                                />
                            </div>
                            <div>
                                <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-400 mb-1">{t('common.email', 'Email')}</label>
                                <input
                                    id="contactEmail"
                                    type="text"
                                    value={localSettings.contactSection?.email || ''}
                                    onChange={e => setLocalSettings(prev => ({
                                        ...prev,
                                        contactSection: { ...prev.contactSection, email: e.target.value }
                                    }))}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder={t('common.email', 'Email')}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('settings.global.content.titles', 'Section Titles')}</h3>
                        <div>
                            <label htmlFor="repairTitle" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.content.repairTitle', 'Repair Section Title')}</label>
                            <input
                                id="repairTitle"
                                type="text"
                                value={localSettings.content?.repairTitle || ''}
                                onChange={e => handleChange('content', 'repairTitle', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                placeholder={t('settings.global.content.repairTitle', 'Repair Section Title')}
                            />
                        </div>
                        <div>
                            <label htmlFor="accessoriesTitle" className="block text-sm font-medium text-slate-400 mb-1">{t('settings.global.content.accessoriesTitle', 'Accessories Section Title')}</label>
                            <input
                                id="accessoriesTitle"
                                type="text"
                                value={localSettings.content?.accessoriesTitle || ''}
                                onChange={e => handleChange('content', 'accessoriesTitle', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                placeholder={t('settings.global.content.accessoriesTitle', 'Accessories Section Title')}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
