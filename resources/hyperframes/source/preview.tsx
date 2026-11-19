import '../../css/app.css';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Toaster, toast } from 'react-hot-toast';
import { OperationProgressModal, type Operation } from '@/Components/OperationProgressModal';
import Login from '@/Pages/Auth/Login';
import VerifyEmail from '@/Pages/Auth/VerifyEmail';
import Dashboard from '@/Pages/Dashboard';
import PlatformDashboard from '@/Pages/Platform/Dashboard';
import PlatformClubs from '@/Pages/Platform/Clubs';
import ClubDetails from '@/Pages/Platform/ClubDetails';
import AuditLogs from '@/Pages/Platform/AuditLogs';
import Clubs from '@/Pages/Clubs/Index';
import Disciplines from '@/Pages/Disciplines/Index';
import Athletes from '@/Pages/Athletes/Index';
import Enrollments from '@/Pages/Enrollments/Index';
import Memberships from '@/Pages/Memberships/Index';
import Team from '@/Pages/ClubMembers/Index';
import Portal from '@/Pages/Athletes/Portal';
import Payments from '@/Pages/Athletes/Payments';
import Profile from '@/Pages/Profile/Edit';
import catalog from '../flows/catalog.json';
import { PreviewContext, setPreviewVisit } from './inertia-preview';
import { athlete, charge, club, date, discipline, enrollment, fixtures, method, otherClub, pageList, personalCharge, submission } from './fixtures';
import { scenarios, type Action } from './scenarios';
import { walk } from './timeline';

const pages = {
    login: Login, 'verification.notice': VerifyEmail, dashboard: Dashboard, 'platform.dashboard': PlatformDashboard,
    'platform.clubs.index': PlatformClubs, 'platform.clubs.show': ClubDetails, 'platform.logs.index': AuditLogs,
    'clubs.index': Clubs, 'disciplines.index': Disciplines, 'athletes.index': Athletes, 'enrollments.index': Enrollments,
    'memberships.index': Memberships, 'club-members.index': Team, 'athlete.dashboard': Portal, 'athlete.payments': Payments, 'profile.edit': Profile,
};

const stage = document.querySelector<HTMLElement>('[data-composition-id]')!;
const composition = stage.dataset.compositionId!;
const host = document.getElementById('app')!;
const preview = createRoot(host);
const matchMedia = window.matchMedia.bind(window);
window.matchMedia = (query) => matchMedia(query === '(prefers-reduced-motion: reduce)' ? '(min-width: 0px)' : query);
const previewOps: Record<string, Operation> = {
    'platform.clubs.store': 'club', 'clubs.payment-methods.store': 'payment_method', 'disciplines.store': 'discipline',
    'athletes.store': 'athlete', 'enrollments.store': 'enrollment', 'club-members.store': 'member',
    'athlete.payment-submissions.store': 'payment_submission',
};

let current = '';
let props: Record<string, any>;
let activeClub = club;
let role = 'admin';
let loginAttempts = 0;
let scenarioId = "";
let revision = 0;
let overlay = '';
let pending: { end: number; start: number; operation?: Operation; finish: () => void } | undefined;
let shownPhase = -1;
let time = 0;
let flash = {};
let userName = 'Ana Pérez';

const suspensionSubject = 'Inscripción suspendida por falta de pago';
const billingEmails: Record<string, { title: string; recipient: string; message: string; detail?: string; hasChargeList?: boolean }> = {
    reminder: { title: 'Recordatorio de mensualidad', recipient: athlete.email, message: 'Hola Lucía, tienes un pago pendiente en el Club Horizonte. Consulta los medios de pago habilitados por el club en NEXO CLUB.', detail: 'Vence mañana, 18 de noviembre · $85.000 COP' },
    due: { title: 'Tu mensualidad vence hoy', recipient: athlete.email, message: 'Hola Lucía, hoy vence tu pago de Natación en el Club Horizonte.', detail: 'Vencimiento 18 de noviembre · $85.000 COP' },
    report: { title: 'Pendientes por cobrar · Club Horizonte', recipient: 'ana@example.test', message: 'Club Horizonte · 1 cobro', detail: 'pendientes-por-cobrar.xlsx', hasChargeList: true },
    suspension: { title: suspensionSubject, recipient: athlete.email, message: 'Tu inscripción en Natación está suspendida. Comunícate con tu club para regularizar el pago.', detail: 'Vencimiento 18 de noviembre · $85.000 COP' },
    'admin-suspension': { title: suspensionSubject, recipient: 'ana@example.test', message: 'La inscripción de Lucía Ríos en el Club Horizonte sigue suspendida por falta de pago.', detail: 'Vencimiento 18 de noviembre · $85.000 COP' },
    activation: { title: 'Tu cuenta de NEXO CLUB ya está activa', recipient: athlete.email, message: 'Tu pago se registró y tu inscripción de Natación en el Club Horizonte ya está activa.' },
};

window.route = ((name?: string, args?: unknown) => name
    ? '/preview/' + name + (args == null ? '' : '/' + String(args))
    : { current: (key: string) => current === key }) as typeof window.route;

function paint() {
    const Page = pages[current as keyof typeof pages] as React.ComponentType<any>;
    const user = role === 'deportista' ? { name: athlete.name, email: athlete.email } : { name: userName, email: 'ana@example.test' };
    const pageProps = { ...props[current], auth: { user: { ...user, role, id: 1, email_verified_at: date } }, clubContext: { activeClub, clubs: [club, otherClub] }, platformAccess: { isSuperadmin: role === 'superadmin' }, flash };
    if (scenarioId === 'notificaciones-plataforma') {
        const outstanding = props['memberships.index'].charges.data.filter((entry: typeof charge) => entry.status !== 'paid');
        pageProps.adminBillingNotifications = {
            count: outstanding.length,
            total: outstanding.reduce((sum: number, entry: typeof charge) => sum + entry.amount, 0),
            items: outstanding.map((entry: typeof charge) => ({
                id: entry.id, athlete: athlete.name, discipline: discipline.name, amount: entry.amount,
                due_date: entry.due_date, status: entry.status,
            })),
        };
    }
    const email = billingEmails[overlay];
    flushSync(() => preview.render(
        <PreviewContext.Provider value={{ component: current, url: location.pathname, props: pageProps }}>
            <Page key={revision + current} {...pageProps} />
            <Toaster key={revision} position="top-center" toastOptions={{ className: 'nexo-toast', duration: Infinity }} />
            {pending?.operation && <OperationProgressModal operation={pending.operation} previewPhase={shownPhase} />}
            {overlay && <div className="fixed inset-0 z-[100] grid place-items-center bg-nexo-ink/90">
                <div className="nexo-card w-full max-w-xl space-y-4 p-8 text-slate-100">
                    {overlay === 'receipt' && <><p className="nexo-eyebrow">Comprobante de ejemplo</p><h2 className="text-2xl font-bold">Transferencia recibida</h2><p>Referencia {submission.reference}</p><p>Valor $85.000 COP</p><p>Medio {submission.method}</p></>}
                    {email && <>
                        <p className="nexo-eyebrow">Correo de ejemplo</p>
                        <h2 className="text-2xl font-bold">{email.title}</h2>
                        <p className="text-sm text-slate-400">Para {email.recipient}</p>
                        <p>{email.message}</p>
                        {email.hasChargeList && <div className="flex items-center justify-between gap-4 border-t border-slate-700 pt-3">
                            <div>
                                <p className="font-semibold">{athlete.name}</p>
                                <p className="text-sm text-slate-300">Natación · Pendiente</p>
                                <p className="text-sm text-slate-300">Vence el 18/11/2026 · $85.000 COP</p>
                            </div>
                            <span className="rounded-md bg-green-800 px-3 py-2 text-sm font-bold text-white">WhatsApp</span>
                        </div>}
                        {email.detail && <p className="rounded-xl bg-nexo-ink p-4 font-semibold text-nexo-lime">{email.detail}</p>}
                    </>}
                </div>
            </div>}
        </PreviewContext.Provider>,
    ));
}

function navigate(page: string) {
    if (!(page in pages)) throw new Error('Pantalla sin fixture: ' + page);
    current = page;
    role = page.startsWith('platform.') ? 'superadmin' : page.startsWith('athlete.') ? 'deportista' : page === 'profile.edit' ? role : 'admin';
    flash = {};
    window.scrollTo(0, 0);
}

function reset(id: string) {
    scenarioId = id;
    revision++;
    pending = undefined;
    shownPhase = -1;
    overlay = '';
    activeClub = club;
    loginAttempts = 0;
    userName = 'Ana Pérez';
    props = structuredClone(fixtures(id));
    if (id === 'notificaciones-plataforma') {
        props['memberships.index'].charges = pageList([charge]);
        props['memberships.index'].paymentSubmissions = [];
    }
    navigate(scenarios[id].page);
    if (id === 'portal-deportista' || id === 'mensualidades-comprobante') role = 'deportista';
    toast.remove();
    paint();
}

function routeKey(url: string) {
    return url.startsWith('/preview/') ? url.split('/')[2] : url.includes('status=') ? 'memberships.filter' : url;
}

setPreviewVisit((verb, url, data, done) => {
    const name = routeKey(url);
    if (verb === 'get' && name in pages) {
        if (scenarioId === 'notificaciones-plataforma' && name === 'memberships.index') revision++;
        navigate(name);
        return;
    }
    if (name === 'memberships.filter') {
        props[current].status = new URLSearchParams(url.split('?')[1]).get('status');
        return;
    }

    const paidOnboarding = name === 'athletes.store' && data.initial_charge_mode === 'paid';
    const operation = paidOnboarding ? 'athlete_with_payment' : previewOps[name];
    shownPhase = 0;
    flash = {};
    toast.remove();
    pending = { start: time, end: time + (operation ? 16 : 0.9), operation, finish: () => {
        const page = props[current];
        let success = '';
        switch (name) {
            case 'login':
                if (scenarioId === 'acceso-superadmin') { navigate('platform.dashboard'); break; }
                if (++loginAttempts === 1) { done({ email: 'Las credenciales no coinciden con nuestros registros.' }); return; }
                navigate('dashboard');
                break;
            case 'clubs.switch':
                activeClub = Number(data.club_id) === otherClub.id ? otherClub : club;
                break;
            case 'clubs.update':
                page.activeClub = activeClub = { ...activeClub, ...data };
                page.clubs = pageList([activeClub, otherClub]);
                success = 'Club actualizado correctamente.';
                break;
            case 'clubs.payment-methods.store':
                page.paymentMethods = [{ ...method, ...data, is_active: true }];
                success = 'Medio de pago agregado correctamente.';
                break;
            case 'disciplines.store': {
                const createdDiscipline = { ...discipline, ...data, id: 2 };
                page.disciplines = pageList([...page.disciplines.data, createdDiscipline]);
                props['athletes.index'].disciplines.push(createdDiscipline);
                props['enrollments.index'].disciplines.push(createdDiscipline);
                success = 'Disciplina creada correctamente.';
                break;
            }
            case 'disciplines.update':
            case 'disciplines.toggle':
                page.disciplines = pageList(page.disciplines.data.map((item: typeof discipline) => item.id === 2
                    ? { ...item, ...data, is_active: name.endsWith('toggle') ? !item.is_active : item.is_active } : item));
                success = name.endsWith('toggle') ? 'Disciplina desactivada.' : 'Disciplina actualizada correctamente.';
                break;
            case 'athletes.store': {
                const createdAthlete = { ...athlete, ...data, active_enrollments_count: paidOnboarding ? 1 : 0 };
                page.athletes = pageList([...page.athletes.data, createdAthlete]);
                props['enrollments.index'].athletes.push(createdAthlete);
                const selectedDiscipline = page.disciplines.find((item: typeof discipline) => item.id === Number(data.discipline_id));
                if (selectedDiscipline) {
                    const start = paidOnboarding ? date : data.start_date;
                    const createdEnrollment = {
                        ...enrollment,
                        athlete: createdAthlete,
                        discipline: selectedDiscipline,
                        discipline_id: selectedDiscipline.id,
                        status: paidOnboarding ? 'active' : 'pending',
                        start_date: start,
                        billing_frequency: data.billing_frequency,
                        monthly_amount: Number(data.monthly_amount),
                        due_day: Number(data.due_day),
                    };
                    const enrollmentsPage = props['enrollments.index'];
                    enrollmentsPage.enrollments = pageList([...enrollmentsPage.enrollments.data, createdEnrollment]);
                    const billingPage = props['memberships.index'];
                    billingPage.charges = pageList([...billingPage.charges.data, {
                        ...charge,
                        enrollment: createdEnrollment,
                        period: start,
                        period_end: data.billing_frequency === 'biweekly' ? '2026-12-02' : '2026-12-17',
                        due_date: start,
                        amount: createdEnrollment.monthly_amount,
                        status: paidOnboarding ? 'paid' : 'pending',
                    }]);
                    if (paidOnboarding && scenarioId === 'primeros-pasos-club') {
                        const dashboard = props.dashboard;
                        dashboard.stats.activeAthletes = 1;
                        dashboard.stats.monthlyEnrollments = 1;
                        dashboard.stats.monthlyRevenue = createdEnrollment.monthly_amount;
                        dashboard.financialActivity.months[10].paid = createdEnrollment.monthly_amount;
                        dashboard.recentPayments = [{ id: charge.id, name: createdAthlete.name, amount: createdEnrollment.monthly_amount, date }];
                    }
                }
                success = paidOnboarding
                    ? 'Deportista registrado, pago confirmado e inscripción activada.'
                    : selectedDiscipline ? 'Deportista registrado. El primer cargo quedó pendiente en Recaudos.' : 'Deportista registrado correctamente.';
                break;
            }
            case 'enrollments.store':
                page.enrollments = pageList([{ ...enrollment, ...data, status: 'pending' }]);
                success = 'Inscripción creada como pendiente de activación.';
                break;
            case 'enrollments.status':
                page.enrollments = pageList([{ ...page.enrollments.data[0], status: 'active' }]);
                success = 'Inscripción activada.';
                break;
            case 'memberships.submissions.approve':
                page.paymentSubmissions = [{ ...submission, status: 'approved' }];
                page.charges = pageList([{ ...charge, status: 'paid' }, page.charges.data[1]]);
                success = 'Comprobante aprobado y pago registrado.';
                break;
            case 'memberships.pay':
                page.charges = pageList(page.charges.data.map((entry: typeof charge) => ({ ...entry, status: 'paid' })));
                success = 'Pago registrado. La inscripción fue reactivada si estaba suspendida.';
                break;
            case 'athlete.payment-submissions.store':
                page.charges = [{ ...personalCharge, payment_submission: { id: submission.id, status: 'pending' } }];
                success = 'Comprobante enviado para revisión.';
                break;
            case 'club-members.store':
                page.members = pageList([...page.members.data, { ...data, id: 2, status: 'active' }]);
                success = 'Miembro agregado correctamente.';
                break;
            case 'platform.club-applications.approve': {
                const [application] = page.applications;
                const approvedClub = { ...club, id: 4, name: application.club_name, slug: 'club-brisa', city: application.club_city, disciplines_count: 0, users_count: 1 };
                page.clubs = pageList([approvedClub, ...page.clubs.data]);
                page.applications = [];
                success = 'Solicitud aprobada y club creado.';
                break;
            }
            case 'platform.clubs.store': {
                const administrator = { id: 3, name: data.admin_name, email: data.admin_email, role: 'admin', status: 'active' };
                const createdClub = { ...club, ...data, id: 3, slug: 'club-cumbre', disciplines_count: 0, users_count: 1, primary_admin: [administrator] };
                page.clubs = pageList([createdClub, ...page.clubs.data]);
                page.createdAccess = { club: createdClub.name, name: administrator.name, email: administrator.email, password: data.admin_password, existing: false };
                props['platform.clubs.show'] = { club: { ...createdClub, members: [administrator], disciplines: [], primary_admin: administrator } };
                break;
            }
            case 'profile.update':
                userName = String(data.name);
                break;
            case 'athlete.profile.update':
                page.athlete = { ...page.athlete, ...data };
                success = 'Datos personales actualizados.';
                break;
            case 'password.update':
                break;
            default:
                throw new Error('Visita sin fixture: ' + name);
        }
        if (success) flash = { success };
        done();
    } };
});

host.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
    if (link?.getAttribute('href')?.includes('memberships.submissions.receipt')) {
        event.preventDefault();
        overlay = 'receipt';
    }
});

function processTime(next: number) {
    time = next;
    if (!pending) return;
    if (time >= pending.end) {
        const { finish } = pending;
        pending = undefined;
        flushSync(finish);
        paint();
    } else if (pending.operation) {
        const phase = Math.min(2, Math.floor((time - pending.start) / 5));
        if (phase !== shownPhase) { shownPhase = phase; paint(); }
    }
}

walk({ composition, catalog, host, reset, processTime, perform(action: Action) {
    const [, kind, target] = action;
    if (kind === 'email') { overlay = target!; paint(); return; }
    if (kind === 'billing-cut') {
        props['memberships.index'].charges = pageList([{ ...charge, status: 'overdue' }]);
        paint();
        return;
    }
    if (kind === 'page') { navigate(target!); paint(); }
    if (kind === 'resolve') { overlay = ''; paint(); }
}, repaint: paint });
