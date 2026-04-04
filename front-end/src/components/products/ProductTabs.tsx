import React from 'react';
import { Star, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductTabsProps {
    activeTab: 'overview' | 'specs' | 'reviews' | 'questions';
    setActiveTab: (tab: 'overview' | 'specs' | 'reviews' | 'questions') => void;
    product: any;
    reviews: any[];
    setShowReviewModal: (show: boolean) => void;
}

export const ProductTabs: React.FC<ProductTabsProps> = ({
    activeTab,
    setActiveTab,
    product,
    reviews,
    setShowReviewModal
}) => {
    const { t } = useTranslation();

    const tabLabels: Record<string, string> = {
        overview: t('product.tabs.overview', 'Übersicht'),
        specs: t('product.tabs.specs', 'Technische Daten'),
        reviews: t('product.tabs.reviews', 'Bewertungen'),
    };

    return (
        <div className="mb-16">
            <div className="flex overflow-x-auto gap-8 border-b border-slate-200 dark:border-slate-800 mb-8 pb-px" role="tablist">
                {['overview', 'specs', 'reviews'].map((tab) => (
                    <button
                        key={tab}
                        role="tab"
                        id={`tab-${tab}`}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === tab ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                    >
                        {tabLabels[tab] || tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                    </button>
                ))}
                <button
                    role="tab"
                    id="tab-questions"
                    onClick={() => setActiveTab('questions')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === 'questions' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    {t('product.tabs.qa', 'Fragen & Antworten')}
                    {activeTab === 'questions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                </button>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 min-h-[300px]">
                {activeTab === 'overview' && (
                    <div className="prose prose-invert max-w-none">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('product.productOverview', 'Produktübersicht')}</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                            {product.description || t('product.defaultDescription', 'Das ultimative Gerät für Power-User. Mit atemberaubendem Display, ganztägiger Akkulaufzeit und einem professionellen Kamerasystem. Jedes Gerät wird von unseren Technikern rigoros getestet und zertifiziert.')}
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Array.isArray(product.features) && product.features.some((f: string) => f.trim() !== '') 
                                ? product.features.filter((f: string) => f.trim() !== '') 
                                : [t('product.feature1', 'Professionelle Inspektion'), t('product.feature2', 'Neuer Akku eingebaut'), t('product.feature3', 'Originalzubehör'), t('product.feature4', 'Desinfiziert & gereinigt')]
                            ).map((feat: string, i: number) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center"><Check className="w-3 h-3" /></div>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">{t('product.specs.performance', 'Leistung')}</h3>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">{t('product.specs.processor', 'Prozessor')}</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.cpu}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">{t('product.specs.ram', 'RAM')}</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.ram}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">{t('product.specs.storage', 'Speicher')}</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.storage}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">{t('product.specs.displayBattery', 'Display & Akku')}</h3>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">{t('product.specs.screenSize', 'Bildschirmgröße')}</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.screen}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">{t('product.specs.batteryCapacity', 'Akkukapazität')}</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.battery}</span>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div>
                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map((review: any) => (
                                    <div key={review._id} className="border-b border-slate-200 dark:border-slate-800 pb-6 last:border-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-900 dark:text-white">{review.user?.name || t('product.anonymous', 'Anonym')}</div>
                                                <span className="text-xs text-slate-500">• {new Date(review.createdAt).toLocaleDateString('de-DE')}</span>
                                            </div>
                                            <div className="flex text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                    <Star className="w-8 h-8 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('product.noReviews', 'Noch keine Bewertungen')}</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">{t('product.beFirstReview', 'Sei der Erste, der seine Erfahrung mit diesem Produkt teilt!')}</p>
                            </div>
                        )}
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg transition-colors"
                            >
                                {t('product.writeReview', 'Bewertung schreiben')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
