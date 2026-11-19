import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DatePicker } from '@/Components/ui/date-picker';
import { Input } from '@/Components/ui/input';
import { PhoneInputField } from '@/Components/ui/phone-input';
import { SearchableSelect } from '@/Components/ui/searchable-select';
import { Head, router, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useEffect, useId, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Check, Edit3, UserPlus, Users, X } from 'lucide-react';
import { confirmToast } from '@/Components/ConfirmToast';
import Pagination from '@/Components/Pagination';
import { billingFrequencies } from '@/lib/billing';

type Athlete = { id: number; first_name: string; last_name: string; document_type: string; document_number?: string | null; birth_date?: string | null; height_cm?: string | null; weight_kg?: string | null; shirt_size?: string | null; shoe_size?: string | null; phone?: string | null; email?: string | null; guardian_name?: string | null; guardian_phone?: string | null; status: string; photo_url: string | null; active_enrollments_count: number; current_enrollment?: { discipline_id: number; start_date: string; billing_frequency: string; monthly_amount: number; due_day: number } | null };
type Discipline = { id: number; name: string };
type FormData = { first_name: string; last_name: string; document_type: string; document_number: string; birth_date: string; height_cm: string; weight_kg: string; shirt_size: string; shoe_size: string; phone: string; email: string; guardian_name: string; guardian_phone: string; photo: File | null; discipline_id: string; start_date: string; billing_frequency: string; monthly_amount: string; due_day: string; initial_charge_mode: string; payment_method: string; payment_reference: string };
const documentTypes = [{ id: 'tarjeta_identidad', label: 'Tarjeta de identidad' }, { id: 'cedula_ciudadania', label: 'Cédula de ciudadanía' }, { id: 'pasaporte', label: 'Pasaporte' }, { id: 'otro', label: 'Otro' }];
const initialForm = (today: string): FormData => ({ first_name: '', last_name: '', document_type: 'cedula_ciudadania', document_number: '', birth_date: '', height_cm: '', weight_kg: '', shirt_size: '', shoe_size: '', phone: '', email: '', guardian_name: '', guardian_phone: '', photo: null, discipline_id: '', start_date: today, billing_frequency: 'monthly', monthly_amount: '', due_day: String(Number(today.slice(-2))), initial_charge_mode: 'pending', payment_method: '', payment_reference: '' });

export default function Index({ athletes: paginatedAthletes, disciplines, today }: { athletes: { data: Athlete[]; current_page: number; last_page: number; from?: number; to?: number; total?: number; per_page?: number }; disciplines: Discipline[]; today: string }) {
    const athletes = paginatedAthletes.data;
    const emptyForm = initialForm(today);
    const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState<Athlete | null>(null); const [step, setStep] = useState(1); const [dueDayOverridden, setDueDayOverridden] = useState(false);
    const form = useForm<FormData>(emptyForm);
    const openCreate = () => { setEditing(null); setStep(1); setDueDayOverridden(false); form.setData(emptyForm); form.clearErrors(); setModalOpen(true); };
    const startEditing = (athlete: Athlete) => { const enrollment = athlete.current_enrollment; const startDay = enrollment ? Number(enrollment.start_date.slice(0, 10).slice(-2)) : Number(today.slice(-2)); setEditing(athlete); setStep(1); setDueDayOverridden(Boolean(enrollment && enrollment.due_day !== startDay)); form.setData({ ...emptyForm, first_name: athlete.first_name, last_name: athlete.last_name, document_type: athlete.document_type ?? 'cedula_ciudadania', document_number: athlete.document_number ?? '', birth_date: athlete.birth_date ?? '', height_cm: athlete.height_cm ?? '', weight_kg: athlete.weight_kg ?? '', shirt_size: athlete.shirt_size ?? '', shoe_size: athlete.shoe_size ?? '', phone: athlete.phone ?? '', email: athlete.email ?? '', guardian_name: athlete.guardian_name ?? '', guardian_phone: athlete.guardian_phone ?? '', photo: null, discipline_id: enrollment ? String(enrollment.discipline_id) : '', start_date: enrollment?.start_date ?? today, billing_frequency: enrollment?.billing_frequency ?? 'monthly', monthly_amount: enrollment ? String(enrollment.monthly_amount) : '', due_day: enrollment ? String(enrollment.due_day) : String(new Date().getDate()) }); form.clearErrors(); setModalOpen(true); };
    const close = () => { setModalOpen(false); setEditing(null); setStep(1); setDueDayOverridden(false); form.reset(); form.clearErrors(); };
    const submit = () => {
        form.transform((data) => editing ? { ...data, _method: 'patch' } : {
            ...data,
            due_day: data.discipline_id && data.initial_charge_mode === 'paid' && !dueDayOverridden ? String(Number(today.slice(-2))) : data.due_day,
            initial_charge_mode: data.discipline_id ? data.initial_charge_mode : 'pending',
        });
        form.post(editing ? route('athletes.update', editing.id) : route('athletes.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: close,
            onError: (errors) => {
                const errorSteps = [
                    ['first_name', 'last_name', 'document_type', 'document_number', 'birth_date'],
                    ['phone', 'email', 'guardian_name', 'guardian_phone'],
                    ['photo', 'height_cm', 'weight_kg', 'shirt_size', 'shoe_size'],
                ];
                const invalidStep = errorSteps.findIndex((fields) => fields.some((field) => field in errors));
                setStep(invalidStep === -1 ? 4 : invalidStep + 1);
            },
        });
    };
    const toggleStatus = (athlete: Athlete) => { const next = athlete.status === 'active' ? 'inactive' : 'active'; confirmToast({ title: `${next === 'active' ? 'Activar' : 'Desactivar'} deportista`, description: `${athlete.first_name} ${athlete.last_name} ${next === 'active' ? 'podrá' : 'no podrá'} participar en nuevas operaciones.`, confirmLabel: next === 'active' ? 'Activar' : 'Desactivar', onConfirm: () => router.patch(route('athletes.status', athlete.id), { status: next }, { preserveScroll: true }) }); };
    return <AuthenticatedLayout header={<div><p className="nexo-eyebrow">Operación</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Deportistas</h1></div>}><Head title="Deportistas" /><section data-tour="module-content" className="mx-auto max-w-[1400px]"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Deportistas</p><p className="mt-2 max-w-2xl text-sm text-slate-400">Administra deportistas, accesos, inscripciones y recaudos.</p></div><button type="button" data-tour="athletes-create" onClick={openCreate} className="inline-flex w-fit items-center gap-2 rounded-xl bg-nexo-lime px-5 py-3 text-sm font-bold text-nexo-ink shadow-lime"><UserPlus size={18} /> Crear deportista</button></div><div className="mb-5 grid gap-4 sm:grid-cols-3"><Metric label="Total registrados" value={athletes.length} /><Metric label="Activos" value={athletes.filter((athlete) => athlete.status === 'active').length} /><Metric label="Inactivos" value={athletes.filter((athlete) => athlete.status !== 'active').length} /></div><div data-tour="athletes-list" className="nexo-card overflow-hidden"><div className="border-b border-slate-800 p-6"><h2 className="font-bold">Lista de deportistas</h2><p className="mt-1 text-sm text-slate-500">Edita sus datos o controla su acceso al club.</p></div><div className="divide-y divide-slate-800">{athletes.map((athlete) => <div key={athlete.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center gap-3"><Photo athlete={athlete} /><div className="min-w-0"><p className="truncate font-semibold">{athlete.first_name} {athlete.last_name}</p><p className="truncate text-xs text-slate-500">{athlete.document_number || 'Sin documento'} · {athlete.email || 'Sin acceso'}</p><p className="mt-1 text-xs text-slate-500">{athlete.active_enrollments_count} inscripciones activas</p></div></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${athlete.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{athlete.status === 'active' ? 'Activo' : 'Inactivo'}</span><button type="button" onClick={() => startEditing(athlete)} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-nexo-lime hover:text-nexo-lime"><Edit3 size={14} /> Editar</button><button type="button" onClick={() => toggleStatus(athlete)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold">{athlete.status === 'active' ? 'Desactivar' : 'Activar'}</button></div></div>)}{athletes.length === 0 && <div className="p-14 text-center text-sm text-slate-500"><Users className="mx-auto text-slate-600" size={34} /><p className="mt-3 font-semibold text-slate-300">Aún no hay deportistas registrados</p></div>}</div></div><Pagination {...paginatedAthletes} /></section>{modalOpen && <OnboardingModal today={today} step={step} setStep={setStep} editing={editing} disciplines={disciplines} data={form.data} setData={form.setData} processing={form.processing} errors={form.errors} submit={submit} close={close} dueDayOverridden={dueDayOverridden} setDueDayOverridden={setDueDayOverridden} />}</AuthenticatedLayout>;
}

function OnboardingModal({ today, step, setStep, editing, disciplines, data, setData, processing, errors, submit, close, dueDayOverridden, setDueDayOverridden }: { today: string; step: number; setStep: (step: number) => void; editing: Athlete | null; disciplines: Discipline[]; data: FormData; setData: <K extends keyof FormData>(key: K, value: FormData[K]) => void; processing: boolean; errors: Record<string, string>; submit: () => void; close: () => void; dueDayOverridden: boolean; setDueDayOverridden: (value: boolean) => void }) {
    const totalSteps = 4;
    const hasEnrollment = Boolean(data.discipline_id);
    const payNow = !editing && hasEnrollment && data.initial_charge_mode === 'paid';
    const createLabel = !hasEnrollment ? 'Guardar solo perfil' : payNow ? 'Registrar pago y activar' : 'Crear con cargo pendiente';
    const updateStartDate = (value: string) => { setData('start_date', value); if (!dueDayOverridden && value) setData('due_day', String(Math.min(31, Number(value.slice(-2))))); };
    const updateDueDay = (value: string) => { setDueDayOverridden(true); setData('due_day', value); };
    return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-nexo-ink/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="athlete-onboarding-title" data-tour="athletes-form"><div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-700 bg-nexo-surface shadow-2xl sm:rounded-2xl"><div className="flex h-8 shrink-0 items-center justify-center sm:hidden"><span className="h-1.5 w-12 rounded-full bg-slate-600" /></div><div className="flex shrink-0 items-start justify-between border-b border-slate-800 p-5 sm:p-6"><div><p className="nexo-eyebrow text-nexo-lime">{editing ? 'Editar perfil' : 'Nuevo deportista'}</p><h2 id="athlete-onboarding-title" className="mt-1 text-xl font-bold text-white">{step === 1 ? 'Datos principales' : step === 2 ? 'Información de contacto' : step === 3 ? 'Foto y datos opcionales' : 'Inscripción y acceso'}</h2><div className="mt-4 flex gap-2">{Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-nexo-lime' : 'bg-slate-700'}`} />)}</div></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Cerrar"><X size={19} /></button></div><form className="flex min-h-0 flex-col" onSubmit={(event: FormEvent) => event.preventDefault()}><div className="max-h-[60dvh] min-h-0 space-y-4 overflow-y-auto p-5 sm:p-6">{step === 1 && <><p className="text-sm text-slate-400">Comencemos con la identidad del deportista.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombres" value={data.first_name} onChange={(value) => setData('first_name', value)} error={errors.first_name} required /><Field label="Apellidos" value={data.last_name} onChange={(value) => setData('last_name', value)} error={errors.last_name} required /></div><SelectField label="Tipo de documento" value={data.document_type} options={documentTypes} onChange={(value) => setData('document_type', value)} error={errors.document_type} /><Field label="Número de documento" value={data.document_number} onChange={(value) => setData('document_number', value)} error={errors.document_number} /><Field label="Fecha de nacimiento" type="date" value={data.birth_date} onChange={(value) => setData('birth_date', value)} error={errors.birth_date} /></>}{step === 2 && <><p className="text-sm text-slate-400">Estos datos permiten enviar el acceso al deportista o su acudiente.</p><Field label="Teléfono" value={data.phone} onChange={(value) => setData('phone', value)} error={errors.phone} /><Field label="Correo electrónico" type="email" value={data.email} onChange={(value) => setData('email', value)} error={errors.email} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Acudiente" value={data.guardian_name} onChange={(value) => setData('guardian_name', value)} error={errors.guardian_name} /><Field label="Teléfono del acudiente" value={data.guardian_phone} onChange={(value) => setData('guardian_phone', value)} error={errors.guardian_phone} /></div></>}{step === 3 && <><p className="text-sm text-slate-400">La foto y los datos físicos son opcionales.</p><PhotoUpload value={data.photo} existing={editing?.photo_url ?? undefined} onChange={(file) => setData('photo', file)} error={errors.photo} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Estatura (cm)" type="number" step="0.01" value={data.height_cm} onChange={(value) => setData('height_cm', value)} error={errors.height_cm} /><Field label="Peso (kg)" type="number" step="0.01" value={data.weight_kg} onChange={(value) => setData('weight_kg', value)} error={errors.weight_kg} /><Field label="Talla de ropa" value={data.shirt_size} onChange={(value) => setData('shirt_size', value)} error={errors.shirt_size} /><Field label="Talla de calzado" value={data.shoe_size} onChange={(value) => setData('shoe_size', value)} error={errors.shoe_size} /></div></>}{step === 4 && <>
        <p className="text-sm text-slate-400">
            {editing
                ? 'Completa o actualiza la inscripción. Si no existe, se creará como pendiente con su primer cargo.'
                : 'Elige una disciplina para inscribir al deportista. Si guardas solo el perfil, puedes inscribirlo después desde Inscripciones.'}
        </p>
        <SelectField
            label="Disciplina"
            value={data.discipline_id}
            options={[
                { id: '', label: editing ? 'Sin selección' : 'Solo perfil' },
                ...disciplines.map((discipline) => ({ id: String(discipline.id), label: discipline.name })),
            ]}
            onChange={(value) => setData('discipline_id', value)}
            error={errors.discipline_id}
        />
        {hasEnrollment && <>
            {!editing && <SelectField
                label="Primer recaudo"
                value={data.initial_charge_mode}
                options={[
                    { id: 'pending', label: 'Dejar cargo pendiente' },
                    { id: 'paid', label: 'Registrar pago recibido ahora' },
                ]}
                onChange={(value) => setData('initial_charge_mode', value)}
                error={errors.initial_charge_mode}
            />}
            {!editing && <p className="text-sm text-slate-400">
                {payNow
                    ? 'Se registrará un pago ya recibido. Hoy será la fecha de inicio de la inscripción y del primer periodo.'
                    : 'El primer cargo queda pendiente en Recaudos. Al confirmar el pago, se activará la inscripción y ese día comenzará el primer periodo.'}
            </p>}
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={payNow || editing ? 'Fecha de inicio' : 'Inicio previsto'} type="date" value={payNow ? today : data.start_date} onChange={updateStartDate} error={errors.start_date} disabled={payNow} required />
                <SelectField label="Periodicidad" value={data.billing_frequency} options={billingFrequencies} onChange={(value) => setData('billing_frequency', value)} error={errors.billing_frequency} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Valor del periodo" type="number" value={data.monthly_amount} onChange={(value) => setData('monthly_amount', value)} error={errors.monthly_amount} required />
                <Field label="Día de vencimiento" type="number" value={payNow && !dueDayOverridden ? String(Number(today.slice(-2))) : data.due_day} onChange={updateDueDay} error={errors.due_day} required />
            </div>
            {payNow && <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                    label="Medio del pago recibido"
                    value={data.payment_method}
                    options={[{ id: 'cash', label: 'Efectivo' }, { id: 'transfer', label: 'Transferencia' }, { id: 'card', label: 'Tarjeta' }]}
                    onChange={(value) => setData('payment_method', value)}
                    error={errors.payment_method}
                />
                <Field label="Referencia (opcional)" value={data.payment_reference} onChange={(value) => setData('payment_reference', value)} error={errors.payment_reference} />
            </div>}
        </>}
    </>}</div><div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-5 sm:p-6"><button type="button" onClick={() => step > 1 ? setStep(step - 1) : close()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800">{step > 1 && <ArrowLeft size={16} />}{step > 1 ? 'Anterior' : 'Cancelar'}</button>{step < totalSteps ? <button type="button" onClick={() => setStep(step + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-nexo-lime px-4 py-2.5 text-sm font-bold text-nexo-ink">Continuar <ArrowRight size={16} /></button> : <button type="button" onClick={submit} disabled={processing} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-nexo-lime px-4 py-2.5 text-sm font-bold text-nexo-ink disabled:opacity-50"><Check size={16} />{processing ? 'Guardando…' : editing ? (!editing.current_enrollment && hasEnrollment ? 'Asociar inscripción y recaudo' : 'Guardar cambios') : createLabel}</button>}</div></form></div></div>;
}

function SelectField({ label, value, options, onChange, error }: { label: string; value: string; options: Array<{ id: string; label: string }>; onChange: (value: string) => void; error?: string }) { const labelId = useId(); return <label className="block text-sm font-semibold text-slate-300"><span id={labelId}>{label}</span><SearchableSelect className="mt-2" value={value} ariaLabelledBy={labelId} options={options} onValueChange={onChange} searchPlaceholder="Buscar..." />{error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}</label>; }
function Field({ label, value, onChange, error, type = 'text', step, disabled = false, required = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; step?: string; disabled?: boolean; required?: boolean }) { if (label.toLowerCase().includes('teléfono')) return <PhoneInputField label={label} value={value} onChange={onChange} error={error} required={required} />; const props = { value, onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value), required, step, disabled }; return <label className="block text-sm font-semibold text-slate-300">{label}{type === 'date' ? <DatePicker {...props} /> : <Input type={type} {...props} />}{error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}</label>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="nexo-card p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-white">{value}</p></div>; }
function Photo({ athlete }: { athlete: Athlete }) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const url = athlete.photo_url;
    if (url && url !== failedUrl) {
        return <img src={url} alt={`Foto de ${athlete.first_name} ${athlete.last_name}`} onError={() => setFailedUrl(url)} className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-slate-700" />;
    }

    return <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexo-lime/15 font-bold text-nexo-lime">
        {athlete.first_name.charAt(0)}{athlete.last_name.charAt(0)}
    </div>;
}

function PhotoUpload({ value, existing, onChange, error }: { value: File | null; existing?: string; onChange: (file: File | null) => void; error?: string }) {
    const [preview, setPreview] = useState<string | undefined>(existing);
    const [failedUrl, setFailedUrl] = useState<string>();
    useEffect(() => {
        if (!value) {
            setPreview(existing);
            return;
        }

        const url = URL.createObjectURL(value);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [value, existing]);

    return <div>
        <label className="group relative flex aspect-square w-full max-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 focus-within:border-nexo-lime">
            <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={existing || value ? 'Cambiar foto' : 'Subir foto'} onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="sr-only" />
            {preview && preview !== failedUrl ? <>
                <img src={preview} alt="Vista previa" onError={() => setFailedUrl(preview)} className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-nexo-ink/90 p-2 text-center text-xs font-semibold text-white">Cambiar foto</span>
            </> : <div className="flex flex-col items-center gap-2 text-center">
                <Camera size={25} className="text-nexo-lime" />
                <span className="text-xs text-slate-400">Subir foto</span>
            </div>}
        </label>
        {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </div>;
}
