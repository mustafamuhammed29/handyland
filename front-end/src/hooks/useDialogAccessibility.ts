import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Options for configuring accessible dialog behavior.
 */
export interface UseDialogAccessibilityOptions<
    TDialog extends HTMLElement = HTMLElement,
    TInitial extends HTMLElement = HTMLElement
> {
    /** Whether the dialog is currently open */
    isOpen: boolean;
    /** Callback invoked when dismissal is requested (e.g. Escape key) */
    onClose?: () => void;
    /** Ref pointing to the main dialog container element (must have tabIndex={-1}) */
    dialogRef: RefObject<TDialog | null>;
    /** Optional ref pointing to the element that should receive initial focus */
    initialFocusRef?: RefObject<TInitial | null>;
    /** Whether pressing Escape should call onClose (defaults to true) */
    closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'iframe',
    'object',
    'embed',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    'audio[controls]',
    'video[controls]',
    'summary',
    '[tabindex]',
].join(',');

const isElementVisible = (element: HTMLElement): boolean => {
    if (element.hasAttribute('hidden')) {
        return false;
    }

    if (element.getAttribute('aria-hidden') === 'true') {
        return false;
    }

    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
        const style = window.getComputedStyle(element);
        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.visibility === 'collapse'
        ) {
            return false;
        }
    }

    const rects = element.getClientRects();
    if (rects.length === 0) {
        return false;
    }

    return true;
};

const isElementFocusable = (element: HTMLElement): boolean => {
    if (!element.isConnected) {
        return false;
    }

    if (element.hasAttribute('disabled')) {
        return false;
    }

    if (
        'disabled' in element &&
        Boolean((element as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled)
    ) {
        return false;
    }

    if (element.getAttribute('aria-disabled') === 'true') {
        return false;
    }

    const tabIndexAttr = element.getAttribute('tabindex');
    if (tabIndexAttr === '-1') {
        return false;
    }

    if (element.tabIndex < 0) {
        return false;
    }

    return isElementVisible(element);
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    return candidates.filter(isElementFocusable);
};

/**
 * Hook to manage dialog accessibility:
 * - Automatically directs initial focus into the dialog (preferring initialFocusRef,
 *   then first focusable element, falling back to dialog container).
 * - Traps Tab and Shift+Tab navigation within the dialog container.
 * - Handles Escape key dismissal without closing for other keys.
 * - Fully safe with SSR (no DOM access on load) and React Strict Mode.
 *
 * NOTE: Opener focus restoration is intentionally NOT included in this commit
 * and will be introduced in a subsequent dedicated commit.
 */
export const useDialogAccessibility = <
    TDialog extends HTMLElement = HTMLElement,
    TInitial extends HTMLElement = HTMLElement
>({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef,
    closeOnEscape = true,
}: UseDialogAccessibilityOptions<TDialog, TInitial>): void => {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const closeOnEscapeRef = useRef(closeOnEscape);
    closeOnEscapeRef.current = closeOnEscape;

    useEffect(() => {
        if (typeof document === 'undefined' || !isOpen) {
            return;
        }

        let rafId: number | null = null;

        rafId = requestAnimationFrame(() => {
            const container = dialogRef.current;
            if (!container) {
                return;
            }

            const initialElement = initialFocusRef?.current;
            if (
                initialElement &&
                container.contains(initialElement) &&
                isElementFocusable(initialElement)
            ) {
                initialElement.focus();
                return;
            }

            const focusables = getFocusableElements(container);
            if (focusables.length > 0) {
                focusables[0].focus();
                return;
            }

            container.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (closeOnEscapeRef.current !== false && onCloseRef.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    onCloseRef.current();
                }
                return;
            }

            if (event.key === 'Tab') {
                const container = dialogRef.current;
                if (!container) {
                    return;
                }

                const focusables = getFocusableElements(container);

                if (focusables.length === 0) {
                    event.preventDefault();
                    container.focus();
                    return;
                }

                const firstElement = focusables[0];
                const lastElement = focusables[focusables.length - 1];
                const activeElement = document.activeElement as HTMLElement | null;

                if (!activeElement || !container.contains(activeElement)) {
                    event.preventDefault();
                    if (event.shiftKey) {
                        lastElement.focus();
                    } else {
                        firstElement.focus();
                    }
                    return;
                }

                if (event.shiftKey) {
                    if (activeElement === firstElement || activeElement === container) {
                        event.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (activeElement === lastElement || activeElement === container) {
                        event.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, dialogRef, initialFocusRef]);
};
