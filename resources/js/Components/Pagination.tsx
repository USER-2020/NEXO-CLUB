import { router } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = { current_page: number; last_page: number; from?: number | null; to?: number | null; total?: number; per_page?: number };

export default function Pagination({ current_page, last_page, from, to, total, per_page = 10 }: Props) {
    if (last_page <= 1) return null;
    const pages = Array.from({ length: last_page }, (_, index) => index + 1).filter((page) => page === 1 || page === last_page || Math.abs(page - current_page) <= 1);
    const navigate = (page: number, nextPerPage = per_page) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', String(page));
        params.set('per_page', String(nextPerPage));
        router.get(window.location.pathname, Object.fromEntries(params.entries()), { preserveScroll: true, preserveState: true });
    };

    return <div className="flex flex-col gap-4 border-t border-slate-800 p-4 text-sm sm:p-5"><div className="flex flex-col items-center justify-between gap-3 sm:flex-row"><div className="text-center sm:text-left"><p className="font-medium text-slate-300">{from ?? 0}–{to ?? 0} <span className="font-normal text-slate-500">de {total ?? 0} registros</span></p><p className="mt-0.5 text-xs text-slate-600">Página {current_page} de {last_page}</p></div><label className="group relative flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-nexo-ink/40 px-3 text-slate-400 transition focus-within:border-nexo-lime"><span className="text-xs font-semibold uppercase tracking-wide">Filas</span><select value={per_page} onChange={(event) => navigate(1, Number(event.target.value))} className="min-h-9 appearance-none bg-transparent pr-6 text-sm font-semibold text-slate-200 outline-none" aria-label="Filas por página"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-slate-500" /></label></div><nav className="flex items-center justify-center gap-1.5" aria-label="Paginación"><button type="button" disabled={current_page <= 1} onClick={() => navigate(current_page - 1)} className="min-h-10 min-w-10 rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={16} /></button>{pages.map((page, index) => <span key={page}>{index > 0 && pages[index - 1] !== page - 1 && <span className="px-1 text-slate-600">…</span>}<button type="button" aria-current={page === current_page ? 'page' : undefined} onClick={() => navigate(page)} className={`min-h-10 min-w-10 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${page === current_page ? 'bg-nexo-lime text-nexo-ink shadow-lime' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{page}</button></span>)}<button type="button" disabled={current_page >= last_page} onClick={() => navigate(current_page + 1)} className="min-h-10 min-w-10 rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página siguiente"><ChevronRight size={16} /></button></nav></div>;
}
