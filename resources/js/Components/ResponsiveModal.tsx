import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { PointerEvent, PropsWithChildren, useRef, useState } from 'react';

type ResponsiveModalProps = PropsWithChildren<{
    show: boolean;
    onClose: () => void;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    panelClassName?: string;
    labelledBy?: string;
}>;

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl', '2xl': 'sm:max-w-2xl' };

export default function ResponsiveModal({ show, onClose, maxWidth = '2xl', closeable = true, panelClassName = '', labelledBy, children }: ResponsiveModalProps) {
    const startY = useRef<number | null>(null);
    const [dragY, setDragY] = useState(0);
    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        startY.current = event.clientY;
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (startY.current === null) return;
        setDragY(Math.max(0, event.clientY - startY.current));
    };
    const handlePointerUp = () => {
        if (dragY > 90 && closeable) onClose();
        startY.current = null;
        setDragY(0);
    };
    const close = () => { if (closeable) onClose(); };

    return <Transition show={show} leave="duration-200">
        <Dialog as="div" className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto px-0 transition-all sm:items-center sm:px-4 sm:py-6" onClose={close} aria-labelledby={labelledBy}>
            <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="absolute inset-0 bg-nexo-ink/80 backdrop-blur-sm" />
            </TransitionChild>
            <TransitionChild enter="ease-out duration-300" enterFrom="translate-y-full opacity-0 sm:translate-y-4 sm:scale-95" enterTo="translate-y-0 opacity-100 sm:scale-100" leave="ease-in duration-200" leaveFrom="translate-y-0 opacity-100 sm:scale-100" leaveTo="translate-y-full opacity-0 sm:translate-y-4 sm:scale-95">
                <DialogPanel className={`relative mb-0 max-h-[92dvh] w-full overflow-hidden rounded-t-[2rem] border border-slate-700 bg-nexo-surface shadow-2xl transition-transform sm:mx-auto sm:mb-0 sm:rounded-2xl ${widths[maxWidth]} ${panelClassName}`} style={{ transform: `translateY(${dragY}px)` }}>
                    <div className="flex h-8 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing sm:hidden" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} aria-label="Desliza hacia abajo para cerrar">
                        <span className="h-1.5 w-12 rounded-full bg-slate-600" />
                    </div>
                    {children}
                </DialogPanel>
            </TransitionChild>
        </Dialog>
    </Transition>;
}
