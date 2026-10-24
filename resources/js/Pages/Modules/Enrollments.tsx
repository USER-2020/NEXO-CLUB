import ModulePage from './ModulePage';

export default function Enrollments() {
    return <ModulePage title="Inscripciones" eyebrow="Operación" description="Controla las inscripciones y asigna cada deportista a las disciplinas de tu club." emptyTitle="Aún no hay inscripciones" emptyDescription="Las nuevas inscripciones aparecerán aquí con su estado, disciplina y fecha de registro." actionLabel="Nueva inscripción" actionHref={route('enrollments.index')} icon="file" />;
}
