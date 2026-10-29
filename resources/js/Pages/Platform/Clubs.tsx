import PlatformLayout from '@/Layouts/PlatformLayout';
import { confirmToast } from '@/Components/ConfirmToast';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { formatAppDate } from '@/lib/dates';
import {
    Building2,
    CalendarDays,
    CheckCircle2,
    Eye,
    EyeOff,
    Mail,
    MapPin,
    Plus,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import {
    Children,
    cloneElement,
    FormEventHandler,
    isValidElement,
    ReactElement,
    ReactNode,
    useState,
} from 'react';

type Club = {
    id: number;
    name: string;
    slug: string;
    email?: string;
    city?: string;
    timezone: string;
    is_active: boolean;
    users_count: number;
    disciplines_count: number;
    created_at: string;
    primary_admin?: Array<{ id: number; name: string; email: string }>;
};

type CreatedAccess = {
    club: string;
    name: string;
    email: string;
    password: string | null;
    existing: boolean;
} | null;

type Application = { id: number; applicant: { name: string; email: string }; email_verified_at?: string | null; club_name: string; club_email: string; club_phone: string; club_address: string; club_city: string; club_timezone: string; created_at: string };

export default function Clubs({
    clubs: paginatedClubs,
    applications,
    createdAccess,
}: {
    clubs: { data: Club[]; current_page: number; last_page: number; from?: number; to?: number; total?: number };
    applications: Application[];
    createdAccess?: CreatedAccess;
}) {
    const clubs = paginatedClubs.data;
    const page = usePage();
    const flash = page.props.flash as { createdAccess?: CreatedAccess } | undefined;
    const access = createdAccess ?? flash?.createdAccess;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        city: '',
        timezone: 'America/Bogota',
        admin_name: '',
        admin_email: '',
        admin_password: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('platform.clubs.store'), { onSuccess: () => reset() });
    };

    const toggleClub = (club: Club) => {
        router.patch(route('platform.clubs.toggle', club.id), {}, { preserveScroll: true });
    };

    const removeClub = (club: Club) => {
        confirmToast({
            title: `¿Eliminar ${club.name}?`,
            description: 'Se borrarán definitivamente sus miembros, disciplinas y configuración.',
            confirmLabel: 'Eliminar club',
            onConfirm: () => router.delete(route('platform.clubs.destroy', club.id)),
        });
    };

    const openClub = (club: Club) => {
        router.get(route('platform.clubs.show', club.id));
    };

    const resendVerification = (application: Application) => router.post(route('platform.club-applications.resend-verification', application.id), {}, { preserveScroll: true });
    const approveApplication = (application: Application) => {
        if (!application.email_verified_at) {
            confirmToast({
                title: 'Correo pendiente de confirmación',
                description: `El solicitante aún no confirmó ${application.applicant.email}. Puedes reenviar el enlace de verificación.`,
                confirmLabel: 'Reenviar correo',
                onConfirm: () => resendVerification(application),
            });
            return;
        }

        router.patch(route('platform.club-applications.approve', application.id), {}, { preserveScroll: true });
    };
    const rejectApplication = (application: Application) => confirmToast({ title: `¿Rechazar ${application.club_name}?`, description: 'La cuenta quedará bloqueada y no se creará el club.', confirmLabel: 'Rechazar solicitud', onConfirm: () => router.patch(route('platform.club-applications.reject', application.id), {}, { preserveScroll: true }) });

    return (
        <PlatformLayout
            header={
                <div>
                    <p className="nexo-eyebrow">Administración global</p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Clubes de la plataforma</h1>
                </div>
            }
        >
            <Head title="Clubes de la plataforma" />

            <section className="mx-auto max-w-[1500px]">
                <div className="mb-8">
                    <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Todos los clubes</p>
                    <p className="mt-2 text-sm text-slate-400">
                        Crea clubes, asigna su administrador inicial y supervisa su operación.
                    </p>
                </div>

                {access && (
                    <div className="mb-6 rounded-2xl border border-nexo-lime/30 bg-nexo-lime/10 p-5">
                        <p className="font-bold text-nexo-lime">Club creado correctamente</p>
                        <p className="mt-1 text-sm text-slate-300">
                            {access.existing
                                ? 'El administrador existente fue asignado al nuevo club.'
                                : 'Entrega estas credenciales al administrador. La contraseña no se volverá a mostrar.'}
                        </p>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-slate-500">Club</p>
                                <p className="font-semibold">{access.club}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Administrador</p>
                                <p className="font-semibold">
                                    {access.name} · {access.email}
                                </p>
                            </div>
                            {access.password && (
                                <div>
                                    <p className="text-xs text-slate-500">Contraseña temporal</p>
                                    <p className="font-semibold text-nexo-lime">{access.password}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {applications.length > 0 && <section className="mb-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="nexo-eyebrow text-amber-300">Pendientes de aprobación</p><h2 className="mt-1 text-xl font-bold">Solicitudes públicas</h2><p className="mt-1 text-sm text-slate-400">Revisa los datos antes de habilitar la cuenta y crear el club.</p></div><span className="rounded-full bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">{applications.length}</span></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{applications.map((application) => <div key={application.id} className="rounded-2xl border border-slate-700 bg-nexo-surface p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{application.club_name}</h3><p className="mt-1 text-sm text-slate-400">Solicitante: {application.applicant.name} · {application.applicant.email}</p></div><span className="text-xs text-slate-500">{formatAppDate(application.created_at)}</span></div><div className="mt-4 grid gap-1 text-sm text-slate-400 sm:grid-cols-2"><p>{application.club_email}</p><p>{application.club_phone}</p><p className="sm:col-span-2">{application.club_address}, {application.club_city}</p></div><div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs"><span className={application.email_verified_at ? 'text-emerald-300' : 'text-amber-200'}>{application.email_verified_at ? 'Correo confirmado' : 'Correo pendiente de confirmación'}</span>{!application.email_verified_at && <button type="button" onClick={() => resendVerification(application)} className="min-h-9 rounded-lg border border-amber-300/30 px-3 font-semibold text-amber-200 hover:bg-amber-300/10">Reenviar correo</button>}</div><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => rejectApplication(application)} className="min-h-11 rounded-xl border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10">Rechazar</button><button type="button" onClick={() => approveApplication(application)} className="min-h-11 rounded-xl bg-nexo-lime px-4 py-2 text-sm font-bold text-nexo-ink shadow-lime">Aprobar y crear club</button></div></div>)}</div></section>}

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="grid items-start gap-4 md:grid-cols-2">
                        {clubs.map((club) => (
                            <div
                                key={club.id}
                                className="nexo-card h-fit cursor-pointer p-6 transition hover:-translate-y-0.5 hover:border-nexo-lime/40"
                                role="link"
                                tabIndex={0}
                                onClick={() => openClub(club)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openClub(club);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexo-lime/15 text-xl font-black text-nexo-lime">
                                        {club.name.charAt(0)}
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            club.is_active
                                                ? 'bg-emerald-400/10 text-emerald-300'
                                                : 'bg-slate-700 text-slate-400'
                                        }`}
                                    >
                                        {club.is_active && <CheckCircle2 size={13} />}
                                        {club.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                <h2 className="mt-5 text-xl font-bold">{club.name}</h2>
                                <p className="mt-1 text-sm text-slate-500">/{club.slug}</p>

                                <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-400">
                                    <p className="flex items-center gap-2">
                                        <Mail size={15} />
                                        {club.email || 'Sin correo registrado'}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <MapPin size={15} />
                                        {club.city || 'Sin ciudad'} · {club.timezone}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <CalendarDays size={15} />
                                        Creado el {formatAppDate(club.created_at)}
                                    </p>
                                </div>

                                <div className="mt-5 flex items-center gap-5 border-t border-slate-800 pt-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <Users size={15} />
                                        {club.users_count} miembros
                                    </span>
                                    <span>{club.disciplines_count} disciplinas</span>
                                </div>

                                <div className="mt-5 border-t border-slate-800 pt-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Administrador principal
                                    </p>
                                    {club.primary_admin?.[0] ? (
                                        <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexo-lime/15 font-bold text-nexo-lime">
                                                {club.primary_admin[0].name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-200">
                                                    <UserCog size={14} className="shrink-0 text-nexo-lime" />
                                                    {club.primary_admin[0].name}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">{club.primary_admin[0].email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">Sin administrador asignado</p>
                                    )}
                                </div>

                                <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggleClub(club);
                                        }}
                                        role="switch"
                                        aria-checked={club.is_active}
                                        aria-label={`${club.is_active ? 'Desactivar' : 'Activar'} ${club.name}`}
                                        className="flex items-center justify-between rounded-xl border border-slate-700 px-3 py-2.5 transition hover:border-slate-500"
                                    >
                                        <span
                                            className={`relative h-6 w-11 rounded-full transition ${
                                                club.is_active ? 'bg-nexo-lime' : 'bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                                                    club.is_active ? 'left-6' : 'left-1'
                                                }`}
                                            />
                                        </span>
                                        <span
                                            className={`ml-3 text-sm font-semibold ${
                                                club.is_active ? 'text-nexo-lime' : 'text-slate-400'
                                            }`}
                                        >
                                            {club.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            removeClub(club);
                                        }}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
                                    >
                                        <Trash2 size={15} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}

                        {clubs.length === 0 && (
                            <div className="nexo-card p-8 text-center text-sm text-slate-500 md:col-span-2">
                                No hay clubes registrados.
                            </div>
                        )}
                    </div>

                    <div className="nexo-card h-fit p-6 xl:sticky xl:top-24">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-nexo-lime/10 p-3 text-nexo-lime">
                                <Plus size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold">Crear club y administrador</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    El administrador podrá entrar al dashboard del nuevo club.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <p className="nexo-eyebrow text-nexo-lime">Datos del club</p>
                            <Field label="Nombre" error={errors.name}>
                                <input
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    className="member-input"
                                    required
                                />
                            </Field>
                            <Field label="Correo del club" error={errors.email}>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    className="member-input"
                                />
                            </Field>
                            <Field label="Ciudad" error={errors.city}>
                                <input
                                    value={data.city}
                                    onChange={(event) => setData('city', event.target.value)}
                                    className="member-input"
                                />
                            </Field>

                            <div className="border-t border-slate-800 pt-4">
                                <p className="nexo-eyebrow text-nexo-lime">Administrador inicial</p>
                            </div>
                            <Field label="Nombre del administrador" error={errors.admin_name}>
                                <input
                                    value={data.admin_name}
                                    onChange={(event) => setData('admin_name', event.target.value)}
                                    className="member-input"
                                    required
                                />
                            </Field>
                            <Field label="Correo de acceso" error={errors.admin_email}>
                                <input
                                    type="email"
                                    value={data.admin_email}
                                    onChange={(event) => setData('admin_email', event.target.value)}
                                    className="member-input"
                                    required
                                />
                            </Field>
                            <Field label="Contraseña temporal" error={errors.admin_password}>
                                <input
                                    type="password"
                                    value={data.admin_password}
                                    onChange={(event) => setData('admin_password', event.target.value)}
                                    className="member-input"
                                    minLength={8}
                                />
                                <span className="mt-1 block text-xs font-normal text-slate-500">
                                    Obligatoria para un administrador nuevo. Déjala vacía si el correo ya existe.
                                </span>
                            </Field>
                            <button
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nexo-lime px-4 py-3 text-sm font-bold text-nexo-ink shadow-lime disabled:opacity-50"
                            >
                                <Building2 size={17} />
                                {processing ? 'Creando…' : 'Crear club y acceso'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </PlatformLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const items = Children.toArray(children);
    const passwordIndex = items.findIndex((child) => isValidElement(child) && child.props.type === 'password');

    if (passwordIndex === -1) {
        return (
            <label className="block text-sm font-semibold text-slate-300">
                {label}
                {children}
                {error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}
            </label>
        );
    }

    const passwordInput = items[passwordIndex] as ReactElement<{ className?: string; type?: string }>;
    const input = cloneElement(passwordInput, {
        type: visible ? 'text' : 'password',
        className: `${passwordInput.props.className ?? ''} pr-12`,
    });

    return (
        <label className="block text-sm font-semibold text-slate-300">
            {label}
            <div className="relative">
                {input}
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-nexo-lime"
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {items.filter((_, index) => index !== passwordIndex)}
            {error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}
        </label>
    );
}
