import ClubFinancialChart, { formatCop, type FinancialActivity } from '@/Components/ClubFinancialChart';
import ClubOnboarding, { type OnboardingChapter } from '@/Components/ClubOnboarding';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CircleDollarSign, FileText, Plus, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { formatAppDate } from '@/lib/dates';

type DashboardProps = {
    onboardingChapters?: OnboardingChapter[];
    showOnboarding?: boolean;
    today: string;
    financialActivity: FinancialActivity;
    stats: { activeAthletes: number; monthlyEnrollments: number; monthlyRevenue: number; outstandingBalance: number; overdueCharges: number };
    recentPayments: { id: number; name: string; amount: number; date: string | null }[];
};

export default function Dashboard({ today, stats, recentPayments, financialActivity, onboardingChapters = [], showOnboarding = false }: DashboardProps) {
    const user = usePage().props.auth.user;
    const [onboardingOpen, setOnboardingOpen] = useState(showOnboarding);

    function closeOnboarding() {
        setOnboardingOpen(false);
        document.dispatchEvent(new Event('nexo:club-onboarding-closed'));
    }

    const cards = [
        { label: 'Deportistas activos', value: stats.activeAthletes.toLocaleString('es-CO'), icon: Users, tone: 'lime' },
        { label: 'Inscripciones del mes', value: stats.monthlyEnrollments.toLocaleString('es-CO'), icon: FileText, tone: 'blue' },
        { label: 'Recaudo del mes', value: formatCop(stats.monthlyRevenue), icon: CircleDollarSign, tone: 'violet' },
        { label: 'Saldo pendiente', value: formatCop(stats.outstandingBalance), icon: Wallet, tone: 'amber' },
    ];
    return <AuthenticatedLayout header={<div><p className="nexo-eyebrow">{today}</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Resumen del club</h1></div>}>
        <Head title="Resumen" />
        {onboardingOpen && onboardingChapters.length > 0 && <ClubOnboarding chapters={onboardingChapters} onClose={closeOnboarding} />}
        <section data-tour="module-content" className="mx-auto max-w-[1400px]"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Hola, {user.name.split(' ')[0]}</p><p className="mt-2 max-w-xl text-sm text-slate-400">Aquí tienes una vista clara de lo que está pasando en tu club.</p></div><div className="flex flex-wrap items-center gap-3">
            {onboardingChapters.length > 0 && <button type="button" data-tour="dashboard-onboarding" onClick={() => setOnboardingOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-nexo-lime focus-visible:outline focus-visible:outline-nexo-lime"><BookOpen size={17} /> Primeros pasos</button>}
            <Link href={route('clubs.index')} className="inline-flex w-fit items-center gap-2 rounded-xl bg-nexo-lime px-4 py-3 text-sm font-bold text-nexo-ink shadow-lime transition hover:brightness-105"><Plus size={18} /> Configurar club</Link>
        </div></div>
        <div data-tour="dashboard-kpis" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="nexo-card min-w-0 p-3 sm:p-5"><div className="flex items-start justify-between"><div className={`rounded-xl p-2.5 ${card.tone === 'lime' ? 'bg-nexo-lime/15 text-nexo-lime' : card.tone === 'blue' ? 'bg-sky-400/10 text-sky-300' : card.tone === 'violet' ? 'bg-violet-400/10 text-violet-300' : 'bg-amber-400/10 text-amber-300'}`}><Icon size={20} /></div><ArrowUpRight size={17} className="text-slate-600" /></div><p className="mt-4 text-sm text-slate-400 sm:mt-7">{card.label}</p><p className="mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl">{card.value}</p></div>; })}</div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <ClubFinancialChart activity={financialActivity} />
            <section className="nexo-card min-w-0 p-4 sm:p-6" aria-labelledby="club-recent-payments">
                <h2 id="club-recent-payments" className="text-lg font-bold">Últimos pagos</h2>
                {recentPayments.length > 0 ? (
                    <ul role="list" className="mt-3 divide-y divide-slate-800">
                        {recentPayments.map((payment) => (
                            <li key={payment.id} className="flex items-start justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="break-words text-sm font-semibold text-slate-100">{payment.name || 'Deportista'}</p>
                                    <p className="mt-1 text-xs text-slate-400">{formatAppDate(payment.date)}</p>
                                </div>
                                <span className="shrink-0 text-sm font-bold tabular-nums text-nexo-lime">{formatCop(payment.amount)}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="py-12 text-center text-sm text-slate-400">Sin pagos registrados.</p>}
            </section>
        </div>
        <div data-tour="dashboard-action" className="mt-6 rounded-2xl border border-nexo-lime/20 bg-gradient-to-r from-nexo-lime/10 to-transparent p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-nexo-lime">Siguiente paso</p><p className="mt-1 text-lg font-bold">Configura tu club para comenzar</p><p className="mt-1 text-sm text-slate-400">Agrega disciplinas, tarifas y tu equipo administrativo.</p></div><Link href={route('clubs.index')} className="inline-flex w-fit items-center gap-2 rounded-xl border border-nexo-lime/30 px-4 py-3 text-sm font-semibold text-nexo-lime hover:bg-nexo-lime/10">Ir a configuración <ArrowUpRight size={16} /></Link></div></div></section>
    </AuthenticatedLayout>;
}
