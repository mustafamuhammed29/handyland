import React from 'react';
import { Star, Check } from 'lucide-react';

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
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                    </button>
                ))}
                <button
                    role="tab"
                    id="tab-questions"
                    onClick={() => setActiveTab('questions')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === 'questions' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    Q&A
                    {activeTab === 'questions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                </button>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 min-h-[300px]">
                {activeTab === 'overview' && (
                    <div className="prose prose-invert max-w-none">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Product Overview</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                            {product.description || "The ultimate device for power users. Featuring a stunning display, all-day battery life, and a pro-grade camera system. Each unit is rigorously tested and certified by our technicians to ensure 100% functionality."}
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['Professional Inspection', 'New Battery Installed', 'Original Accessories', 'Sanitized & Cleaned'].map((feat, i) => (
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
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Performance</h3>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">Processor</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.cpu}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">RAM</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.ram}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">Storage</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.storage}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Display & Battery</h3>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">Screen Size</span>
                                <span className="text-slate-900 dark:text-slate-200">{product.specs?.screen}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                <span className="text-slate-500">Battery Capacity</span>
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
                                                <div className="font-bold text-slate-900 dark:text-white">{review.user?.name || 'Anonymous'}</div>
                                                <span className="text-xs text-slate-500">• {new Date(review.createdAt).toLocaleDateString()}</span>
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
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Reviews Yet</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Be the first to share your experience with this product!</p>
                            </div>
                        )}
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg transition-colors"
                            >
                                Write a Review
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
