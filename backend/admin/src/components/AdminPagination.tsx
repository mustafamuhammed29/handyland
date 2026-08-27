import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

type PageItem = number | 'ellipsis_left' | 'ellipsis_right';

const toPositiveFiniteInteger = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;

  const integer = Math.floor(numeric);
  if (integer < 1) return fallback;

  return integer;
};

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = '',
}) => {
  // Normalize page and total pages defensively
  const safeTotal = toPositiveFiniteInteger(totalPages, 1);
  const requestedCurrent = toPositiveFiniteInteger(currentPage, 1);
  const safeCurrent = Math.min(requestedCurrent, safeTotal);

  // If there's 1 or fewer pages, render nothing
  if (safeTotal <= 1) {
    return null;
  }

  // Generate compact page window (maximum 7 numbered buttons + ellipses)
  const getPageItems = (): PageItem[] => {
    if (safeTotal <= 7) {
      return Array.from({ length: safeTotal }, (_, i) => i + 1);
    }

    // Near start: 1, 2, 3, 4, 5, ..., total
    if (safeCurrent <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis_right', safeTotal];
    }

    // Near end: 1, ..., total - 4, total - 3, total - 2, total - 1, total
    if (safeCurrent >= safeTotal - 3) {
      return [1, 'ellipsis_left', safeTotal - 4, safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal];
    }

    // In middle: 1, ..., current - 1, current, current + 1, ..., total
    return [1, 'ellipsis_left', safeCurrent - 1, safeCurrent, safeCurrent + 1, 'ellipsis_right', safeTotal];
  };

  const pageItems = getPageItems();

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 ${className}`}
    >
      <div className="text-sm text-slate-400 font-medium">
        Showing page <span className="text-white font-bold">{safeCurrent}</span> of{' '}
        <span className="text-white font-bold">{safeTotal}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
          disabled={disabled || safeCurrent <= 1}
          title="Previous Page"
          aria-label="Previous Page"
          className="min-w-[36px] h-9 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page Buttons & Ellipses */}
        {pageItems.map((item, index) => {
          if (item === 'ellipsis_left' || item === 'ellipsis_right') {
            return (
              <span
                key={`ellipsis_${index}`}
                aria-hidden="true"
                className="w-7 h-9 flex items-center justify-center text-slate-500 font-bold select-none text-sm"
              >
                …
              </span>
            );
          }

          const isSelected = item === safeCurrent;

          return (
            <button
              key={`page_${item}`}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={disabled}
              aria-current={isSelected ? 'page' : undefined}
              aria-label={`Page ${item}`}
              className={`min-w-[36px] h-9 px-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {item}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotal, safeCurrent + 1))}
          disabled={disabled || safeCurrent >= safeTotal}
          title="Next Page"
          aria-label="Next Page"
          className="min-w-[36px] h-9 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

export default AdminPagination;
