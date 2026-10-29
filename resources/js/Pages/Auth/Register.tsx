import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { PhoneInputField } from '@/Components/ui/phone-input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type FormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    club_name: string;
    club_email: string;
    club_phone: string;
    club_address: string;
    club_city: string;
    club_timezone: string;
};

export default function Register() {
    const [step, setStep] = useState(1);
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        name: '', email: '', password: '', password_confirmation: '',
        club_name: '', club_email: '', club_phone: '', club_address: '', club_city: '', club_timezone: 'America/Bogota',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (step < 5) {
            setStep((current) => current + 1);
            return;
        }
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const canContinue = () => {
        if (step === 1) return Boolean(data.name && data.email);
        if (step === 2) return Boolean(data.password && data.password_confirmation && data.password === data.password_confirmation);
        if (step === 3) return Boolean(data.club_name && data.club_email);
        if (step === 4) return Boolean(data.club_phone && data.club_address && data.club_city);
        return true;
    };

    return <GuestLayout>
        <Head title="Solicitar registro de club" />
        <div className="mb-4">
            <p className="nexo-eyebrow text-nexo-lime">Solicitud de club</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Registra tu club en NEXO</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Completa los pasos para enviar tu solicitud. Un superadmin revisará la información antes de activar el acceso.</p>
        </div>

        <div className="mb-5 flex min-w-0 gap-2" role="progressbar" aria-label={`Progreso del registro: paso ${step} de 5`} aria-valuemin={1} aria-valuemax={5} aria-valuenow={step}>
            {[1, 2, 3, 4, 5].map((item) => <span key={item} className={`h-2 min-w-0 flex-1 rounded-full transition-colors ${item <= step ? 'bg-nexo-lime shadow-lime' : 'bg-slate-800'}`} />)}
        </div>

        <form onSubmit={submit} className="space-y-5">
            {step === 1 && <section className="space-y-3">
                <StepTitle eyebrow="Paso 1 de 5" title="Identifica tu acceso" description="Comencemos con los datos de la persona responsable." />
                <Field id="name" label="Nombre completo" value={data.name} onChange={(value) => setData('name', value)} error={errors.name} required />
                <Field id="email" label="Correo electrónico" type="email" value={data.email} onChange={(value) => setData('email', value)} error={errors.email} required />
            </section>}

            {step === 2 && <section className="space-y-3">
                <StepTitle eyebrow="Paso 2 de 5" title="Protege tu cuenta" description="Define la contraseña que usarás cuando tu club sea aprobado." />
                <Field id="password" label="Contraseña" type="password" value={data.password} onChange={(value) => setData('password', value)} error={errors.password} required />
                <Field id="password_confirmation" label="Confirmar contraseña" type="password" value={data.password_confirmation} onChange={(value) => setData('password_confirmation', value)} error={errors.password_confirmation} required />
                {data.password && data.password_confirmation && data.password !== data.password_confirmation && <p className="text-xs text-red-300">Las contraseñas no coinciden.</p>}
            </section>}

            {step === 3 && <section className="space-y-3">
                <StepTitle eyebrow="Paso 3 de 5" title="Identifica tu club" description="Estos son los datos principales que revisará nuestro equipo." />
                <Field id="club_name" label="Nombre del club" value={data.club_name} onChange={(value) => setData('club_name', value)} error={errors.club_name} required />
                <Field id="club_email" label="Correo del club" type="email" value={data.club_email} onChange={(value) => setData('club_email', value)} error={errors.club_email} required />
            </section>}

            {step === 4 && <section className="space-y-3">
                <StepTitle eyebrow="Paso 4 de 5" title="Añade contacto y ubicación" description="Ayúdanos a identificar y contactar tu club." />
                <PhoneInputField label="Teléfono del club" value={data.club_phone} onChange={(value) => setData('club_phone', value)} error={errors.club_phone} required />
                <Field id="club_address" label="Dirección" value={data.club_address} onChange={(value) => setData('club_address', value)} error={errors.club_address} required />
                <Field id="club_city" label="Ciudad" value={data.club_city} onChange={(value) => setData('club_city', value)} error={errors.club_city} required />
            </section>}

            {step === 5 && <section className="space-y-3">
                <StepTitle eyebrow="Paso 5 de 5" title="Revisa tu solicitud" description="Confirma que la información esté correcta antes de enviarla." />
                <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm">
                    <Summary title="Tu acceso" rows={[["Nombre", data.name], ["Correo", data.email]]} />
                    <Summary title="Tu club" rows={[["Nombre", data.club_name], ["Correo", data.club_email], ["Teléfono", data.club_phone], ["Ubicación", `${data.club_address}, ${data.club_city}`]]} />
                </div>
                <div className="flex gap-3 rounded-2xl border border-nexo-lime/20 bg-nexo-lime/5 p-4 text-sm text-slate-300"><ShieldCheck className="shrink-0 text-nexo-lime" size={20} /><p>Al enviar, tu cuenta quedará pendiente. Recibirás un correo de confirmación y otro cuando el superadmin active tu club.</p></div>
            </section>}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                {step === 1 ? <Link href={route('login')} className="text-sm text-slate-400 underline transition hover:text-white">¿Ya tienes una cuenta?</Link> : <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"><ArrowLeft size={16} /> Anterior</button>}
                <PrimaryButton disabled={processing || !canContinue()}>{processing ? 'Enviando…' : step === 5 ? 'Enviar solicitud' : <>Continuar <ArrowRight size={16} /></>}</PrimaryButton>
            </div>
        </form>
    </GuestLayout>;
}

function StepTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
    return <div className="mb-3"><p className="nexo-eyebrow text-nexo-lime">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-white">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-400">{description}</p></div>;
}

function Summary({ title, rows }: { title: string; rows: string[][] }) {
    return <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p><div className="space-y-2">{rows.map(([label, value]) => <div key={label} className="flex flex-col gap-0.5 border-b border-slate-800 pb-2 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4"><span className="text-slate-500">{label}</span><span className="break-all text-right font-semibold text-slate-200">{value}</span></div>)}</div></div>;
}

function Field({ id, label, value, onChange, error, type = 'text', required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; required?: boolean }) {
    return <div><InputLabel htmlFor={id} value={label} /><TextInput id={id} name={id} type={type} value={value} className="mt-1 block w-full" onChange={(event) => onChange(event.target.value)} required={required} /><InputError message={error} className="mt-2" /></div>;
}
