import ModulePage from './ModulePage';

export default function Athletes() {
    return <ModulePage title="Deportistas" eyebrow="Operación" description="Administra perfiles, acudientes, disciplinas y el estado de cada deportista." emptyTitle="Aún no hay deportistas registrados" emptyDescription="Cuando agregues deportistas, podrás consultar sus perfiles y hacer seguimiento a su progreso desde aquí." actionLabel="Agregar deportista" actionHref={route('athletes.index')} icon="users" />;
}
