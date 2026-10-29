import { router, usePage } from '@inertiajs/react';
import { driver } from 'driver.js';
import { HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { User } from '@/types';

import 'driver.js/dist/driver.css';

type PageProps = { auth: { user: User }; guidedTours?: string[] };
type TourStep = { target: string; title: string; description: string };

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

const flowSteps: Record<string, TourStep[]> = {
    Dashboard: [
        { target: 'dashboard-kpis', title: 'Indicadores del club', description: 'Consulta aquí los deportistas, inscripciones y cobros que requieren atención.' },
        { target: 'dashboard-action', title: 'Siguiente acción', description: 'Usa esta acción para completar la configuración inicial del club.' },
    ],
    'Platform/Dashboard': [
        { target: 'platform-metrics', title: 'Indicadores globales', description: 'Supervisa la cantidad de clubes, usuarios y actividad de toda la plataforma.' },
        { target: 'platform-clubs-link', title: 'Gestionar clubes', description: 'Desde aquí puedes revisar solicitudes y administrar clubes y administradores.' },
    ],
    'Platform/Clubs': [
        { target: 'platform-applications', title: 'Solicitudes pendientes', description: 'Revisa y aprueba solicitudes verificadas para crear el club y activar a su administrador.' },
        { target: 'platform-clubs-list', title: 'Clubes registrados', description: 'Consulta el estado de los clubes y abre su detalle operativo.' },
        { target: 'platform-create-club', title: 'Crear club', description: 'Crea un club y su administrador principal cuando el flujo corresponda.' },
    ],
    'Platform/ClubDetails': [
        { target: 'platform-club-summary', title: 'Detalle del club', description: 'Consulta la información y el estado del club seleccionado.' },
        { target: 'platform-club-members', title: 'Administradores', description: 'Revisa los administradores asociados al club y retira accesos cuando corresponda.' },
        { target: 'platform-add-admin', title: 'Agregar administrador', description: 'Crea o vincula un administrador al club desde este formulario.' },
    ],
    'Platform/AuditLogs': [
        { target: 'audit-history', title: 'Historial auditable', description: 'Consulta accesos y operaciones con actor, club, fecha y detalle del cambio.' },
    ],
    'Athletes/Index': [
        { target: 'athletes-create', title: 'Crear deportista', description: 'Inicia el registro del perfil permanente del deportista y, si corresponde, su inscripción.' },
        { target: 'athletes-list', title: 'Perfiles del club', description: 'Consulta perfiles, estado, disciplina y acceso de cada deportista.' },
        { target: 'athletes-form', title: 'Formulario guiado', description: 'El modal organiza los datos personales, contacto, información física e inscripción.' },
    ],
    'Enrollments/Index': [
        { target: 'enrollments-create', title: 'Crear inscripción', description: 'Asocia un deportista con una disciplina y configura sus condiciones de cobro.' },
        { target: 'enrollments-list', title: 'Ciclo de inscripción', description: 'Consulta el estado y las fechas de cada inscripción del club.' },
        { target: 'enrollment-billing', title: 'Periodicidad y valor', description: 'Define la fecha de inicio, periodicidad, valor del período y día de vencimiento.' },
    ],
    'Memberships/Index': [
        { target: 'billing-charges', title: 'Cargos del club', description: 'Consulta los cobros pendientes, vencidos y pagados de las inscripciones activas.' },
        { target: 'billing-payment', title: 'Registrar pago', description: 'Registra el pago recibido y reactiva una inscripción pendiente o suspendida cuando corresponda.' },
        { target: 'billing-submissions', title: 'Comprobantes', description: 'Revisa los comprobantes enviados por los deportistas y decide si aprobarlos o rechazarlos.' },
    ],
    'Clubs/Index': [
        { target: 'clubs-list', title: 'Club activo', description: 'Consulta los clubes disponibles y reconoce cuál está activo para la operación.' },
        { target: 'club-settings', title: 'Configuración del club', description: 'Actualiza la información visible del club y su zona horaria.' },
        { target: 'club-payment-methods', title: 'Medios de pago', description: 'Registra cuentas, Nequi, Bre-B o llaves para que los deportistas sepan dónde pagar.' },
    ],
    'Disciplines/Index': [
        { target: 'disciplines-list', title: 'Disciplinas disponibles', description: 'Las disciplinas activas aparecen como opciones al crear inscripciones.' },
        { target: 'discipline-form', title: 'Crear o editar disciplina', description: 'Registra el nombre y la descripción; luego puedes activar o desactivar la disciplina.' },
    ],
    'ClubMembers/Index': [
        { target: 'members-list', title: 'Equipo del club', description: 'Consulta los usuarios operativos y sus estados y roles.' },
        { target: 'member-create', title: 'Agregar miembro', description: 'Crea o vincula un usuario operativo y asigna su rol dentro del club.' },
    ],
    'Athletes/Portal': [
        { target: 'athlete-portal-summary', title: 'Tu portal', description: 'Consulta tu información personal, estado de acceso e indicadores disponibles.' },
        { target: 'athlete-portal-enrollments', title: 'Tus inscripciones', description: 'Revisa la vigencia, cargos y estado de pago de tus inscripciones.' },
    ],
    'Athletes/Payments': [
        { target: 'athlete-payments-charges', title: 'Cargos y comprobantes', description: 'Selecciona una mensualidad pendiente para revisar su vencimiento y enviar el comprobante.' },
        { target: 'athlete-payment-upload', title: 'Enviar comprobante', description: 'Selecciona el medio usado, agrega una referencia opcional y adjunta el comprobante.' },
    ],
    'Profile/Edit': [
        { target: 'profile-form', title: 'Datos personales', description: 'Actualiza tu nombre, correo y contraseña desde tu perfil.' },
    ],
    'FlowDocumentation/Index': [
        { target: 'documentation-filters', title: 'Filtrar flujos', description: 'Busca la guía por rol o módulo usando los filtros disponibles.' },
        { target: 'documentation-video', title: 'Recorrido visual', description: 'Reproduce el video general o el recorrido individual cuando ya esté publicado.' },
    ],
};

const textTargets: Record<string, string> = {
    'dashboard-action': 'Configurar club',
    'platform-clubs-link': 'Gestionar clubes',
    'platform-create-club': 'Crear club',
    'athletes-create': 'Crear deportista',
    'enrollments-create': 'Crear inscripción',
    'billing-payment': 'Registrar pago',
    'club-payment-methods': 'Agregar medio de pago',
    'member-create': 'Agregar al club',
};

const selectorTargets: Record<string, string> = {
    'dashboard-kpis': 'main section > div:nth-child(2)',
    'platform-metrics': 'main section > div:nth-child(2)',
    'platform-applications': 'main section > section',
    'platform-clubs-list': 'main section > div:last-child',
    'platform-club-summary': 'main section > div:nth-child(2)',
    'platform-club-members': 'main section > div:nth-child(3)',
    'platform-add-admin': 'main form',
    'audit-history': 'main section .nexo-card',
    'athletes-list': 'main section .nexo-card',
    'athletes-form': '[role="dialog"]',
    'enrollments-list': 'main section .nexo-card',
    'enrollment-billing': '[role="dialog"]',
    'billing-charges': 'main section .nexo-card:last-child',
    'billing-submissions': 'main section .nexo-card:last-child',
    'clubs-list': 'main section > div:nth-child(2)',
    'club-settings': 'main form',
    'club-payment-methods': 'main form',
    'disciplines-list': 'main section .nexo-card',
    'discipline-form': '#discipline-form',
    'members-list': 'main section .nexo-card',
    'athlete-portal-summary': 'main section',
    'athlete-portal-enrollments': 'main section .nexo-card',
    'athlete-payments-charges': 'main section .nexo-card',
    'athlete-payment-upload': 'main form',
    'profile-form': 'main form',
    'documentation-filters': 'main section > div:nth-child(2)',
    'documentation-video': 'main section .nexo-card',
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
        const visibleTarget = (name: string) => {
            const isVisible = (element: Element | null | undefined) => {
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            };
            const marked = Array.from(document.querySelectorAll(`[data-tour="${name}"]`)).find(isVisible);
            if (marked) return marked;

            const text = textTargets[name];
            if (text) {
                const match = Array.from(document.querySelectorAll('button, a')).find((element) => isVisible(element) && element.textContent?.trim().includes(text));
                if (match) return match;
            }

            const fallback = selectorTargets[name] ? document.querySelector(selectorTargets[name]) : undefined;
            return fallback && isVisible(fallback) ? fallback : undefined;
        };
        const steps = [
            { element: visibleTarget('module-nav'), popover: { title: 'Módulo activo', description: `Estás en ${tour.title}. Desde la navegación puedes cambiar de módulo.` } },
            { element: visibleTarget('module-header'), popover: { title: tour.title, description: tour.description } },
            { element: visibleTarget('module-content'), popover: { title: 'Área de trabajo', description: 'Aquí encontrarás la información, acciones y estados propios de este módulo.' } },
            ...(flowSteps[component] ?? []).map((step) => ({ element: visibleTarget(step.target), popover: { title: step.title, description: step.description } })),
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
