import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    setPage: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, itemsPerPage, setPage }: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md">
            <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-white">{totalItems}</span> results
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                    aria-label="Previous Page"
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-slate-300 px-4 py-1.5 bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                    aria-label="Next Page"
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
