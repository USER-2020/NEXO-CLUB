import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock3, Mail } from 'lucide-react';

export default function RegistrationSubmitted({ applicantName, email, clubName, emailVerified }: { applicantName?: string | null; email?: string | null; clubName?: string | null; emailVerified?: boolean }) {
    return <GuestLayout>
        <Head title="Solicitud recibida" />
        <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-nexo-lime/15 text-nexo-lime shadow-lime"><CheckCircle2 size={34} /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-nexo-lime">Solicitud recibida</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">¡Gracias por confiar en NEXO!</h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">{applicantName ? `Hola ${applicantName}, ` : ''}recibimos correctamente la solicitud para <strong className="text-slate-200">{clubName || 'tu club'}</strong>.</p>
        </div>

        <div className="mt-7 space-y-3">
            <div className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-left"><Clock3 className="mt-0.5 shrink-0 text-nexo-lime" size={20} /><div><p className="font-semibold text-slate-200">Tu cuenta está en revisión</p><p className="mt-1 text-sm leading-5 text-slate-400">Nuestro equipo validará la información del club antes de habilitar el acceso.</p></div></div>
            <div className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-left"><Mail className="mt-0.5 shrink-0 text-nexo-lime" size={20} /><div><p className="font-semibold text-slate-200">{emailVerified ? 'Correo confirmado' : 'Confirma tu correo'}</p><p className="mt-1 text-sm leading-5 text-slate-400">{emailVerified ? 'Tu correo ya fue validado. Ahora el superadmin podrá revisar y aprobar tu solicitud.' : email ? <>Revisa <strong className="text-slate-200">{email}</strong> y abre el enlace de confirmación. Si no lo ves, revisa spam.</> : 'Te enviaremos un enlace para confirmar tu correo electrónico.'}</p></div></div>
        </div>

        <div className="mt-7 border-t border-slate-800 pt-6 text-center"><p className="text-sm text-slate-500">Puedes cerrar esta ventana. Cuando tu cuenta sea aprobada podrás ingresar a tu club.</p><Link href={route('login')} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-nexo-lime hover:text-nexo-lime">Ir a iniciar sesión <ArrowRight size={16} /></Link></div>
    </GuestLayout>;
}
