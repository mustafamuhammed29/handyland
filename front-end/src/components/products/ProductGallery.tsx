import React from 'react';
import { HelpCircle } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

interface ProductGalleryProps {
    product: any;
    activeImage: string;
    setActiveImage: (img: string) => void;
    setIsLightboxOpen: (open: boolean) => void;
    setIsConditionGuideOpen: (open: boolean) => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
    product,
    activeImage,
    setActiveImage,
    setIsLightboxOpen,
    setIsConditionGuideOpen
}) => {
    return (
        <div className="space-y-4">
            <div
                className="aspect-square bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden relative group cursor-zoom-in w-full text-left focus:outline-none focus:ring-2 focus:ring-brand-primary block shadow-sm"
                onClick={() => setIsLightboxOpen(true)}
                aria-label={`Enlarge image of ${product.model}`}
            >
                <img
                    src={getImageUrl(activeImage)}
                    alt={product.model}
                    className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConditionGuideOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm active:scale-95 ${product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' : product.condition === 'fair' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.condition === 'new' ? 'bg-emerald-500' : product.condition === 'fair' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        {product.condition}
                        <HelpCircle className="w-3.5 h-3.5 opacity-70 ml-0.5" />
                    </button>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {product.images?.map((img: string, idx: number) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        aria-label={`View image ${idx + 1}`}
                        className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${activeImage === img ? 'border-brand-primary opacity-100' : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'}`}
                    >
                        <img src={getImageUrl(img)} alt={`View ${idx}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
};
