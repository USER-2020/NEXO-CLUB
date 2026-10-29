import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';

export type Operation = 'athlete' | 'enrollment' | 'club' | 'club_application' | 'discipline' | 'member' | 'payment_method' | 'payment_submission';

const messages: Record<Operation, { create: string[]; update: string[] }> = {
    athlete: {
        create: ['Creando deportista', 'Asociando datos personales y físicos', 'Activando deportista'],
        update: ['Actualizando deportista', 'Guardando cambios del perfil', 'Sincronizando información'],
    },
    enrollment: {
        create: ['Creando inscripción', 'Asociando deportista y disciplina', 'Activando inscripción'],
        update: ['Actualizando inscripción', 'Guardando condiciones de mensualidad', 'Sincronizando estado'],
    },
    club: {
        create: ['Creando club', 'Asociando administrador y configuración', 'Activando espacio deportivo'],
        update: ['Actualizando club', 'Guardando información del espacio', 'Sincronizando configuración'],
    },
    club_application: {
        create: ['Registrando solicitud del club', 'Protegiendo los datos de acceso', 'Enviando solicitud para revisión'],
        update: ['Actualizando solicitud', 'Guardando información del club', 'Sincronizando revisión'],
    },
    discipline: {
        create: ['Creando disciplina', 'Asociando configuración al club', 'Activando disciplina'],
        update: ['Actualizando disciplina', 'Guardando cambios', 'Sincronizando disponibilidad'],
    },
    member: {
        create: ['Creando usuario', 'Asociando permisos al club', 'Activando acceso'],
        update: ['Actualizando usuario', 'Guardando permisos', 'Sincronizando acceso'],
    },
    payment_method: {
        create: ['Registrando medio de pago', 'Protegiendo los datos bancarios', 'Activando medio para pagos'],
        update: ['Actualizando medio de pago', 'Protegiendo los datos bancarios', 'Sincronizando disponibilidad'],
    },
    payment_submission: {
        create: ['Registrando comprobante', 'Protegiendo el archivo enviado', 'Enviando comprobante para revisión'],
        update: ['Actualizando comprobante', 'Guardando revisión', 'Sincronizando estado'],
    },
};

export function OperationProgressModal({ operation }: { operation: Operation }) {
    const [phase, setPhase] = useState(0);
    const steps = messages[operation].create;

    useEffect(() => {
        // Cada etapa permanece visible cinco segundos para que el usuario pueda
        // leer el paso completo. El último paso no se corta al finalizar la petición.
        const timer = window.setInterval(() => setPhase((current) => Math.min(current + 1, steps.length - 1)), 5000);
        return () => window.clearInterval(timer);
    }, [steps.length]);

    const progress = ((phase + 1) / steps.length) * 100;

    return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-nexo-ink/90 p-0 backdrop-blur-md sm:items-center sm:p-4" role="status" aria-live="polite" aria-label={steps[phase]}>
        <div className="w-full max-w-lg rounded-t-[2rem] border border-slate-700 bg-nexo-surface p-6 text-center shadow-2xl shadow-black/60 sm:rounded-3xl sm:p-9">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-600 sm:hidden" />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-nexo-lime/10 text-nexo-lime shadow-lime">
                <LoaderCircle size={32} className="animate-spin" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-nexo-lime">Paso {phase + 1} de {steps.length}</p>
            <p className="mt-2 text-2xl font-bold text-white">{steps[phase]}</p>
            <p className="mt-2 text-sm text-slate-400">Estamos procesando la información. No cierres esta ventana.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-nexo-lime shadow-lime transition-all duration-700" style={{ width: `${progress}%` }} /></div>
            <div className="mt-6 space-y-2 text-left">
                {steps.map((step, index) => <div key={step} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${index < phase ? 'text-emerald-300' : index === phase ? 'bg-slate-900/70 text-white' : 'text-slate-600'}`}>
                    {index < phase ? <CheckCircle2 size={16} /> : <span className={`h-2 w-2 rounded-full ${index === phase ? 'bg-nexo-lime' : 'bg-slate-700'}`} />}
                    <span>{step}</span>
                </div>)}
            </div>
        </div>
    </div>;
}

export function GlobalOperationProgressModal() {
    const [operation, setOperation] = useState<{ type: Operation } | null>(null);
    const startedAtRef = useRef<number | null>(null);
    const finishTimerRef = useRef<number | null>(null);
    // La respuesta del servidor puede ser rápida, pero el modal debe mostrar
    // Las tres etapas completas se muestran durante al menos 16 segundos. Esto
    // deja el tercer paso visible antes de cerrar el modal y mostrar el Toast.
    const minimumDuration = 16000;

    useEffect(() => {
        const detectOperation = (): Operation | null => {
            const path = window.location.pathname;
            if (path.includes('/athletes')) return 'athlete';
            if (path.includes('/enrollments')) return 'enrollment';
            if (path.endsWith('/register') || path === '/register') return 'club_application';
            if (path.includes('/disciplines')) return 'discipline';
            if (path.includes('/club-members')) return 'member';
            if (path.includes('/clubs') || path.includes('/platform')) return 'club';
            if (path.includes('/mi-dashboard/mensualidades')) return 'payment_submission';
            return null;
        };
        const handleSubmit = (event: Event) => {
            const submitter = (event as SubmitEvent).submitter as HTMLElement | null;
            const label = submitter?.textContent?.toLowerCase() ?? '';
            const type = label.includes('agregar medio de pago') ? 'payment_method' : detectOperation();
            if (!type) return;
            const finalLabels: Record<Operation, string[]> = {
                athlete: ['crear deportista', 'asociar inscripción y recaudo'],
                enrollment: ['crear inscripción'],
                club: ['crear club', 'crear club y acceso'],
                club_application: ['enviar solicitud'],
                discipline: ['crear disciplina'],
                member: ['agregar al club'],
                payment_method: ['agregar medio de pago'],
                payment_submission: ['enviar comprobante'],
            };
            const isFinalSubmit = finalLabels[type].some((finalLabel) => label.includes(finalLabel));

            // El loader es exclusivo para INSERT/asociaciones nuevas. Los submits
            // de edición, eliminación o cambio de estado continúan con Toast.
            if (!isFinalSubmit) {
                if (type === 'athlete' || type === 'enrollment') {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return;
            }

            startedAtRef.current = Date.now();
            setOperation({ type });
            document.dispatchEvent(new CustomEvent('nexo:operation-start'));
        };
        const handleFinish = () => {
            const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : minimumDuration;
            const remaining = Math.max(0, minimumDuration - elapsed);
            if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
            finishTimerRef.current = window.setTimeout(() => {
                setOperation(null);
                startedAtRef.current = null;
                document.dispatchEvent(new CustomEvent('nexo:operation-complete'));
            }, remaining);
        };

        const removeFinishListener = router.on('finish', handleFinish);
        const removeErrorListener = router.on('error', handleFinish);
        const removeExceptionListener = router.on('exception', handleFinish);
        document.addEventListener('submit', handleSubmit, true);

        return () => {
            if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
            removeFinishListener();
            removeErrorListener();
            removeExceptionListener();
            document.removeEventListener('submit', handleSubmit, true);
        };
    }, []);

    return operation ? <OperationProgressModal operation={operation.type} /> : null;
}
