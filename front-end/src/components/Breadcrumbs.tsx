import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    className?: string;
}

/**
 * Reusable Breadcrumbs component.
 * If `items` is not provided, auto-generates from the current URL.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
    const location = useLocation();

    // Auto-generate breadcrumbs from URL if not explicitly provided
    const crumbs: BreadcrumbItem[] = items || (() => {
        const parts = location.pathname.split('/').filter(Boolean);
        const generated: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];
        let current = '';
        parts.forEach((part, idx) => {
            current += `/${part}`;
            const isLast = idx === parts.length - 1;
            const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
            generated.push({ label, path: isLast ? undefined : current });
        });
        return generated;
    })();

    if (crumbs.length <= 1) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex items-center gap-1.5 text-sm text-slate-500 ${className}`}
        >
            {crumbs.map((crumb, idx) => {
                const isLast = idx === crumbs.length - 1;
                return (
                    <React.Fragment key={idx}>
                        {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />}
                        {crumb.path && !isLast ? (
                            <Link
                                to={crumb.path}
                                className="hover:text-white transition-colors flex items-center gap-1"
                            >
                                {idx === 0 && <Home className="w-3.5 h-3.5" />}
                                {crumb.label}
                            </Link>
                        ) : (
                            <span
                                className={`${isLast ? 'text-white font-medium' : ''} flex items-center gap-1`}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {idx === 0 && <Home className="w-3.5 h-3.5" />}
                                {crumb.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
