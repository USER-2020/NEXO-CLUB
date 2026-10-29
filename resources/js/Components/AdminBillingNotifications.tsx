import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, CheckCircle2, Clock3 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatAppDate } from '@/lib/dates';
import { Sheet, SheetBody, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/Components/ui/sheet';

type NotificationItem = { id: number; athlete: string; discipline: string; amount: number; due_date?: string | null; status: 'pending' | 'overdue' };
type NotificationProps = { auth?: { user?: { role?: string } | null }; adminBillingNotifications?: { count: number; total: number; items: NotificationItem[] } };
const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export default function AdminBillingNotifications() {
    const { auth, adminBillingNotifications } = usePage().props as NotificationProps;
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const notifications = adminBillingNotifications ?? { count: 0, total: 0, items: [] };

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    if (auth?.user?.role !== 'admin') return null;

    return <div ref={ref} className="fixed right-16 top-3 z-[60] sm:right-20 sm:top-4 lg:right-24" data-tour="admin-billing-notifications">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir centro de notificaciones" aria-expanded={open} className={open ? 'relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-nexo-lime transition focus:outline-none focus:ring-2 focus:ring-nexo-lime' : 'relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-nexo-lime'}>
            <Bell size={20} />
            {notifications.count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-nexo-ink bg-red-400 px-1 text-[9px] font-extrabold text-nexo-ink">{notifications.count > 99 ? '99+' : notifications.count}</span>}
        </button>

        <Sheet open={open} onOpenChange={setOpen}>
            <SheetHeader>
                <div className="pr-10">
                    <p className="nexo-eyebrow text-nexo-lime">Centro de notificaciones</p>
                    <SheetTitle>Pendientes de pago</SheetTitle>
                    <SheetDescription>Resumen del club activo actualizado con tus cobros.</SheetDescription>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <span className={notifications.count > 0 ? 'rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300' : 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300'}>{notifications.count > 0 ? <>{notifications.count} {notifications.count === 1 ? 'pendiente' : 'pendientes'}</> : 'Todo al día'}</span>
                    {notifications.count > 0 && <span className="text-xs text-slate-500">Revisa la cartera para gestionar los pagos.</span>}
                </div>
            </SheetHeader>
            <SheetBody>
                <div className="grid grid-cols-2 gap-3 border-b border-slate-700/80 p-4">
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cobros</p><p className="mt-1 text-xl font-extrabold text-white">{notifications.count}</p></div>
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total pendiente</p><p className="mt-1 truncate text-sm font-extrabold text-amber-200">{money(notifications.total)}</p></div>
                </div>
                {notifications.items.length > 0 ? <div className="divide-y divide-slate-800/80">{notifications.items.map((item) => <div key={item.id} className="px-5 py-4"><div className="flex items-start gap-3"><div className={item.status === 'overdue' ? 'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-400/10 text-red-300' : 'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300'}>{item.status === 'overdue' ? <AlertCircle size={17} /> : <Clock3 size={17} />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold text-slate-100">{item.athlete}</p><span className={item.status === 'overdue' ? 'shrink-0 text-[10px] font-bold uppercase text-red-300' : 'shrink-0 text-[10px] font-bold uppercase text-amber-300'}>{item.status === 'overdue' ? 'Vencido' : 'Pendiente'}</span></div><p className="mt-1 truncate text-xs text-slate-400">{item.discipline}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="text-slate-500">Vence {item.due_date ? formatAppDate(item.due_date) : '—'}</span><span className="font-bold text-slate-200">{money(item.amount)}</span></div></div></div></div>)}</div> : <div className="px-5 py-16 text-center"><CheckCircle2 className="mx-auto text-emerald-300" size={32} /><p className="mt-3 text-sm font-semibold text-slate-200">Todo al día</p><p className="mt-1 text-xs text-slate-500">No hay cobros pendientes en el club activo.</p></div>}
            </SheetBody>
            <SheetFooter><Link href={route('memberships.index')} onClick={() => setOpen(false)} className="block min-h-11 rounded-xl bg-nexo-lime px-3 py-3 text-center text-xs font-extrabold text-nexo-ink transition hover:brightness-105">Ver recaudos y gestionar pagos</Link></SheetFooter>
        </Sheet>
    </div>;
}
