export type Action = [offset: number, kind: 'click' | 'type' | 'file' | 'view' | 'resolve' | 'page', target?: string, value?: string];
type Beat = [seconds: number, ...actions: Action[]];
type Scenario = { page: string; beats: Beat[] };

export const scenarios: Record<string, Scenario> = {
    'acceso-roles': { page: 'login', beats: [
        [8, [1, 'type', '#email', 'ana@example.test'], [3, 'type', '#password', 'clave-incorrecta'], [6, 'click', 'Iniciar sesión']],
        [12, [1, 'view', 'Las credenciales no coinciden con nuestros registros.'], [3, 'type', '#password', 'SoloParaElVideo2026'], [6, 'click', 'Iniciar sesión'], [8, 'page', 'verification.notice']],
        [11, [0, 'page', 'dashboard'], [2, 'view', 'Resumen del club'], [6, 'page', 'athlete.dashboard'], [8, 'view', 'Mi portal']],
        [8, [1, 'page', 'dashboard'], [3, 'click', 'Club Horizonte'], [5, 'click', 'Club Sendero']],
    ] },
    'acceso-superadmin': { page: 'login', beats: [
        [9, [1, 'type', '#email', 'plataforma@example.test'], [3, 'type', '#password', 'SoloParaElVideo2026'], [6, 'click', 'Iniciar sesión']],
        [8, [1, 'view', 'Resumen global'], [4, 'view', 'Logs de auditoría']],
        [8, [2, 'click', 'Gestionar clubes'], [5, 'view', 'Todos los clubes']],
    ] },
    'resumen-club': { page: 'dashboard', beats: [
        [6, [1, 'view', 'Club Horizonte']],
        [8, [1, 'view', 'Deportistas activos'], [4, 'view', 'Recaudo del mes']],
        [8, [1, 'view', 'Últimos pagos'], [5, 'view', 'Recaudos']],
        [7, [1, 'click', 'Configurar club'], [3, 'view', 'Editar información del club']],
    ] },
    'clubes-global': { page: 'platform.dashboard', beats: [
        [6, [1, 'view', 'Gestionar clubes'], [3, 'click', 'Gestionar clubes']],
        [13, [1, 'view', 'Solicitudes públicas'], [4, 'view', 'Correo confirmado'], [7, 'click', 'Aprobar y crear club'], [10, 'view', 'Club Brisa']],
        [31, [1, 'type', 'Nombre', 'Club Cumbre'], [3, 'type', 'Correo del club', 'cumbre@example.test'], [5, 'type', 'Ciudad', 'Medellín'], [7, 'type', 'Nombre del administrador', 'Eva Torres'], [9, 'type', 'Correo de acceso', 'eva@example.test'], [11, 'type', 'Contraseña temporal', 'SoloParaElVideo2026'], [13, 'click', 'Crear club y acceso'], [30, 'view', 'Club creado correctamente']],
        [10, [2, 'click', 'Club Cumbre'], [5, 'view', 'Miembros del club'], [7, 'view', 'Administradores']],
    ] },
    'club-configuracion': { page: 'clubs.index', beats: [
        [6, [2, 'view', 'Club Horizonte']],
        [8, [1, 'type', 'Ciudad', 'Medellín'], [4, 'click', 'Guardar cambios']],
        [29, [1, 'click', 'Tipo'], [3, 'click', 'Nequi'], [5, 'type', 'Nombre visible', 'Nequi del club'], [7, 'type', 'Número Nequi', '3000000000'], [9, 'type', 'Titular', 'Club Horizonte'], [12, 'click', 'Agregar medio de pago']],
        [8, [2, 'view', 'Nequi del club']],
    ] },
    'disciplinas': { page: 'disciplines.index', beats: [
        [6, [2, 'view', 'Disciplinas del club']],
        [9, [1, 'type', 'Nombre', 'Natación'], [5, 'type', 'Descripción', 'Entrenamiento de técnica y resistencia.']],
        [22, [1, 'click', 'Crear disciplina'], [19, 'view', 'Natación']],
        [10, [1, 'click', 'Editar Natación'], [3, 'type', 'Descripción', 'Técnica y resistencia en piscina.'], [5, 'click', 'Guardar cambios'], [7, 'click', 'Desactivar Natación']],
    ] },
    'deportistas-perfil': { page: 'athletes.index', beats: [
        [12, [1, 'click', 'Crear deportista'], [3, 'type', 'Nombres', 'Lucía'], [5, 'type', 'Apellidos', 'Ríos'], [7, 'type', 'Número de documento', '1000000001'], [10, 'click', 'Continuar']],
        [8, [1, 'type', 'Correo electrónico', 'lucia@example.test'], [4, 'type', 'Acudiente', 'María Ríos'], [6, 'click', 'Continuar']],
        [8, [1, 'type', 'Estatura (cm)', '160'], [4, 'type', 'Peso (kg)', '53'], [6, 'click', 'Continuar']],
        [13, [1, 'click', 'Disciplina'], [3, 'click', 'Natación'], [5, 'click', 'Periodicidad'], [7, 'click', 'Quincenal'], [9, 'type', 'Valor del periodo', '85000'], [11, 'type', 'Día de vencimiento', '18']],
        [24, [1, 'click', 'Crear deportista y recaudo'], [19, 'view', 'Lucía Ríos']],
    ] },
    inscripciones: { page: 'enrollments.index', beats: [
        [6, [2, 'click', 'Crear inscripción']],
        [11, [1, 'click', 'Deportista'], [3, 'click', 'Lucía Ríos'], [5, 'click', 'Disciplina'], [7, 'click', 'Natación'], [9, 'click', 'Continuar']],
        [12, [1, 'click', 'Fecha de inicio'], [3, 'click', '18'], [5, 'type', 'Mensualidad', '85000'], [8, 'type', 'Día de vencimiento', '18']],
        [31, [1, 'click', 'Crear inscripción'], [18, 'view', 'Lucía Ríos'], [20, 'click', 'Activar inscripción'], [23, 'click', 'Activar'], [27, 'view', 'Activa']],
    ] },
    'mensualidades-cobros': { page: 'memberships.index', beats: [
        [9, [1, 'click', 'Filtrar recaudos'], [3, 'click', 'Pendientes'], [6, 'view', 'Cargos del club']],
        [9, [1, 'view', 'Comprobantes enviados'], [4, 'click', 'Ver comprobante'], [7, 'resolve']],
        [10, [1, 'click', 'Aprobar'], [5, 'click', 'Aprobar y registrar']],
        [11, [1, 'view', 'Estado: Aprobado'], [4, 'view', 'Cargos del club'], [6, 'click', 'Registrar pago'], [8, 'view', 'Pagada']],
    ] },
    'equipo-permisos': { page: 'club-members.index', beats: [
        [6, [1, 'view', 'Equipo']],
        [9, [1, 'type', 'Nombre', 'Sebastián Mora'], [3, 'type', 'Correo', 'sebas@example.test'], [5, 'type', 'Contraseña temporal', 'SoloParaElVideo2026']],
        [24, [1, 'click', 'Rol'], [3, 'click', 'Contador'], [5, 'click', 'Agregar al club'], [22, 'view', 'Sebastián Mora']],
        [8, [1, 'view', 'Sebastián Mora']],
    ] },
    'portal-deportista': { page: 'athlete.dashboard', beats: [
        [6, [1, 'view', 'Hola, Lucía']],
        [8, [1, 'view', 'Actividad semanal'], [4, 'view', 'Mis inscripciones']],
        [13, [1, 'click', 'Mi perfil'], [3, 'view', 'Datos personales'], [5, 'type', 'Acudiente', 'María Ríos'], [9, 'click', 'Guardar cambios']],
        [8, [1, 'click', 'Mis pagos'], [4, 'view', 'Cargos y comprobantes']],
    ] },
    'mensualidades-comprobante': { page: 'athlete.payments', beats: [
        [7, [1, 'view', 'Cargos y comprobantes']],
        [10, [1, 'view', 'Medios del club'], [4, 'click', 'Nequi del club'], [6, 'click', 'Nequi del club'], [8, 'type', 'Referencia (opcional)', 'NEXO-018']],
        [24, [1, 'file', 'input[type=file]'], [5, 'click', 'Enviar comprobante']],
        [8, [1, 'view', 'Comprobante enviado; pendiente de revisión.']],
    ] },
    'auditoria-operaciones': { page: 'platform.dashboard', beats: [
        [6, [2, 'click', 'Logs de auditoría']],
        [8, [2, 'view', 'Lucía Ríos'], [5, 'view', 'Club Horizonte']],
        [8, [2, 'view', 'status: paid']],
    ] },
    'perfil-cuenta': { page: 'profile.edit', beats: [
        [6, [1, 'view', 'Configura tu perfil']],
        [9, [1, 'type', '#name', 'Ana Torres'], [5, 'click', '#name', 'submit']],
        [14, [1, 'type', '#current_password', 'SoloParaElVideo2026'], [4, 'type', '#password', 'NuevaClaveDemo2026'], [7, 'type', '#password_confirmation', 'NuevaClaveDemo2026'], [10, 'click', '#password_confirmation', 'submit']],
    ] },
};
