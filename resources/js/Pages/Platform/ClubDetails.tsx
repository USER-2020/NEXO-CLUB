import PlatformLayout from '@/Layouts/PlatformLayout';
import { confirmToast } from '@/Components/ConfirmToast';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatAppDate } from '@/lib/dates';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    Mail,
    MapPin,
    ShieldCheck,
    Trash2,
    Users,
    UserPlus,
} from 'lucide-react';
import { FormEventHandler } from 'react';

type ClubDetails = {
    id: number;
    name: string;
    slug: string;
    email?: string;
    city?: string;
    timezone: string;
    is_active: boolean;
    created_at: string;
    primary_admin?: { id: number; name: string; email: string } | null;
    disciplines: Array<{ id: number; name: string; is_active: boolean }>;
    members: Array<{
        id: number;
        name: string;
        email: string;
        status: string;
        role?: string | null;
        is_default: boolean;
    }>;
};

type AdminAccess = {
    name: string;
    email: string;
    password: string | null;
    primary: boolean;
    existing: boolean;
} | null;

const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    contador: 'Contador',
    usuario: 'Usuario',
};

export default function ClubDetailsPage({ club, adminAccess }: { club: ClubDetails; adminAccess?: AdminAccess }) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', password: '' });

    const submitAdmin: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('platform.clubs.admins.store', club.id), { onSuccess: () => reset() });
    };

    const removeAdmin = (member: ClubDetails['members'][number]) => {
        confirmToast({
            title: `¿Retirar a ${member.name} como administrador?`,
            description: 'Se quitará su acceso administrativo a este club, pero su cuenta global no será eliminada.',
            confirmLabel: 'Retirar administrador',
            onConfirm: () => router.delete(route('platform.clubs.admins.destroy', [club.id, member.id])),
        });
    };

    return (
        <PlatformLayout
            header={
                <div>
                    <p className="nexo-eyebrow">Administración global</p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Detalle del club</h1>
                </div>
            }
        >
            <Head title={`Detalle de ${club.name}`} />

            <section className="mx-auto max-w-[1400px]">
                <Link
                    href={route('platform.clubs.index')}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-nexo-lime"
                >
                    <ArrowLeft size={16} /> Volver a clubes
                </Link>

                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nexo-lime/15 text-2xl font-black text-nexo-lime">
                                {club.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">{club.name}</p>
                                <p className="mt-1 text-sm text-slate-500">/{club.slug}</p>
                            </div>
                        </div>
                    </div>
                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                            club.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}
                    >
                        {club.is_active && <CheckCircle2 size={16} />}
                        {club.is_active ? 'Club activo' : 'Club inactivo'}
                    </span>
                </div>

                {adminAccess && (
                    <div className="mb-6 rounded-2xl border border-nexo-lime/30 bg-nexo-lime/10 p-5">
                        <p className="font-bold text-nexo-lime">
                            {adminAccess.primary ? 'Administrador principal asociado' : 'Administrador asociado'}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                            {adminAccess.existing
                                ? 'El usuario existente ya puede ingresar con su contraseña actual.'
                                : 'Entrega estas credenciales al administrador. La contraseña no volverá a mostrarse.'}
                        </p>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <div><p className="text-xs text-slate-500">Nombre</p><p className="font-semibold">{adminAccess.name}</p></div>
                            <div><p className="text-xs text-slate-500">Correo</p><p className="font-semibold">{adminAccess.email}</p></div>
                            {adminAccess.password && <div><p className="text-xs text-slate-500">Contraseña temporal</p><p className="font-semibold text-nexo-lime">{adminAccess.password}</p></div>}
                        </div>
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <SummaryCard icon={<Users size={19} />} label="Miembros" value={club.members.length} />
                            <SummaryCard icon={<Building2 size={19} />} label="Disciplinas" value={club.disciplines.length} />
                            <SummaryCard icon={<ShieldCheck size={19} />} label="Administradores" value={club.members.filter((member) => member.role === 'admin').length} />
                        </div>

                        <div className="nexo-card overflow-hidden">
                            <div className="border-b border-slate-800 p-6">
                                <h2 className="text-lg font-bold">Miembros del club</h2>
                                <p className="mt-1 text-sm text-slate-500">Usuarios y permisos asociados a este espacio deportivo.</p>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {club.members.map((member) => (
                                    <div key={member.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-bold text-nexo-lime">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-200">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="rounded-full bg-nexo-lime/10 px-2.5 py-1 font-semibold text-nexo-lime">
                                                {roleLabels[member.role ?? 'usuario'] ?? member.role}
                                            </span>
                                            <span className={`rounded-full px-2.5 py-1 font-semibold ${member.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                                                {member.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                            {member.role === 'admin' && (
                                                member.is_default && club.members.filter((clubMember) => clubMember.role === 'admin').length === 1
                                                    ? <span className="rounded-full bg-slate-800 px-2.5 py-1 font-semibold text-slate-400">Principal</span>
                                                    : <button type="button" onClick={() => removeAdmin(member)} className="rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-300" aria-label={`Retirar administrador ${member.name}`}><Trash2 size={15} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {club.members.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Este club aún no tiene miembros.</p>}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="nexo-card p-6">
                            <p className="nexo-eyebrow text-nexo-lime">Administrador principal</p>
                            {club.primary_admin ? (
                                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-900/60 p-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexo-lime/15 font-bold text-nexo-lime">
                                        {club.primary_admin.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{club.primary_admin.name}</p>
                                        <p className="truncate text-xs text-slate-500">{club.primary_admin.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-slate-500">Sin administrador asignado.</p>
                            )}
                        </div>

                        <div className="nexo-card p-6">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-nexo-lime/10 p-3 text-nexo-lime"><UserPlus size={19} /></div>
                                <div>
                                    <p className="nexo-eyebrow text-nexo-lime">Administradores</p>
                                    <p className="mt-1 text-sm text-slate-500">Asocia un usuario existente o crea uno nuevo para este club.</p>
                                </div>
                            </div>
                            <form onSubmit={submitAdmin} className="mt-5 space-y-4">
                                <label className="block text-sm font-semibold text-slate-300">Nombre
                                    <TextInput value={data.name} onChange={(event) => setData('name', event.target.value)} className="mt-2" required />
                                    {errors.name && <span className="mt-1 block text-xs font-normal text-red-300">{errors.name}</span>}
                                </label>
                                <label className="block text-sm font-semibold text-slate-300">Correo de acceso
                                    <TextInput type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="mt-2" required />
                                    {errors.email && <span className="mt-1 block text-xs font-normal text-red-300">{errors.email}</span>}
                                </label>
                                <label className="block text-sm font-semibold text-slate-300">Contraseña temporal
                                    <TextInput type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className="mt-2" minLength={8} />
                                    <span className="mt-1 block text-xs font-normal text-slate-500">Obligatoria solo si el correo no existe.</span>
                                    {errors.password && <span className="mt-1 block text-xs font-normal text-red-300">{errors.password}</span>}
                                </label>
                                <button disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nexo-lime px-4 py-3 text-sm font-bold text-nexo-ink shadow-lime transition hover:brightness-105 disabled:opacity-50">
                                    <UserPlus size={17} />{processing ? 'Asociando…' : 'Asociar administrador'}
                                </button>
                            </form>
                        </div>

                        <div className="nexo-card p-6">
                            <p className="nexo-eyebrow text-nexo-lime">Información del club</p>
                            <div className="mt-4 space-y-3 text-sm text-slate-400">
                                <p className="flex items-center gap-2"><Mail size={16} />{club.email || 'Sin correo registrado'}</p>
                                <p className="flex items-center gap-2"><MapPin size={16} />{club.city || 'Sin ciudad'} · {club.timezone}</p>
                                <p className="flex items-center gap-2"><CalendarDays size={16} />Creado el {formatAppDate(club.created_at)}</p>
                            </div>
                        </div>

                        <div className="nexo-card p-6">
                            <p className="nexo-eyebrow text-nexo-lime">Disciplinas</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {club.disciplines.map((discipline) => (
                                    <span key={discipline.id} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${discipline.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                                        {discipline.name}
                                    </span>
                                ))}
                                {club.disciplines.length === 0 && <p className="text-sm text-slate-500">Sin disciplinas registradas.</p>}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </PlatformLayout>
    );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="nexo-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-nexo-lime/10 text-nexo-lime">{icon}</div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold">{value}</p>
        </div>
    );
}
