import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MoveHorizontal, ScanLine, Smartphone, Hammer, Wand2, Droplets, Monitor, Cpu, Filter, Clock, Activity, X, Star, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RepairGalleryProps {}

const CATEGORIES_KEYS = [
    { id: 'all', labelKey: 'repairGallery.allCases', labelFallback: 'Alle Fälle', icon: <Filter className="w-4 h-4" /> },
    { id: 'screen', labelKey: 'repairGallery.screens', labelFallback: 'Displays', icon: <Monitor className="w-4 h-4" /> },
    { id: 'glass', labelKey: 'repairGallery.rearGlass', labelFallback: 'Rückglas', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'water', labelKey: 'repairGallery.waterDmg', labelFallback: 'Wasserschaden', icon: <Droplets className="w-4 h-4" /> },
    { id: 'camera', labelKey: 'repairGallery.camera', labelFallback: 'Kamera', icon: <ScanLine className="w-4 h-4" /> },
];

import { useSettings } from '../context/SettingsContext';
import { getImageUrl } from '../utils/imageUrl';

/** Strip HTML/XML tags from a string so raw DB content never renders as code */
const stripHtml = (raw: string): string => {
    if (!raw) return '';
    return raw
        .replace(/<[^>]*>/g, ' ')   // remove tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s{2,}/g, ' ')    // collapse whitespace
        .trim();
};

/** Expanded list of known-bad Unsplash IDs used in hotel/room seed data */
const HOTEL_IMAGE_SIGNATURES = [
    // Specific Unsplash photo IDs found in seed
    'photo-1585338107529', 'photo-1610945415295', 'photo-1634455848520',
    'photo-1512054502232', 'photo-1605236453806', 'photo-1592890288564',
    'photo-1540518614',    'photo-1566073771259', 'photo-1520250497591',
    'photo-1445019980597', 'photo-1449824913935', 'photo-1506665531195',
    'photo-1571896349842', 'photo-1631049307264', 'photo-1455587734955',
    // Keyword-based fallback
    'room', 'hotel', 'interior', 'placeholder', 'bedroom', 'lobby',
];

const REPAIR_IMAGES: Record<string, { before: string; after: string }> = {
    screen: {
        before: 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?q=80&w=600&auto=format&fit=crop',
        after:  'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600&auto=format&fit=crop',
    },
    battery: {
        before: 'https://images.unsplash.com/photo-1620283085439-39620a1e21c4?q=80&w=600&auto=format&fit=crop',
        after:  'https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=600&auto=format&fit=crop',
    },
    glass: {
        before: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?q=80&w=600&auto=format&fit=crop',
        after:  'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600&auto=format&fit=crop',
    },
    water: {
        before: 'https://images.unsplash.com/photo-1542546068979-b6affb46ea8f?q=80&w=600&auto=format&fit=crop',
        after:  'https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=600&auto=format&fit=crop',
    },
    camera: {
        before: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=600&auto=format&fit=crop',
        after:  'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=600&auto=format&fit=crop',
    },
    default: {
        before: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?q=80&w=600&auto=format&fit=crop',
        after:  'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=600&auto=format&fit=crop',
    },
};

/**
 * C-08 fix: always return a curated repair image based on category.
 * We do NOT trust URLs from the DB because seed data contains unpredictable
 * hotel/interior images that we cannot fully enumerate.
 */
const getCleanArchiveImage = (url: string, category: string, isAfter: boolean): string => {
    // Normalise: 'body'→'glass', 'power'→'battery' so lookup hits the right bucket
    const cat = category === 'body' ? 'glass' : category === 'power' ? 'battery' : category;
    const bucket = REPAIR_IMAGES[cat] || REPAIR_IMAGES.default;
    return isAfter ? bucket.after : bucket.before;
};

export const RepairGallery: React.FC<RepairGalleryProps> = () => {
    const navigate = useNavigate();
    const { settings: globalSettings } = useSettings();
    const { t } = useTranslation();
    const [sliderPosition, setSliderPosition] = useState(50);
    const [selectedId, setSelectedId] = useState<any>(null);
    const [filter, setFilter] = useState('all');
    const [isScanning, setIsScanning] = useState(false);
    const [comparisons, setComparisons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllModal, setShowAllModal] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/repair-archive');
            const data = await res.json();
            const casesArray = Array.isArray(data) ? data : (data.cases || []);
            setComparisons(casesArray);
            if (casesArray.length > 0) {
                setSelectedId(casesArray[0].id);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch repair archive", error);
            setLoading(false);
        }
    };

    // Use global settings for text
    const settings = {
        title: globalSettings.repairArchive?.title || 'Digital Repair Archive',
        subtitle: globalSettings.repairArchive?.subtitle || 'Archive_System_V2.0',
        buttonText: globalSettings.repairArchive?.buttonText || 'View All Repairs',
        totalRepairs: globalSettings.repairArchive?.totalRepairs || 1240,
        isEnabled: true
    };

    // ... (keep rest of logic)

    if (loading) {
        return (
            <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-800 border-t-brand-primary rounded-full animate-spin"></div>
                </div>
            </section>
        );
    }

    if (comparisons.length === 0) {
        return (
            <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500">{t('repairGallery.noCases', 'Noch keine verifizierten Fallstudien.')}</p>
                </div>
            </section>
        );
    }

    const activeProject = comparisons.find(c => c.id === selectedId) || comparisons[0];
    const filteredProjects = filter === 'all'
        ? comparisons
        : comparisons.filter(c => c.category === filter);

    const handleMove = (clientX: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            setSliderPosition(percentage);
        }
    };

    const handleMouseDown = () => { isDragging.current = true; };
    const handleMouseUp = () => { isDragging.current = false; };
    const handleMouseMove = (e: React.MouseEvent) => { if (isDragging.current) handleMove(e.clientX); };
    const handleTouchMove = (e: React.TouchEvent) => { handleMove(e.touches[0].clientX); };

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 1500);
    };

    return (
        <section id="repair" className="py-24 relative bg-slate-50 dark:bg-slate-900">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(13,148,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,148,136,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Wand2 className="w-8 h-8 text-brand-primary" />
                            <span className="text-brand-primary font-mono tracking-widest text-sm uppercase">{settings.subtitle}</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">
                            {settings.title}
                        </h2>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES_KEYS.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${filter === cat.id
                                    ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                {cat.icon}
                                <span>{t(cat.labelKey, cat.labelFallback)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">

                    {/* LEFT: THE DIAGNOSTIC VIEWER (Interactive Slider) */}
                    <div className="w-full lg:w-2/3 flex flex-col">
                        <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl group min-h-[400px] lg:min-h-[500px]">
                            {/* Before/After Container */}
                            <div
                                ref={containerRef}
                                className="absolute inset-0 w-full h-full cursor-ew-resize select-none overflow-hidden"
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseMove={handleMouseMove}
                                onTouchMove={handleTouchMove}
                                onMouseLeave={handleMouseUp}
                            >
                                {/* AFTER Image (Right) */}
                                <div className="absolute inset-0">
                                    <img
                                        src={getImageUrl(getCleanArchiveImage(activeProject.imgAfter, activeProject.category, true))}
                                        alt="After"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-sm flex items-center gap-2 shadow-lg z-40">
                                        <CheckCircle className="w-4 h-4" />
                                        {activeProject.labelAfter}
                                    </div>
                                </div>

                                {/* BEFORE Image (Left) - Clipped */}
                                <div
                                    className="absolute inset-0 overflow-hidden z-20"
                                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                                >
                                    <img
                                        src={getImageUrl(getCleanArchiveImage(activeProject.imgBefore, activeProject.category, false))}
                                        alt="Before"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg z-40">
                                        {activeProject.labelBefore}
                                    </div>
                                </div>

                                {/* Slider Line */}
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] z-30 pointer-events-none"
                                    style={{ left: `${sliderPosition}%` }}
                                >
                                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center">
                                        <MoveHorizontal className="w-6 h-6 text-slate-900" />
                                    </div>
                                </div>

                                {/* Scan Animation Overlay */}
                                {isScanning && (
                                    <div className="absolute inset-0 pointer-events-none z-50">
                                        <div className="absolute inset-0 bg-brand-primary/20 animate-pulse"></div>
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-scan"></div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Info Bar - ensure it stays above the absolute container */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-6 space-y-3 z-40 pointer-events-none">
                                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                                    <span className="text-white text-xs font-bold ml-1 tracking-wide">{t('repairGallery.verifiedRepair', 'VERIFIZIERTE REPARATUR')}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    {activeProject.title}
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${activeProject.difficulty === 'Expert' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                        activeProject.difficulty === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                                            activeProject.difficulty === 'Med' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                        }`}>
                                        LVL: {activeProject.difficulty}
                                    </span>
                                </h3>
                                <p className="text-slate-400 text-sm font-mono max-w-2xl">{stripHtml(activeProject.description || activeProject.desc || '')}</p>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold mt-2">
                                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                        <Activity className="w-3 h-3" />
                                        SAVED UP TO 65% VS NEW
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                                        <Clock className="w-3 h-3" />
                                        {activeProject.time || '1-2 Hours'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <button
                                onClick={handleScan}
                                className="w-full py-4 bg-slate-900 border-2 border-slate-800 hover:border-brand-primary/50 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                            >
                                <ScanLine className="w-5 h-5 group-hover:text-brand-primary" />
                                <span>{t('repairGallery.diagnosticScan', 'DIAGNOSESCAN')}</span>
                            </button>
                            
                            <button
                                onClick={() => navigate('/repair')}
                                className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-cyan-400 hover:to-blue-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] font-black rounded-xl transition-all flex items-center justify-center gap-2 group"
                            >
                                <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>{t('repairGallery.bookRepair', 'ÄHNLICHE REPARATUR BUCHEN')}</span>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Case Files Grid */}
                    <div className="w-full lg:w-1/3 flex flex-col">
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-brand-primary" />
                                    <h3 className="text-white font-bold uppercase tracking-wider text-sm">{t('repairGallery.caseFiles', 'Fallakten')} ({filteredProjects.length})</h3>
                                </div>
                            </div>

                            {/* Scrollable Grid */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[500px] custom-scrollbar">
                                {filteredProjects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => setSelectedId(project.id)}
                                        className="w-full text-left group"
                                    >
                                        <div className={`relative rounded-xl overflow-hidden border-2 transition-all ${selectedId === project.id
                                            ? 'border-brand-primary shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}>
                                            {/* Thumbnail */}
                                            <div className="relative h-32 bg-slate-900">
                                                <img
                                                    src={getImageUrl(getCleanArchiveImage(project.imgAfter, project.category, true))}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />

                                                {/* Icons overlay */}
                                                <div className="absolute top-2 right-2">
                                                    {project.category === 'water' && <Droplets className="w-3 h-3 text-blue-400" />}
                                                    {project.category === 'screen' && <Monitor className="w-3 h-3 text-purple-400" />}
                                                    {project.category === 'glass' && <Hammer className="w-3 h-3 text-red-400" />}
                                                </div>

                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <div className="text-xs font-bold text-white truncate">{project.title}</div>
                                                    <div className="text-[10px] text-slate-400 truncate">{stripHtml(project.description || project.desc || '')}</div>
                                                </div>

                                                {/* Active Indicator */}
                                                {selectedId === project._id && (
                                                    <div className="absolute inset-0 border-2 border-brand-primary rounded-xl animate-pulse"></div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Upload/CTA Area */}
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <button
                                    onClick={() => setShowAllModal(true)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-brand-primary/30 text-brand-primary text-sm font-bold hover:bg-cyan-900/70 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Smartphone className="w-4 h-4 group-hover:animate-bounce" />
                                    {settings.buttonText} {comparisons.length}
                                </button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* View All Modal */}
            {showAllModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="relative w-full max-w-6xl bg-slate-900 rounded-3xl border-4 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-900/50 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{t('repairGallery.allRepairCases', 'Alle Reparaturfälle')}</h3>
                                <p className="text-slate-500 text-sm mt-1">{comparisons.length} {t('repairGallery.totalCases', 'Fälle gesamt')}</p>
                            </div>
                            <button
                                onClick={() => setShowAllModal(false)}
                                aria-label="Close modal"
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                                {comparisons.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedId(item.id);
                                            setShowAllModal(false);
                                            // Optional: scroll into view
                                            document.getElementById('repair')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="w-full text-left group flex flex-col"
                                    >
                                        <div className={`relative w-full aspect-[4/5] rounded-xl overflow-hidden border-2 mb-2 transition-all ${selectedId === item.id ? 'border-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'border-slate-800 group-hover:border-slate-600'}`}>
                                            <img src={getImageUrl(getCleanArchiveImage(item.imgAfter, item.category, true))} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm p-1 rounded-md">
                                                {item.category === 'water' && <Droplets className="w-3 h-3 text-blue-400" />}
                                                {item.category === 'screen' && <Monitor className="w-3 h-3 text-purple-400" />}
                                                {item.category === 'glass' && <Hammer className="w-3 h-3 text-red-400" />}
                                            </div>
                                            {selectedId === item.id && (
                                                <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center pointer-events-none">
                                                    <div className="bg-brand-primary text-slate-900 rounded-full p-1 shadow-lg">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] sm:text-xs font-bold text-white line-clamp-2 leading-tight">{item.title}</div>
                                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{item.difficulty}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </section >
    );
};