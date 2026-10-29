import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { confirmToast } from '@/Components/ConfirmToast';
import { SearchableSelect } from '@/Components/ui/searchable-select';
import { Head, router, useForm } from '@inertiajs/react';
import { Eye, EyeOff, ShieldCheck, Trash2, UserCog, UserPlus, Users } from 'lucide-react';
import { Children, cloneElement, FormEventHandler, isValidElement, ReactElement, ReactNode, useState } from 'react';
import Pagination from '@/Components/Pagination';

type Member = {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    role: string | null;
    joined_at?: string | null;
};

const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    contador: 'Contador',
    usuario: 'Usuario',
};

export default function Index({ members: paginatedMembers, roles }: { members: { data: Member[]; current_page: number; last_page: number; from?: number; to?: number; total?: number; per_page?: number }; roles: string[] }) {
    const members = paginatedMembers.data;
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', password: '', role: 'usuario' });
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('club-members.store'), { onSuccess: () => reset() });
    };

    const updateMember = (member: Member, field: 'status' | 'role', value: string) => {
        if (member.role === 'admin') return;

        router.patch(
            route('club-members.update', member.id),
            {
                status: field === 'status' ? value : member.status,
                role: field === 'role' ? value : member.role ?? 'usuario',
            },
            { preserveScroll: true },
        );
    };

    const removeMember = (member: Member) => {
        if (member.role === 'admin') return;

        confirmToast({
            title: `¿Retirar a ${member.name}?`,
            description: 'El usuario perderá el acceso a este club, pero su cuenta no será eliminada.',
            confirmLabel: 'Retirar miembro',
            onConfirm: () => router.delete(route('club-members.destroy', member.id), { preserveScroll: true }),
        });
    };

    return (
        <AuthenticatedLayout header={<div><p className="nexo-eyebrow">Configuración del club</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Equipo y permisos</h1></div>}>
            <Head title="Equipo y permisos" />
            <section className="mx-auto max-w-[1400px]">
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Usuarios del club</p><p className="mt-2 max-w-2xl text-sm text-slate-400">Invita miembros y controla qué puede hacer cada persona dentro del club activo.</p></div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300"><Users size={17} /> {members.length} miembros</span>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                    <div className="nexo-card overflow-visible">
                        <div className="border-b border-slate-800 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-nexo-lime/10 p-3 text-nexo-lime"><UserCog size={20} /></div><div><h2 className="font-bold">Miembros y roles</h2><p className="text-sm text-slate-500">Los administradores se gestionan desde el panel Superadmin.</p></div></div></div>
                        <div className="divide-y divide-slate-800">
                            {members.map((member) => {
                                const isAdmin = member.role === 'admin';

                                return <div key={member.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-bold text-nexo-lime">{member.name.charAt(0).toUpperCase()}</div><div><p className="font-semibold">{member.name}</p><p className="text-xs text-slate-500">{member.email}</p></div></div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isAdmin ? <span className="rounded-lg border border-nexo-lime/20 bg-nexo-lime/10 px-2.5 py-2 text-xs font-semibold text-nexo-lime">Administrador · Superadmin</span> : <div className="min-w-36"><SearchableSelect value={member.role ?? 'usuario'} options={roles.map((role) => ({ id: role, label: roleLabels[role] ?? role }))} onValueChange={(value) => updateMember(member, 'role', value)} searchPlaceholder="Buscar rol..." /></div>}
                                        {isAdmin ? <span className="rounded-lg bg-slate-800 px-2.5 py-2 text-xs font-semibold text-slate-400">Gestionado globalmente</span> : <div className="min-w-36"><SearchableSelect value={member.status} options={[{ id: 'active', label: 'Activo' }, { id: 'inactive', label: 'Inactivo' }]} onValueChange={(value) => updateMember(member, 'status', value)} searchPlaceholder="Buscar estado..." /></div>}
                                        {!isAdmin && <button type="button" onClick={() => removeMember(member)} className="rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-300" aria-label={`Retirar a ${member.name}`}><Trash2 size={16} /></button>}
                                    </div>
                                </div>;
                            })}
                            {members.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Aún no hay miembros asignados a este club.</div>}
                        </div>
                    </div>

                    <div className="nexo-card h-fit p-6">
                        <div className="flex items-start gap-3"><div className="rounded-xl bg-nexo-lime/10 p-3 text-nexo-lime"><UserPlus size={20} /></div><div><h2 className="font-bold">Agregar miembro</h2><p className="mt-1 text-sm text-slate-500">Agrega usuarios operativos con rol de contador o usuario.</p></div></div>
                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <Field label="Nombre" error={errors.name}><input value={data.name} onChange={(event) => setData('name', event.target.value)} className="member-input" required /></Field>
                            <Field label="Correo" error={errors.email}><input type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="member-input" required /></Field>
                            <Field label="Contraseña temporal" error={errors.password}><input type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className="member-input" minLength={8} /><span className="mt-1 block text-xs font-normal text-slate-500">Déjala vacía si la cuenta ya existe.</span></Field>
                            <Field label="Rol" error={errors.role}><SearchableSelect className="mt-2" value={data.role} options={roles.map((role) => ({ id: role, label: roleLabels[role] ?? role }))} onValueChange={(value) => setData('role', value)} searchPlaceholder="Buscar rol..." /></Field>
                            <button disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nexo-lime px-4 py-3 text-sm font-bold text-nexo-ink shadow-lime transition hover:brightness-105 disabled:opacity-50"><ShieldCheck size={17} />{processing ? 'Guardando…' : 'Agregar al club'}</button>
                        </form>
                    </div>
                </div>
                <Pagination {...paginatedMembers} />
            </section>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const items = Children.toArray(children);
    const passwordIndex = items.findIndex((child) => isValidElement(child) && child.props.type === 'password');

    if (passwordIndex === -1) return <label className="block text-sm font-semibold text-slate-300">{label}{children}{error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}</label>;

    const passwordInput = items[passwordIndex] as ReactElement<{ className?: string; type?: string }>;
    const input = cloneElement(passwordInput, { type: visible ? 'text' : 'password', className: `${passwordInput.props.className ?? ''} pr-12` });

    return <label className="block text-sm font-semibold text-slate-300">{label}<div className="relative">{input}<button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-nexo-lime" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{items.filter((_, index) => index !== passwordIndex)}{error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}</label>;
}
