import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Dumbbell, Edit3, Plus, XCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

type Discipline = {
    id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    created_at: string;
};

export default function Index({ disciplines: paginatedDisciplines, canManage }: { disciplines: { data: Discipline[]; current_page: number; last_page: number; from?: number; to?: number; total?: number }; canManage: boolean }) {
    const disciplines = paginatedDisciplines.data;
    const [editingId, setEditingId] = useState<number | null>(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({ name: '', description: '' });

    useEffect(() => {
        if (editingId) {
            document.getElementById('discipline-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [editingId]);

    const startEditing = (discipline: Discipline) => {
        setEditingId(discipline.id);
        setData({ name: discipline.name, description: discipline.description ?? '' });
    };

    const cancelEditing = () => {
        setEditingId(null);
        reset();
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => { reset(); setEditingId(null); } };

        if (editingId) {
            patch(route('disciplines.update', editingId), options);
            return;
        }

        post(route('disciplines.store'), options);
    };

    const toggle = (discipline: Discipline) => {
        router.patch(route('disciplines.toggle', discipline.id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<div><p className="nexo-eyebrow">Configuración del club</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Disciplinas</h1></div>}
        >
            <Head title="Disciplinas" />
            <section className="mx-auto max-w-[1400px]">
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Disciplinas deportivas</p><p className="mt-2 max-w-2xl text-sm text-slate-400">Configura las disciplinas disponibles para inscribir a los deportistas del club.</p></div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300"><Dumbbell size={17} /> {disciplines.length} disciplinas</span>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="nexo-card overflow-hidden">
                        <div className="border-b border-slate-800 p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-nexo-lime/10 p-3 text-nexo-lime"><Dumbbell size={20} /></div><div><h2 className="font-bold">Disciplinas del club</h2><p className="text-sm text-slate-500">Solo las disciplinas activas estarán disponibles para nuevas inscripciones.</p></div></div></div>
                        <div className="divide-y divide-slate-800">
                            {disciplines.map((discipline) => <div key={discipline.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-nexo-lime"><Dumbbell size={18} /></div><div><p className="font-semibold">{discipline.name}</p><p className="text-sm text-slate-500">{discipline.description || 'Sin descripción'}</p></div></div>
                                <div className="flex items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${discipline.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{discipline.is_active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{discipline.is_active ? 'Activa' : 'Inactiva'}</span>{canManage && <><button type="button" onClick={() => startEditing(discipline)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label={`Editar ${discipline.name}`}><Edit3 size={16} /></button><button type="button" onClick={() => toggle(discipline)} role="switch" aria-checked={discipline.is_active} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-2.5 py-2 transition hover:border-slate-500" aria-label={`${discipline.is_active ? 'Desactivar' : 'Activar'} ${discipline.name}`}><span className={`relative h-5 w-9 rounded-full transition ${discipline.is_active ? 'bg-nexo-lime' : 'bg-slate-700'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${discipline.is_active ? 'left-4' : 'left-0.5'}`} /></span><span className={`text-xs font-semibold ${discipline.is_active ? 'text-nexo-lime' : 'text-slate-400'}`}>{discipline.is_active ? 'Activa' : 'Inactiva'}</span></button></>}</div>
                            </div>)}
                            {disciplines.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Aún no hay disciplinas configuradas.</div>}
                        </div>
                    </div>

                    {canManage && <div id="discipline-form" className="nexo-card h-fit p-6 xl:sticky xl:top-24"><div className="flex items-start gap-3"><div className="rounded-xl bg-nexo-lime/10 p-3 text-nexo-lime">{editingId ? <Edit3 size={20} /> : <Plus size={20} />}</div><div><h2 className="font-bold">{editingId ? 'Editar disciplina' : 'Agregar disciplina'}</h2><p className="mt-1 text-sm text-slate-500">{editingId ? 'Actualiza la información de la disciplina seleccionada.' : 'Crea una disciplina para usarla en las inscripciones.'}</p></div></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-300">Nombre<input value={data.name} onChange={(event) => setData('name', event.target.value)} className="member-input mt-2" placeholder="Ej. Fútbol" required />{errors.name && <span className="mt-1 block text-xs font-normal text-red-300">{errors.name}</span>}</label><label className="block text-sm font-semibold text-slate-300">Descripción<textarea value={data.description} onChange={(event) => setData('description', event.target.value)} className="member-input mt-2 min-h-28 resize-y" placeholder="Describe la disciplina o categoría general." />{errors.description && <span className="mt-1 block text-xs font-normal text-red-300">{errors.description}</span>}</label><div className="flex gap-2"><button disabled={processing} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-nexo-lime px-4 py-3 text-sm font-bold text-nexo-ink shadow-lime transition hover:brightness-105 disabled:opacity-50">{editingId ? <Edit3 size={17} /> : <Plus size={17} />}{processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear disciplina'}</button>{editingId && <button type="button" onClick={cancelEditing} className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">Cancelar</button>}</div></form></div>}
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
