import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BarChart3, CircleDollarSign, FileText, Plus, Users } from 'lucide-react';
import { ReactNode } from 'react';

type ModulePageProps = {
    title: string;
    eyebrow: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    actionLabel: string;
    actionHref: string;
    icon: 'users' | 'file' | 'money';
};

const icons = { users: Users, file: FileText, money: CircleDollarSign };

export default function ModulePage({ title, eyebrow, description, emptyTitle, emptyDescription, actionLabel, actionHref, icon }: ModulePageProps) {
    const Icon = icons[icon];

    return <AuthenticatedLayout header={<div><p className="nexo-eyebrow">{eyebrow}</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1></div>}>
        <Head title={title} />
        <section className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</p><p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p></div><Link href={actionHref} className="inline-flex w-fit items-center gap-2 rounded-xl bg-nexo-lime px-4 py-3 text-sm font-bold text-nexo-ink shadow-lime transition hover:brightness-105"><Plus size={17} /> {actionLabel}</Link></div>
            <div className="grid gap-4 sm:grid-cols-3"><Metric label="Total registrados" value="0" icon={<Icon size={19} />} /><Metric label="Activos" value="0" icon={<BarChart3 size={19} />} /><Metric label="Este mes" value="0" icon={<FileText size={19} />} /></div>
            <div className="nexo-card mt-6 flex min-h-80 flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-nexo-lime/10 p-4 text-nexo-lime"><Icon size={30} /></div><h2 className="text-xl font-bold">{emptyTitle}</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{emptyDescription}</p><Link href={actionHref} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-nexo-lime hover:text-white">{actionLabel} <ArrowRight size={16} /></Link></div>
        </section>
    </AuthenticatedLayout>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return <div className="nexo-card flex items-center gap-4 p-5"><div className="rounded-xl bg-slate-800 p-3 text-slate-400">{icon}</div><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></div>;
}
