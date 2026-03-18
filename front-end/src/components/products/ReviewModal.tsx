import React from 'react';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
    showReviewModal: boolean;
    setShowReviewModal: (show: boolean) => void;
    newReview: { rating: number; comment: string };
    setNewReview: React.Dispatch<React.SetStateAction<{ rating: number; comment: string }>>;
    handleSubmitReview: (e: React.FormEvent) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    showReviewModal,
    setShowReviewModal,
    newReview,
    setNewReview,
    handleSubmitReview
}) => {
    if (!showReviewModal) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Write a Review</h3>
                    <button onClick={() => setShowReviewModal(false)} aria-label="Close review modal" title="Close review modal" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Your Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                    aria-label={`Rate ${star} stars`}
                                    title={`Rate ${star} stars`}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star className={`w-8 h-8 ${star <= newReview.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300 dark:text-slate-700'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Your Review</label>
                        <textarea
                            required
                            rows={4}
                            value={newReview.comment}
                            onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary outline-none transition-colors"
                            placeholder="What do you think about this product?"
                        />
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowReviewModal(false)}
                            className="flex-1 py-3 px-4 font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newReview.comment.trim()}
                            className="flex-1 py-3 px-4 font-bold rounded-xl bg-brand-primary hover:bg-brand-primary text-white transition-colors disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
