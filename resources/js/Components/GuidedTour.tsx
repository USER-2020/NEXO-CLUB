import { router, usePage } from '@inertiajs/react';
import { driver } from 'driver.js';
import { HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { User } from '@/types';

import 'driver.js/dist/driver.css';

type PageProps = { auth: { user: User }; guidedTours?: string[] };

const tours: Record<string, { key: string; title: string; description: string }> = {
    Dashboard: { key: 'dashboard', title: 'Resumen del club', description: 'Consulta los indicadores y la actividad principal de tu club.' },
    'Platform/Dashboard': { key: 'platform-dashboard', title: 'Panel de plataforma', description: 'Supervisa la operación global de NEXO CLUB.' },
    'Platform/Clubs': { key: 'platform-clubs', title: 'Clubes globales', description: 'Administra clubes y sus administradores desde la plataforma.' },
    'Platform/ClubDetails': { key: 'platform-club-details', title: 'Detalle del club', description: 'Revisa la configuración, miembros y estado del club seleccionado.' },
    'Platform/AuditLogs': { key: 'platform-audit', title: 'Auditoría', description: 'Consulta las operaciones realizadas y su trazabilidad.' },
    'Athletes/Index': { key: 'athletes', title: 'Deportistas', description: 'Gestiona perfiles, estado e inscripciones de los deportistas.' },
    'Enrollments/Index': { key: 'enrollments', title: 'Inscripciones', description: 'Asocia deportistas, disciplinas, tarifas y estados de inscripción.' },
    'Memberships/Index': { key: 'memberships', title: 'Mensualidades', description: 'Consulta cargos, registra pagos y revisa comprobantes.' },
    'Clubs/Index': { key: 'clubs', title: 'Configuración del club', description: 'Administra la información, disciplinas y medios de pago del club.' },
    'Disciplines/Index': { key: 'disciplines', title: 'Disciplinas', description: 'Configura las disciplinas disponibles para tus inscripciones.' },
    'ClubMembers/Index': { key: 'club-members', title: 'Equipo y permisos', description: 'Gestiona las personas que operan dentro del club.' },
    'Athletes/Portal': { key: 'athlete-portal', title: 'Mi portal', description: 'Consulta tu perfil, inscripciones, pagos e indicadores.' },
    'Athletes/Payments': { key: 'athlete-payments', title: 'Mis pagos', description: 'Revisa tus mensualidades y envía comprobantes al club.' },
    'Profile/Edit': { key: 'profile', title: 'Mi perfil', description: 'Actualiza tus datos personales y la seguridad de tu cuenta.' },
    'FlowDocumentation/Index': { key: 'documentation', title: 'Centro de documentación', description: 'Encuentra los flujos visuales disponibles para tu rol.' },
};

export default function GuidedTour() {
    const { component, props } = usePage<PageProps>();
    const tour = useMemo(() => tours[component], [component]);
    const activeDriver = useRef<ReturnType<typeof driver> | null>(null);
    const autoStartedTour = useRef<string | null>(null);
    const completedTours = props.guidedTours ?? [];
    const isRoleDashboard = ['Dashboard', 'Platform/Dashboard', 'Athletes/Portal'].includes(component);

    useEffect(() => () => { activeDriver.current?.destroy(); activeDriver.current = null; }, [component]);

    const start = useCallback(() => {
        if (!tour) return;
        const visibleTarget = (name: string) => Array.from(document.querySelectorAll(`[data-tour="${name}"]`)).find((element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; });
        const steps = [
            { element: visibleTarget('module-nav'), popover: { title: 'Módulo activo', description: `Estás en ${tour.title}. Desde la navegación puedes cambiar de módulo.` } },
            { element: visibleTarget('module-header'), popover: { title: tour.title, description: tour.description } },
            { element: visibleTarget('module-content'), popover: { title: 'Área de trabajo', description: 'Aquí encontrarás la información, acciones y estados propios de este módulo.' } },
        ].filter((step) => step.element);

        if (!steps.length) return;
        const tourDriver = driver({
            showProgress: true,
            steps,
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Finalizar',
            progressText: '{{current}} de {{total}}',
            onDestroyed: (_element, _step, options) => {
                if (options.reason === 'done' && !completedTours.includes(tour.key)) router.post(route('guided-tours.complete', tour.key), {}, { preserveScroll: true, preserveState: true });
                activeDriver.current = null;
            },
        });
        activeDriver.current = tourDriver;
        tourDriver.drive();
    }, [completedTours, tour]);

    useEffect(() => {
        if (!tour || !isRoleDashboard || completedTours.includes(tour.key) || autoStartedTour.current === tour.key) return;

        autoStartedTour.current = tour.key;
        const timeout = window.setTimeout(start, 350);

        return () => window.clearTimeout(timeout);
    }, [completedTours, isRoleDashboard, start, tour]);

    if (!tour) return null;

    return <button type="button" onClick={start} className="group fixed bottom-20 right-4 z-[60] inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-nexo-lime/50 bg-nexo-lime text-nexo-ink shadow-lime transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-nexo-lime focus:ring-offset-2 focus:ring-offset-nexo-ink lg:bottom-6 lg:right-6" aria-label={`Activar visita guiada de ${tour.title}`}><HelpCircle size={21} /><span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-lg bg-nexo-surface px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-visible:opacity-100">Visita guiada</span></button>;
}
