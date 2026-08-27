import { useEffect, useRef } from 'react';

let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/**
 * Module-level helper to acquire a body scroll lock.
 * - Stores previous inline styles on the first acquisition.
 * - Compensates for scrollbar removal to prevent layout shifts.
 * - Increments module lockCount.
 */
const acquireBodyScrollLock = (): boolean => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return false;
    }

    if (lockCount === 0) {
        originalOverflow = document.body.style.overflow;
        originalPaddingRight = document.body.style.paddingRight;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            const currentComputedPadding = window.getComputedStyle(document.body).paddingRight;
            const parsedPadding = parseFloat(currentComputedPadding) || 0;
            document.body.style.paddingRight = `${parsedPadding + scrollbarWidth}px`;
        }

        document.body.style.overflow = 'hidden';
    }

    lockCount += 1;
    return true;
};

/**
 * Module-level helper to release a body scroll lock.
 * - Decrements module lockCount.
 * - Restores original inline styles when lockCount reaches 0.
 * - Defensively handles stray calls when lockCount is <= 0.
 */
const releaseBodyScrollLock = (): void => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return;
    }

    if (lockCount <= 0) {
        lockCount = 0;
        return;
    }

    lockCount -= 1;

    if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
    }
};

/**
 * Hook to safely lock body scroll for modals/overlays.
 * - `lockCount` (module counter) manages cross-overlay locks across simultaneous/nested modals.
 * - `hasLockRef` (per-instance ref) ensures strict 1-to-1 acquisition and release per hook instance,
 *   preventing duplicate releases or Strict Mode replay anomalies.
 * - React effect cleanup reliably handles both `isLocked: true -> false` transitions and component unmounts.
 */
export const useBodyScrollLock = (isLocked: boolean = true): void => {
    const hasLockRef = useRef(false);

    useEffect(() => {
        if (!isLocked || typeof document === 'undefined' || typeof window === 'undefined') {
            return;
        }

        if (!hasLockRef.current) {
            const acquired = acquireBodyScrollLock();
            if (acquired) {
                hasLockRef.current = true;
            }
        }

        return () => {
            if (hasLockRef.current) {
                hasLockRef.current = false;
                releaseBodyScrollLock();
            }
        };
    }, [isLocked]);
};
