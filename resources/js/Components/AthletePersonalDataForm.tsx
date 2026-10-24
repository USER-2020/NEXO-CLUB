import PrimaryButton from '@/Components/PrimaryButton';
import { DatePicker } from '@/Components/ui/date-picker';
import { Input } from '@/Components/ui/input';
import { PhoneInputField } from '@/Components/ui/phone-input';
import { useForm } from '@inertiajs/react';
import { Save, UserRound } from 'lucide-react';

type AthletePersonalData = {
    first_name: string;
    last_name: string;
    document_number?: string | null;
    birth_date?: string | null;
    height_cm?: string | number | null;
    weight_kg?: string | number | null;
    shirt_size?: string | null;
    shoe_size?: string | null;
    phone?: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
};

export default function AthletePersonalDataForm({ athlete }: { athlete: AthletePersonalData }) {
    const form = useForm({
        first_name: athlete.first_name ?? '',
        last_name: athlete.last_name ?? '',
        document_number: athlete.document_number ?? '',
        birth_date: athlete.birth_date ?? '',
        height_cm: athlete.height_cm?.toString() ?? '',
        weight_kg: athlete.weight_kg?.toString() ?? '',
        shirt_size: athlete.shirt_size ?? '',
        shoe_size: athlete.shoe_size ?? '',
        phone: athlete.phone ?? '',
        guardian_name: athlete.guardian_name ?? '',
        guardian_phone: athlete.guardian_phone ?? '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.patch(route('athlete.profile.update'), { preserveScroll: true });
    };

    return <form onSubmit={submit} className="nexo-card p-5 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
            <div><p className="nexo-eyebrow">Mi información</p><h2 className="mt-1 text-xl font-bold">Datos personales</h2><p className="mt-1 text-sm text-slate-400">Puedes actualizar tus datos. El correo de acceso se administra de forma segura.</p></div>
            <UserRound className="text-nexo-lime" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombres" value={form.data.first_name} onChange={(value) => form.setData('first_name', value)} error={form.errors.first_name} />
            <Field label="Apellidos" value={form.data.last_name} onChange={(value) => form.setData('last_name', value)} error={form.errors.last_name} />
            <Field label="Documento" value={form.data.document_number} onChange={(value) => form.setData('document_number', value)} error={form.errors.document_number} />
            <DateField label="Fecha de nacimiento" value={form.data.birth_date} onChange={(value) => form.setData('birth_date', value)} error={form.errors.birth_date} />
            <PhoneInputField label="Teléfono" value={form.data.phone} onChange={(value) => form.setData('phone', value)} error={form.errors.phone} />
            <Field label="Acudiente" value={form.data.guardian_name} onChange={(value) => form.setData('guardian_name', value)} error={form.errors.guardian_name} />
            <PhoneInputField label="Teléfono del acudiente" value={form.data.guardian_phone} onChange={(value) => form.setData('guardian_phone', value)} error={form.errors.guardian_phone} />
        </div>
        <div className="mt-7 border-t border-slate-800 pt-6">
            <div className="mb-4"><p className="nexo-eyebrow">Información opcional</p><p className="mt-1 text-sm text-slate-400">Puedes completar o actualizar tus datos físicos cuando quieras.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
                <Field label="Estatura (cm)" type="number" step="0.01" value={form.data.height_cm} onChange={(value) => form.setData('height_cm', value)} error={form.errors.height_cm} />
                <Field label="Peso (kg)" type="number" step="0.01" value={form.data.weight_kg} onChange={(value) => form.setData('weight_kg', value)} error={form.errors.weight_kg} />
                <Field label="Talla de ropa" value={form.data.shirt_size} onChange={(value) => form.setData('shirt_size', value)} error={form.errors.shirt_size} />
                <Field label="Talla de calzado" value={form.data.shoe_size} onChange={(value) => form.setData('shoe_size', value)} error={form.errors.shoe_size} />
            </div>
        </div>
        <div className="mt-6 flex justify-end"><PrimaryButton type="submit" disabled={form.processing} className="gap-2"><Save size={17} />{form.processing ? 'Guardando...' : 'Guardar cambios'}</PrimaryButton></div>
    </form>;
}

function Field({ label, value, onChange, error, type = 'text', step }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; step?: string }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">{label}</span><Input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} />{error && <span className="mt-1 block text-xs text-red-300">{error}</span>}</label>; }
function DateField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">{label}</span><DatePicker value={value} onChange={(event) => onChange(String(event.target.value ?? ''))} />{error && <span className="mt-1 block text-xs text-red-300">{error}</span>}</label>; }
