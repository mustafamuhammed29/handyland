import { useState, useEffect } from 'react';
import { Star, Trash2, Search, CheckCircle, AlertCircle, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../utils/api';

interface Review {
    _id: string;
    rating: number;
    comment: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
    user: { _id: string; name: string; email: string };
    product: { _id: string; name?: string; model?: string; image?: string; images?: string[] };
}

const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star
                key={s}
                size={14}
                className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
            />
        ))}
    </div>
);

export default function ReviewsManager() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | ''>('');
    const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/reviews/admin');
            const data = (response as any)?.data || response;
            if (data.success) setReviews(data.reviews);
        } catch (e) {
            showToast('error', 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this review? This will update the product rating.')) return;
        try {
            await api.delete(`/api/reviews/${id}`);
            setReviews(prev => prev.filter(r => r._id !== id));
            showToast('success', 'Review deleted and product rating updated');
        } catch {
            showToast('error', 'Failed to delete review');
        }
    };

    const filtered = reviews.filter(r => {
        const matchSearch =
            r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.comment?.toLowerCase().includes(search.toLowerCase()) ||
            (r.product?.name || r.product?.model || '').toLowerCase().includes(search.toLowerCase());
        const matchRating = ratingFilter === '' || r.rating === ratingFilter;
        const matchVerified =
            verifiedFilter === 'all' ||
            (verifiedFilter === 'verified' && r.isVerifiedPurchase) ||
            (verifiedFilter === 'unverified' && !r.isVerifiedPurchase);
        return matchSearch && matchRating && matchVerified;
    });

    // Stats
    const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '–';
    const verifiedCount = reviews.filter(r => r.isVerifiedPurchase).length;
    const dist = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0
    }));

    return (
        <div className="p-6 space-y-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-4 ${toast.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-900/90 border-red-500/50 text-red-300'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Star className="text-amber-400 fill-amber-400" size={28} />
                        Reviews Manager
                    </h1>
                    <p className="text-slate-400 mt-1">Moderate customer product reviews</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black text-amber-400">{avgRating}</div>
                    <div className="text-xs text-slate-500 mt-1">{reviews.length} total reviews</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {dist.map(({ star, count, pct }) => (
                    <div key={star} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <StarDisplay rating={star} />
                            <span className="text-xs text-slate-500 font-mono">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
                            <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-lg font-bold text-white">{count}</div>
                    </div>
                ))}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                    <ShieldCheck className="text-emerald-400 mb-2" size={20} />
                    <div className="text-2xl font-black text-white">{verifiedCount}</div>
                    <div className="text-xs text-slate-500">Verified purchases</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by user, product or comment..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>
                <select
                    value={ratingFilter}
                    onChange={e => setRatingFilter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                    title="Filter by rating"
                >
                    <option value="">All Ratings</option>
                    {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} Stars</option>)}
                </select>
                <select
                    value={verifiedFilter}
                    onChange={e => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                    title="Filter by purchase verification"
                >
                    <option value="all">All</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified</option>
                </select>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Filter size={14} />
                    <span>{filtered.length} of {reviews.length}</span>
                </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-sm">
                                <th className="px-6 py-4 text-left">User</th>
                                <th className="px-6 py-4 text-left">Product</th>
                                <th className="px-6 py-4 text-left">Rating</th>
                                <th className="px-6 py-4 text-left">Comment</th>
                                <th className="px-6 py-4 text-left">Verified</th>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                                    <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                                    Loading reviews...
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                                    <Star size={32} className="mx-auto mb-2 text-slate-700" />
                                    No reviews found
                                </td></tr>
                            ) : (
                                filtered.map(review => (
                                    <tr key={review._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{review.user?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{review.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {(review.product?.image || review.product?.images?.[0]) && (
                                                    <img
                                                        src={review.product.image || review.product.images?.[0]}
                                                        alt=""
                                                        className="w-8 h-8 rounded object-cover bg-slate-800"
                                                    />
                                                )}
                                                <span className="text-slate-300 text-sm">
                                                    {review.product?.name || review.product?.model || 'Unknown Product'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <StarDisplay rating={review.rating} />
                                                <span className="text-xs text-slate-400 font-bold">{review.rating}/5</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-slate-300 text-sm line-clamp-2">{review.comment}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {review.isVerifiedPurchase ? (
                                                <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                                    <ShieldCheck size={13} /> Verified
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs">Unverified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(review._id)}
                                                className="p-2 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                                                title="Delete review"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
