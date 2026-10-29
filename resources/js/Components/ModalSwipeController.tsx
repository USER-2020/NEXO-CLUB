import { useEffect } from 'react';

/**
 * Gives custom mobile dialogs the same downward-dismiss gesture as native
 * iOS bottom sheets. It is mounted once and covers page-local modals too.
 */
export default function ModalSwipeController() {
    useEffect(() => {
        let active: { dialog: HTMLElement; panel: HTMLElement; startY: number; currentY: number } | null = null;
        const closing = new WeakSet<HTMLElement>();

        const setCollapsed = (dialog: HTMLElement) => {
            if (window.innerWidth < 640 && !dialog.dataset.sheetState) dialog.dataset.sheetState = 'collapsed';
        };

        const expand = (dialog: HTMLElement, panel: HTMLElement) => {
            dialog.dataset.sheetState = 'expanded';
            panel.style.transition = 'height 220ms ease-out, max-height 220ms ease-out, transform 180ms ease-out';
            panel.style.height = '100dvh';
            panel.style.maxHeight = '100dvh';
            panel.querySelectorAll<HTMLElement>('.overflow-y-auto').forEach((element) => {
                element.style.maxHeight = 'calc(100dvh - 180px)';
            });
            panel.style.transform = 'translateY(0)';
        };

        const panelFor = (dialog: HTMLElement) => dialog.querySelector<HTMLElement>('.bg-nexo-surface');

        const reset = (panel: HTMLElement) => {
            panel.style.transition = 'transform 180ms ease-out';
            panel.style.transform = 'translateY(0)';
            window.setTimeout(() => {
                panel.style.transition = '';
                panel.style.transform = '';
            }, 190);
        };

        const close = (dialog: HTMLElement, panel: HTMLElement) => {
            if (closing.has(dialog)) return;
            closing.add(dialog);
            panel.style.transition = 'transform 180ms ease-in';
            panel.style.transform = 'translateY(100%)';
            window.setTimeout(() => {
                const closeButton = dialog.querySelector<HTMLButtonElement>('button[aria-label^="Cerrar"]');
                closeButton?.click();
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                panel.style.transition = '';
                panel.style.transform = '';
            }, 180);
        };

        const onPointerDown = (event: PointerEvent) => {
            // Chrome responsive mode reports mouse events even when simulating
            // a phone. Keep the gesture available for touch, pen and mouse.
            if (window.innerWidth >= 640) return;

            const target = event.target instanceof Element ? event.target : null;
            const dialog = target?.closest<HTMLElement>('[role="dialog"]');
            const panel = dialog ? panelFor(dialog) : null;
            if (!dialog || !panel) return;
            setCollapsed(dialog);

            const panelRect = panel.getBoundingClientRect();
            const isHandle = Boolean(target?.closest('.cursor-grab'));
            const isHeader = event.clientY >= panelRect.top && event.clientY <= panelRect.top + 112;
            const isInteractive = Boolean(target?.closest('button, input, textarea, select, a'));
            const scrollable = target?.closest<HTMLElement>('.overflow-y-auto');
            if ((!isHandle && !isHeader && !target?.closest('.bg-nexo-surface')) || (isInteractive && !isHandle) || (scrollable && scrollable.scrollTop > 0)) return;

            active = { dialog, panel, startY: event.clientY, currentY: 0 };
            panel.style.transition = 'none';
            if (target instanceof HTMLElement && target.hasPointerCapture?.(event.pointerId) === false) {
                target.setPointerCapture?.(event.pointerId);
            }
            if (event.cancelable) event.preventDefault();
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!active) return;
            const deltaY = event.clientY - active.startY;
            if (deltaY < 0) {
                if (Math.abs(deltaY) >= 64) {
                    expand(active.dialog, active.panel);
                    active = null;
                    if (event.cancelable) event.preventDefault();
                    return;
                }
                active.panel.style.transition = '';
                return;
            }
            active.currentY = deltaY;
            active.panel.style.transform = 'translateY(' + active.currentY + 'px)';
            if (event.cancelable) event.preventDefault();
        };

        const onPointerUp = () => {
            if (!active) return;
            const { dialog, panel, currentY } = active;
            active = null;
            if (currentY >= 96) close(dialog, panel);
            else reset(panel);
        };

        const onClick = (event: MouseEvent) => {
            if (window.innerWidth >= 640) return;
            const target = event.target instanceof Element ? event.target : null;
            const dialog = target?.closest<HTMLElement>('[role="dialog"]');
            const panel = dialog ? panelFor(dialog) : null;
            if (!dialog || !panel) return;

            if (closing.has(dialog)) {
                closing.delete(dialog);
                return;
            }

            const isCloseButton = Boolean(target?.closest('button[aria-label^="Cerrar"]'));
            const isBackdrop = !panel.contains(target);
            if (!isCloseButton && !isBackdrop) return;

            event.preventDefault();
            event.stopPropagation();
            close(dialog, panel);
        };

        const observer = new MutationObserver(() => {
            if (window.innerWidth >= 640) return;
            document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach(setCollapsed);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach(setCollapsed);

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
        document.addEventListener('pointerup', onPointerUp, true);
        document.addEventListener('pointercancel', onPointerUp, true);
        document.addEventListener('click', onClick, true);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('pointermove', onPointerMove, true);
            document.removeEventListener('pointerup', onPointerUp, true);
            document.removeEventListener('pointercancel', onPointerUp, true);
            document.removeEventListener('click', onClick, true);
            observer.disconnect();
        };
    }, []);

    return null;
}
