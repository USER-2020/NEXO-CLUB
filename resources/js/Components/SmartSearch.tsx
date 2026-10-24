import { router, usePage } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export default function SmartSearch() {
    const page = usePage();
    const searchable = ['/deportistas', '/inscripciones', '/mensualidades', '/disciplinas', '/club-miembros', '/clubs', '/platform/clubs', '/platform/logs'].includes(window.location.pathname);
    const initial = new URLSearchParams(window.location.search).get('q') ?? '';
    const [value, setValue] = useState(initial);
    const [target, setTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const main = document.querySelector('main');
        if (!main) return;
        const element = document.createElement('div');
        element.dataset.moduleSearch = 'true';
        main.prepend(element);
        setTarget(element);
        return () => element.remove();
    }, []);
    useEffect(() => { setValue(new URLSearchParams(window.location.search).get('q') ?? ''); }, [page.url]);
    useEffect(() => {
        if (!searchable) return;
        const timer = window.setTimeout(() => {
            const current = new URLSearchParams(window.location.search).get('q') ?? '';
            if (value.trim() === current) return;
            router.get(window.location.pathname, value.trim() ? { q: value.trim() } : {}, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => window.clearTimeout(timer);
    }, [value, searchable]);

    if (!searchable || !target) return null;
    return createPortal(<div className="mb-6 flex w-full justify-end"><div className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-slate-700 bg-nexo-surface px-3 py-2 shadow-lg"><Search size={17} className="shrink-0 text-slate-500" /><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Buscar en esta lista..." aria-label="Buscar en esta lista" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 focus:ring-0" />{value && <button type="button" onClick={() => setValue('')} className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Limpiar búsqueda"><X size={15} /></button>}</div></div>, target);
}
