import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = { id: number | string; label: string };

export function SearchableSelect({ value, options, onValueChange, placeholder = 'Selecciona una opción', searchPlaceholder = 'Buscar...', disabled = false, className }: { value: string; options: Option[]; onValueChange: (value: string) => void; placeholder?: string; searchPlaceholder?: string; disabled?: boolean; className?: string }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [positionReady, setPositionReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const selected = options.find((option) => String(option.id) === value);
    const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        const close = (event: MouseEvent) => { const target = event.target as Node; if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const width = rect.width;
            const menuHeight = menuRef.current?.offsetHeight ?? 320;
            const opensUp = rect.bottom + menuHeight > window.innerHeight;
            setPosition({
                top: opensUp ? Math.max(12, rect.top - menuHeight - 8) : Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - menuHeight - 12)),
                left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
                width,
            });
        };
        setPositionReady(false);
        updatePosition();
        requestAnimationFrame(() => { updatePosition(); setPositionReady(true); });
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, query]);

    const choose = (option: Option) => { onValueChange(String(option.id)); setQuery(''); setOpen(false); };

    return <div ref={containerRef} className={cn('relative', className)}>
        <button ref={triggerRef} type="button" disabled={disabled} onClick={() => { setPositionReady(false); setOpen(!open); }} className="box-border flex !h-11 !min-h-11 !max-h-11 w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-100 shadow-sm outline-none transition hover:border-slate-600 focus:border-nexo-lime focus:ring-2 focus:ring-nexo-lime/20 disabled:cursor-not-allowed disabled:opacity-50" aria-haspopup="listbox" aria-expanded={open}><span className={selected ? 'truncate' : 'truncate text-slate-500'}>{selected?.label ?? placeholder}</span><ChevronsUpDown size={16} className="ml-2 shrink-0 text-slate-500" /></button>
        {open && <div ref={menuRef} className={`fixed z-[200] overflow-hidden rounded-xl border border-slate-700 bg-nexo-surface p-2 shadow-2xl shadow-black/60 ${positionReady ? '' : 'invisible'}`} style={{ top: position.top, left: position.left, width: position.width }}><div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-nexo-lime" /></div><div className="mt-2 max-h-52 overflow-y-auto" role="listbox">{filtered.length > 0 ? filtered.map((option) => <button type="button" key={option.id} onClick={() => choose(option)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"><span className="truncate">{option.label}</span>{String(option.id) === value && <Check size={16} className="shrink-0 text-nexo-lime" />}</button>) : <p className="px-3 py-4 text-center text-xs text-slate-500">No se encontraron resultados.</p>}</div></div>}
    </div>;
}
