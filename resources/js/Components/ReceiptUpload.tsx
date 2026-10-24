import { useRef } from 'react';
import { FileCheck2, FileUp, X } from 'lucide-react';

type ReceiptUploadProps = {
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string;
};

export default function ReceiptUpload({ value, onChange, error }: ReceiptUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const clearFile = () => {
        if (inputRef.current) inputRef.current.value = '';
        onChange(null);
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-300">Comprobante de pago</span>
                <span className="text-xs text-slate-500">JPG, PNG o PDF · máximo 5 MB</span>
            </div>
            <label className="group flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 p-4 transition hover:border-nexo-lime/70 hover:bg-nexo-lime/[0.03]">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="sr-only"
                    onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                />
                {value ? (
                    <div className="flex w-full items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                            <FileCheck2 size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-100">{value.name}</span>
                            <span className="mt-1 block text-xs text-emerald-300">Archivo listo · {(value.size / 1024 / 1024).toFixed(2)} MB</span>
                        </span>
                        <button
                            type="button"
                            aria-label="Quitar comprobante"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-300"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                clearFile();
                            }}
                        >
                            <X size={17} />
                        </button>
                    </div>
                ) : (
                    <span className="flex flex-col items-center gap-2 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nexo-lime/10 text-nexo-lime transition group-hover:scale-105">
                            <FileUp size={22} />
                        </span>
                        <span className="text-sm font-semibold text-slate-200">Selecciona tu comprobante</span>
                        <span className="text-xs text-slate-500">Haz clic aquí o arrastra el archivo</span>
                    </span>
                )}
            </label>
            {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
        </div>
    );
}
