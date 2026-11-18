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

window.route = ((name?: string, args?: unknown) => name
    ? '/preview/' + name + (args == null ? '' : '/' + String(args))
    : { current: (key: string) => current === key }) as typeof window.route;

function paint() {
    const Page = pages[current as keyof typeof pages] as React.ComponentType<any>;
    const user = role === 'deportista' ? { name: athlete.name, email: athlete.email } : { name: userName, email: 'ana@example.test' };
    const pageProps = { ...props[current], auth: { user: { ...user, role, id: 1, email_verified_at: date } }, clubContext: { activeClub, clubs: [club, otherClub] }, platformAccess: { isSuperadmin: role === 'superadmin' }, flash };
    flushSync(() => preview.render(
        <PreviewContext.Provider value={{ component: current, url: location.pathname, props: pageProps }}>
            <Page key={revision + current} {...pageProps} />
            <Toaster key={revision} position="top-center" toastOptions={{ className: 'nexo-toast', duration: Infinity }} />
            {pending?.operation && <OperationProgressModal operation={pending.operation} previewPhase={shownPhase} />}
            {overlay && <div className="fixed inset-0 z-[100] grid place-items-center bg-nexo-ink/90">
                <div className="nexo-card w-full max-w-xl space-y-4 p-8 text-slate-100">
                    <p className="nexo-eyebrow">Comprobante de ejemplo</p><h2 className="text-2xl font-bold">Transferencia recibida</h2>
                    <p>Referencia {submission.reference}</p><p>Valor $85.000 COP</p><p>Medio {submission.method}</p>
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
        navigate(name);
        return;
    }
    if (name === 'memberships.filter') {
        props[current].status = new URLSearchParams(url.split('?')[1]).get('status');
        return;
    }

    const operation = previewOps[name];
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
            case 'disciplines.store':
                page.disciplines = pageList([...page.disciplines.data, { ...discipline, ...data, id: 2 }]);
                success = 'Disciplina creada correctamente.';
                break;
            case 'disciplines.update':
            case 'disciplines.toggle':
                page.disciplines = pageList(page.disciplines.data.map((item: typeof discipline) => item.id === 2
                    ? { ...item, ...data, is_active: name.endsWith('toggle') ? !item.is_active : item.is_active } : item));
                success = name.endsWith('toggle') ? 'Disciplina desactivada.' : 'Disciplina actualizada correctamente.';
                break;
            case 'athletes.store':
                page.athletes = pageList([{ ...athlete, ...data, active_enrollments_count: 0 }]);
                success = 'Deportista registrado correctamente.';
                break;
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
    if (kind === 'page') { navigate(target!); paint(); }
    if (kind === 'resolve') { overlay = ''; paint(); }
}, repaint: paint });
