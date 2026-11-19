export const date = '2026-11-18';
const created_at = date + 'T15:00:00Z';
export const club = { id: 1, name: 'Club Horizonte', slug: 'club-horizonte', email: 'club@example.test', city: 'Bogotá', timezone: 'America/Bogota', currency: 'COP', is_active: true, users_count: 3, disciplines_count: 1, created_at };
export const otherClub = { ...club, id: 2, name: 'Club Sendero', slug: 'club-sendero', city: 'Cali' };
export const discipline = { id: 1, name: 'Natación', description: 'Escuela de formación', is_active: true, created_at };
export const athlete = { id: 1, first_name: 'Lucía', last_name: 'Ríos', name: 'Lucía Ríos', email: 'lucia@example.test', document_type: 'cedula_ciudadania', status: 'active', photo_url: null, active_enrollments_count: 1, club: club.name };
export const enrollment = { id: 1, athlete_id: 1, discipline_id: 1, status: 'active', start_date: date, monthly_amount: 85000, due_day: 18, athlete, discipline };
export const charge = { id: 1, amount: 85000, due_date: date, period: date, status: 'pending', enrollment };
export const personalCharge = { ...charge, discipline: discipline.name };
export const submission = { id: 1, athlete: athlete.name, charge_id: 1, period: date, amount: 85000, method: 'Nequi del club', reference: 'NEXO-018', status: 'pending' };
export const method = { id: 1, type: 'nequi', label: 'Nequi del club', account_number: '3000000000', is_active: true };
const admin = { id: 1, name: 'Ana Pérez', email: 'ana@example.test', role: 'admin', status: 'active', is_default: true };
export const pageList = <T,>(data: T[]) => ({ data, current_page: 1, last_page: 1, from: data.length ? 1 : 0, to: data.length, total: data.length });

export function fixtures(scenario: string) {
    const clubs = [club, otherClub];
    const platformDetails = { ...club, members: [admin], disciplines: [discipline], primary_admin: admin };
    const payment = { id: 5, amount: 85000, period: '2026-10-18', method: 'Nequi', paid_at: '2026-10-18' };
    const isFirstSteps = scenario === 'primeros-pasos-club';
    const isOnboarding = isFirstSteps || scenario === 'deportistas-perfil';
    const financialActivity = {
        year: 2026,
        months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].map((month, index) => ({
            month,
            label: month,
            paid: isFirstSteps ? 0 : (index === 10 ? 680000 : index === 9 ? 425000 : 0),
            outstanding: !isFirstSteps && index === 10 ? 255000 : 0,
        })),
    };
    return {
        login: { canResetPassword: true },
        'verification.notice': {},
        dashboard: {
            today: 'Miércoles, 18 de noviembre de 2026',
            financialActivity,
            stats: isFirstSteps
                ? { activeAthletes: 0, monthlyEnrollments: 0, monthlyRevenue: 0, outstandingBalance: 0, overdueCharges: 0 }
                : { activeAthletes: 12, monthlyEnrollments: 3, monthlyRevenue: 680000, outstandingBalance: 255000, overdueCharges: 2 },
            recentPayments: isFirstSteps ? [] : [{ ...payment, name: athlete.name, date }],
        },
        'platform.dashboard': { stats: { clubs: 2, activeClubs: 2, users: 8, disciplines: 4 }, clubs },
        'platform.clubs.index': { clubs: pageList(clubs), applications: [{ id: 1, applicant: { name: 'Irene Salas', email: 'irene@example.test' }, email_verified_at: created_at, club_name: 'Club Brisa', club_email: 'brisa@example.test', club_phone: '3000000000', club_city: 'Pereira', club_address: 'Calle 1', club_timezone: 'America/Bogota', created_at }] },
        'platform.clubs.show': { club: platformDetails },
        'platform.logs.index': { logs: pageList([
            { id: 2, action: 'updated', user: { ...admin, name: athlete.name, email: athlete.email }, club, auditable_type: 'App\\Models\\MonthlyCharge', auditable_id: 1, new_values: { status: 'paid' }, ip_address: '192.0.2.18', created_at },
            { id: 1, action: 'login', user: admin, club, ip_address: '192.0.2.20', created_at },
        ]) },
        'clubs.index': { clubs: pageList(clubs), activeClub: club, canCreate: false, canUpdate: true, canManagePaymentMethods: true, paymentMethods: [] },
        'disciplines.index': { disciplines: pageList(isFirstSteps ? [] : [{ ...discipline, name: 'Atletismo' }]), canManage: true },
        'athletes.index': { athletes: pageList([]), disciplines: isFirstSteps ? [] : [discipline], today: date },
        'enrollments.index': { enrollments: pageList([]), athletes: isOnboarding ? [] : [athlete], disciplines: isFirstSteps ? [] : [discipline] },
        'memberships.index': { charges: pageList(isOnboarding ? [] : [charge, { ...charge, id: 2, amount: 95000, enrollment: { ...enrollment, athlete: { ...athlete, first_name: 'Mateo', last_name: 'Vega' } } }]), paymentSubmissions: isOnboarding ? [] : [submission], paymentMethods: [method], status: 'all' },
        'club-members.index': { members: pageList([admin]), roles: ['admin', 'contador', 'usuario'] },
        'athlete.dashboard': { athlete: { ...athlete, enrollments: [{ ...enrollment, discipline: discipline.name, charges: [personalCharge] }] }, stats: { active_enrollments: 1, total_enrollments: 1, pending_charges: 1, paid_total: 85000 }, payments: [payment], paymentMethods: [method], trainingDemo: [{ label: 'Lun', sessions: 2, minutes: 90 }, { label: 'Mié', sessions: 1, minutes: 60 }] },
        'athlete.payments': { charges: [personalCharge], payments: [payment], paymentMethods: [method] },
        'profile.edit': { mustVerifyEmail: true, athlete: scenario === 'portal-deportista' ? athlete : null },
    };
}
