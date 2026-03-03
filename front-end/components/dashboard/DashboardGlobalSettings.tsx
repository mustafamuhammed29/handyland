import React, { useState } from 'react';
import { Globe, Save, Layout, Phone, Type, Image as ImageIcon, Palette } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const DashboardGlobalSettings: React.FC = () => {
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

    if (loading) return <div className="text-white">Loading settings...</div>;

    const sections = [
        { id: 'theme', label: 'Theme Colors', icon: <Palette className="w-4 h-4" /> },
        { id: 'hero', label: 'Hero Section', icon: <Layout className="w-4 h-4" /> },
        { id: 'contact', label: 'Contact Info', icon: <Phone className="w-4 h-4" /> },
        { id: 'content', label: 'Text Content', icon: <Type className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-400" />
                    Global Settings
                </h2>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
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
                        <h3 className="text-lg font-bold text-white mb-4">Color Palette</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Primary Color</label>
                                <div className="flex gap-3 items-center bg-slate-800 border border-slate-700 rounded-lg p-2">
                                    <input
                                        type="color"
                                        value={localSettings.theme?.primaryColor || '#06b6d4'} // Default to a cyan/blue
                                        onChange={e => handleChange('theme', 'primaryColor', e.target.value)}
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.theme?.primaryColor || '#06b6d4'}
                                        onChange={e => handleChange('theme', 'primaryColor', e.target.value)}
                                        className="w-full bg-transparent text-white border-0 outline-none font-mono"
                                        placeholder="#06b6d4"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Used for main buttons, active links, and prominent highlights.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Secondary Color</label>
                                <div className="flex gap-3 items-center bg-slate-800 border border-slate-700 rounded-lg p-2">
                                    <input
                                        type="color"
                                        value={localSettings.theme?.secondaryColor || '#3b82f6'} // Default to a standard blue
                                        onChange={e => handleChange('theme', 'secondaryColor', e.target.value)}
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.theme?.secondaryColor || '#3b82f6'}
                                        onChange={e => handleChange('theme', 'secondaryColor', e.target.value)}
                                        className="w-full bg-transparent text-white border-0 outline-none font-mono"
                                        placeholder="#3b82f6"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Used for secondary buttons, gradients, and subtle accents.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hero' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Hero Configuration</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Headline</label>
                            <textarea
                                value={localSettings.hero?.headline || ''}
                                onChange={e => handleChange('hero', 'headline', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Subheadline</label>
                            <input
                                type="text"
                                value={localSettings.hero?.subheadline || ''}
                                onChange={e => handleChange('hero', 'subheadline', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Button 1 Text</label>
                                <input
                                    type="text"
                                    value={localSettings.hero?.buttonMarket || ''}
                                    onChange={e => handleChange('hero', 'buttonMarket', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Button 2 Text</label>
                                <input
                                    type="text"
                                    value={localSettings.hero?.buttonValuation || ''}
                                    onChange={e => handleChange('hero', 'buttonValuation', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Hero Image URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={localSettings.hero?.heroImage || ''}
                                    onChange={e => handleChange('hero', 'heroImage', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                                <button className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white">
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
                            <input
                                type="text"
                                value={localSettings.contactSection?.address || ''}
                                onChange={e => setLocalSettings(prev => ({
                                    ...prev,
                                    contactSection: { ...prev.contactSection, address: e.target.value }
                                }))}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={localSettings.contactSection?.phone || ''}
                                    onChange={e => setLocalSettings(prev => ({
                                        ...prev,
                                        contactSection: { ...prev.contactSection, phone: e.target.value }
                                    }))}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                <input
                                    type="text"
                                    value={localSettings.contactSection?.email || ''}
                                    onChange={e => setLocalSettings(prev => ({
                                        ...prev,
                                        contactSection: { ...prev.contactSection, email: e.target.value }
                                    }))}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Section Titles</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Repair Section Title</label>
                            <input
                                type="text"
                                value={localSettings.content?.repairTitle || ''}
                                onChange={e => handleChange('content', 'repairTitle', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Accessories Section Title</label>
                            <input
                                type="text"
                                value={localSettings.content?.accessoriesTitle || ''}
                                onChange={e => handleChange('content', 'accessoriesTitle', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
