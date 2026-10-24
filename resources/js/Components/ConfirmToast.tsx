import { AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type ConfirmToastOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
};

export function confirmToast({
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
}: ConfirmToastOptions) {
    toast.custom((toastItem) => (
        <div
            className={`pointer-events-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-slate-700 bg-nexo-surface p-4 text-slate-100 shadow-2xl shadow-black/40 transition-all ${
                toastItem.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`confirm-title-${toastItem.id}`}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                    <AlertTriangle size={19} />
                </div>
                <div className="min-w-0 flex-1">
                    <p id={`confirm-title-${toastItem.id}`} className="font-bold text-white">
                        {title}
                    </p>
                    {description && <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>}
                </div>
                <button
                    type="button"
                    onClick={() => toast.dismiss(toastItem.id)}
                    className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                    aria-label="Cerrar confirmación"
                >
                    <X size={17} />
                </button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => toast.dismiss(toastItem.id)}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        toast.dismiss(toastItem.id);
                        onConfirm();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-400/15 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/25"
                >
                    <Check size={15} />
                    {confirmLabel}
                </button>
            </div>
        </div>
    ));
}
