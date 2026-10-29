import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

type SheetProps = PropsWithChildren<{ open: boolean; onOpenChange: (open: boolean) => void }>;

export function Sheet({ open, onOpenChange, children }: SheetProps) {
    return <Transition show={open}>
        <Dialog as="div" open={open} onClose={() => onOpenChange(false)} className="fixed inset-0 z-[55] flex items-end justify-center">
            <TransitionChild enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="absolute inset-0 bg-nexo-ink/55 backdrop-blur-sm" />
            </TransitionChild>
            <TransitionChild enter="ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0" leave="ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full">
                <DialogPanel className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-700 bg-nexo-surface shadow-2xl sm:rounded-2xl">
                    <div className="flex h-9 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing" aria-label="Arrastra para expandir o cerrar">
                        <span className="h-1.5 w-12 rounded-full bg-slate-600" />
                    </div>
                    <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar notificaciones" className="absolute right-4 top-10 z-10 rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-nexo-lime">
                        <X size={19} />
                    </button>
                    {children}
                </DialogPanel>
            </TransitionChild>
        </Dialog>
    </Transition>;
}

export function SheetHeader({ children }: { children: ReactNode }) {
    return <div className="border-b border-slate-700/80 px-5 pb-5 pt-2">{children}</div>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
    return <h2 className="text-xl font-bold tracking-tight text-white">{children}</h2>;
}

export function SheetDescription({ children }: { children: ReactNode }) {
    return <p className="mt-1 text-sm text-slate-400">{children}</p>;
}

export function SheetBody({ children }: { children: ReactNode }) {
    return <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>;
}

export function SheetFooter({ children }: { children: ReactNode }) {
    return <div className="border-t border-slate-700/80 bg-slate-900/30 p-3">{children}</div>;
}
