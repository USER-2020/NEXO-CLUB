import ModulePage from './ModulePage';

export default function Memberships() {
    return <ModulePage title="Mensualidades" eyebrow="Finanzas" description="Consulta cargos, pagos y saldos pendientes de los deportistas de tu club." emptyTitle="Aún no hay mensualidades" emptyDescription="Cuando configures tus tarifas y registres cargos, aquí tendrás el control de tu cartera." actionLabel="Configurar tarifas" actionHref={route('clubs.index')} icon="money" />;
}
