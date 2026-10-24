import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReceiptUpload from '@/Components/ReceiptUpload';
import { DatePicker } from '@/Components/ui/date-picker';
import { Input } from '@/Components/ui/input';
import { SearchableSelect } from '@/Components/ui/searchable-select';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, CreditCard, Download, FileCheck2, Upload, XCircle } from 'lucide-react';
import { formatAppDate } from '@/lib/dates';

type Method = { id: number; type: string; label: string; provider?: string | null; account_type?: string | null; account_number?: string | null; account_holder?: string | null; key_type?: string | null; notes?: string | null };
type Submission = { id: number; status: string; rejection_reason?: string | null } | null;
type Charge = { id: number; period: string; due_date: string; amount: number; status: string; discipline?: string | null; payment_submission?: Submission };
type Payment = { id: number; amount: number; method?: string | null; paid_at?: string | null; period?: string | null };

const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
const typeLabel = (type: string) => type === 'bank_account' ? 'Cuenta bancaria' : type === 'nequi' ? 'Nequi' : type === 'bre_b' ? 'Bre-B' : 'Llave de pago';

export default function Payments({ charges, payments, paymentMethods }: { charges: Charge[]; payments: Payment[]; paymentMethods: Method[] }) {
    const pending = charges.filter((charge) => charge.status !== 'paid');

    return <AuthenticatedLayout header={<div><p className="nexo-eyebrow">Mi cuenta</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Mis pagos</h1></div>}>
        <Head title="Mis pagos" />
        <section className="mx-auto max-w-[1280px] space-y-6">
            <div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mis pagos</p><p className="mt-2 text-sm text-slate-400">Consulta tus mensualidades, fechas de vencimiento y envía comprobantes al club.</p></div>
            <div className="grid gap-4 sm:grid-cols-3"><Summary icon={Clock3} label="Por pagar" value={pending.length} /><Summary icon={CreditCard} label="Medios activos" value={paymentMethods.length} /><Summary icon={CheckCircle2} label="Pagos registrados" value={payments.length} /></div>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="nexo-card overflow-hidden"><div className="border-b border-slate-800 p-6"><p className="nexo-eyebrow">Mensualidades</p><h2 className="mt-1 text-xl font-bold">Cargos y comprobantes</h2></div>{charges.length ? <div className="divide-y divide-slate-800">{charges.map((charge) => <div key={charge.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{charge.discipline ?? 'Mensualidad'}</p><p className="mt-1 text-sm text-slate-500">Periodo {formatAppDate(charge.period)} · vence {formatAppDate(charge.due_date)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${charge.status === 'paid' ? 'bg-emerald-400/10 text-emerald-300' : charge.payment_submission?.status === 'pending' ? 'bg-sky-400/10 text-sky-300' : charge.payment_submission?.status === 'rejected' ? 'bg-red-400/10 text-red-300' : 'bg-amber-400/10 text-amber-300'}`}>{charge.status === 'paid' ? 'Pagada' : charge.payment_submission?.status === 'pending' ? 'En revisión' : charge.payment_submission?.status === 'rejected' ? 'Rechazada' : 'Pendiente'}</span></div><p className="mt-3 text-lg font-bold">{money(charge.amount)}</p>{charge.payment_submission?.status === 'rejected' && <p className="mt-2 text-sm text-red-300">{charge.payment_submission.rejection_reason ?? 'Puedes enviar un nuevo comprobante.'}</p>}{charge.status !== 'paid' && <ReceiptForm charge={charge} methods={paymentMethods} submission={charge.payment_submission} />}</div>)}</div> : <div className="p-10 text-center text-sm text-slate-500">No tienes mensualidades generadas.</div>}</div>
                <div className="space-y-6"><div className="nexo-card overflow-hidden"><div className="border-b border-slate-800 p-6"><p className="nexo-eyebrow">Cómo pagar</p><h2 className="mt-1 text-xl font-bold">Medios del club</h2></div>{paymentMethods.length ? <div className="divide-y divide-slate-800">{paymentMethods.map((method) => <div key={method.id} className="p-5"><p className="font-semibold">{method.label}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-nexo-lime">{typeLabel(method.type)}</p>{method.provider && <p className="mt-2 text-sm text-slate-300">{method.provider}</p>}{method.account_type && <p className="text-sm text-slate-400">{method.account_type === 'checking' ? 'Cuenta corriente' : 'Cuenta de ahorros'}</p>}{(method.account_number || method.key_type) && <p className="text-sm text-slate-300">{method.account_number ?? method.key_type}</p>}{method.account_holder && <p className="mt-2 text-xs text-slate-500">Titular: {method.account_holder}</p>}{method.notes && <p className="mt-2 text-xs text-slate-500">{method.notes}</p>}</div>)}</div> : <p className="p-6 text-sm text-slate-500">El club aún no ha configurado medios de pago.</p>}</div><div className="nexo-card overflow-hidden"><div className="border-b border-slate-800 p-6"><p className="nexo-eyebrow">Historial</p><h2 className="mt-1 text-xl font-bold">Pagos registrados</h2></div>{payments.length ? <div className="divide-y divide-slate-800">{payments.map((payment) => <div key={payment.id} className="p-5"><p className="font-semibold">{money(payment.amount)}</p><p className="mt-1 text-xs text-slate-500">Periodo {payment.period ? formatAppDate(payment.period) : '—'} · {payment.paid_at ? formatAppDate(payment.paid_at) : '—'} · {payment.method ?? 'Pago registrado'}</p></div>)}</div> : <p className="p-10 text-center text-sm text-slate-500">Todavía no hay pagos registrados.</p>}</div></div>
            </div>
        </section>
    </AuthenticatedLayout>;
}

function ReceiptForm({ charge, methods, submission }: { charge: Charge; methods: Method[]; submission?: Submission }) {
    const form = useForm<{ payment_method_id: string; reference: string; receipt: File | null }>({ payment_method_id: methods[0]?.id?.toString() ?? '', reference: '', receipt: null });
    const submit = (event: React.FormEvent) => { event.preventDefault(); form.post(route('athlete.payment-submissions.store', charge.id), { forceFormData: true, preserveScroll: true }); };
    if (submission?.status === 'pending') return <p className="mt-4 flex items-center gap-2 text-sm text-sky-300"><FileCheck2 size={16} />Comprobante enviado; pendiente de revisión.</p>;
    if (!methods.length) return <p className="mt-4 text-sm text-slate-500">No hay medios de pago configurados.</p>;
    return <form onSubmit={submit} className="mt-5 space-y-4 border-t border-slate-800 pt-5"><SearchableSelect value={form.data.payment_method_id} options={methods.map((method) => ({ id: method.id, label: method.label }))} onValueChange={(value) => form.setData('payment_method_id', value)} searchPlaceholder="Buscar medio de pago..." /><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Referencia (opcional)</span><Input value={form.data.reference} onChange={(event) => form.setData('reference', event.target.value)} />{form.errors.reference && <span className="mt-1 block text-xs text-red-300">{form.errors.reference}</span>}</label><ReceiptUpload value={form.data.receipt} onChange={(file) => form.setData('receipt', file)} error={form.errors.receipt} /><button type="submit" disabled={form.processing || !form.data.receipt} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-nexo-lime px-4 py-2 text-xs font-bold text-nexo-ink disabled:opacity-50"><Upload size={15} />{form.processing ? 'Enviando...' : 'Enviar comprobante'}</button></form>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: number }) { return <div className="nexo-card flex items-center gap-4 p-5"><div className="rounded-2xl bg-nexo-lime/10 p-3 text-nexo-lime"><Icon size={20} /></div><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div></div>; }
