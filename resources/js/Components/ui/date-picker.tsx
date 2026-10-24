import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type DatePickerProps = Omit<ComponentProps<'input'>, 'type'>;

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const months = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(new Date(2020, month, 1)).replace('.', ''));

function parseDate(value: unknown) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: unknown) {
    if (typeof value !== 'string' || !value) return 'Selecciona una fecha';
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(parseDate(value));
}

export function DatePicker({ className, value, onChange, name, required, disabled, id, ...props }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [monthYearOpen, setMonthYearOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => parseDate(value));
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const currentValue = typeof value === 'string' ? value : '';

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const width = 320;
        const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
        const opensUp = rect.bottom + 360 > window.innerHeight;
        setPosition({ left, top: opensUp ? Math.max(16, rect.top - 368) : rect.bottom + 8 });
    };

    useEffect(() => {
        if (!open) return;
        updatePosition();
        const handleOutside = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false); };
        const handleViewportChange = () => updatePosition();
        document.addEventListener('mousedown', handleOutside);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [open]);

    useEffect(() => { setViewDate(parseDate(value)); }, [value]);

    const monthName = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(viewDate);
    const firstDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);

    const chooseDate = (day: number) => {
        const nextValue = toIsoDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
        onChange?.({ target: { value: nextValue } } as ChangeEvent<HTMLInputElement>);
        setOpen(false);
    };

    const years = Array.from({ length: 12 }, (_, index) => viewDate.getFullYear() - 6 + index);
    const selectMonth = (month: number) => {
        setViewDate(new Date(viewDate.getFullYear(), month, 1));
        setMonthYearOpen(false);
    };

    return <div ref={containerRef} className="relative">
        <input type="hidden" name={name} value={currentValue} {...props} />
        <button ref={triggerRef} id={id} type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open} aria-required={required} className={cn('flex h-11 w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-100 shadow-sm outline-none transition hover:border-slate-600 focus:border-nexo-lime focus:ring-2 focus:ring-nexo-lime/20 disabled:cursor-not-allowed disabled:opacity-50', !currentValue && 'text-slate-500', className)}>
            <span>{formatDate(currentValue)}</span><CalendarDays size={17} className="shrink-0 text-slate-500" />
        </button>
        {open && <div role="dialog" aria-label="Selector de fecha" className="fixed z-[100] w-80 rounded-2xl border border-slate-700 bg-nexo-surface p-4 shadow-2xl shadow-black/50" style={{ top: position.top, left: position.left }}>
            <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label="Mes anterior"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => setMonthYearOpen((current) => !current)} className="rounded-lg px-3 py-2 text-sm font-bold capitalize text-white transition hover:bg-slate-800" aria-expanded={monthYearOpen}>{monthName}</button>
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label="Mes siguiente"><ChevronRight size={18} /></button>
            </div>
            {monthYearOpen ? <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Año</span><div className="flex items-center gap-2"><button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Años anteriores"><ChevronLeft size={15} /></button><span className="min-w-20 text-center text-sm font-bold text-white">{years[0]}–{years[years.length - 1]}</span><button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Años siguientes"><ChevronRight size={15} /></button></div></div>
                <div className="grid grid-cols-3 gap-2">{years.map((year) => <button type="button" key={year} onClick={() => setViewDate(new Date(year, viewDate.getMonth(), 1))} className={cn('rounded-lg px-2 py-2 text-sm text-slate-400 transition hover:bg-nexo-lime/15 hover:text-nexo-lime', year === viewDate.getFullYear() && 'bg-nexo-lime font-bold text-nexo-ink hover:bg-nexo-lime hover:text-nexo-ink')}>{year}</button>)}</div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">{months.map((month, index) => <button type="button" key={month} onClick={() => selectMonth(index)} className={cn('rounded-lg px-2 py-2 text-sm capitalize text-slate-400 transition hover:bg-nexo-lime/15 hover:text-nexo-lime', index === viewDate.getMonth() && 'bg-nexo-lime font-bold text-nexo-ink hover:bg-nexo-lime hover:text-nexo-ink')}>{month}</button>)}</div>
            </div> : <><div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">{weekDays.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
                <div className="mt-1 grid grid-cols-7 gap-1" role="grid">{calendarDays.map((day, index) => day === null ? <span key={`empty-${index}`} className="h-9" /> : <button type="button" key={day} onClick={() => chooseDate(day)} className={cn('h-9 rounded-lg text-sm text-slate-300 transition hover:bg-nexo-lime/20 hover:text-nexo-lime', currentValue === toIsoDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) && 'bg-nexo-lime font-bold text-nexo-ink hover:bg-nexo-lime hover:text-nexo-ink')}>{day}</button>)}</div></>}
            <button type="button" onClick={() => { const today = new Date(); setViewDate(today); onChange?.({ target: { value: toIsoDate(today) } } as ChangeEvent<HTMLInputElement>); setOpen(false); }} className="mt-3 w-full rounded-lg border border-slate-700 py-2 text-xs font-semibold text-slate-300 transition hover:border-nexo-lime hover:text-nexo-lime">Ir a hoy</button>
        </div>}
    </div>;
}
