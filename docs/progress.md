# Registro de avances

## 2026-10-23 — Fase 1: base del proyecto

- [x] Inspección inicial: repositorio vacío, sin archivos de aplicación.
- [x] Laravel 12.12.2 instalado sobre PHP 8.2.
- [x] Breeze con Inertia, React y TypeScript instalado.
- [x] Spatie Laravel Permission instalado y conectado a `User`.
- [x] Tema visual NEXO CLUB y shell responsive desktop/mobile creados.
- [x] Dashboard inicial con estados vacíos y contadores derivados del backend.
- [x] Manifest y service worker configurados mediante `vite-plugin-pwa`.
- [x] Convenciones del repositorio y arquitectura documentadas.
- [x] Usuario administrador de pruebas disponible fuera de producción.
- [x] Skill y documento de contexto compartible para incorporación de otros agentes.
- [x] Entrega 1: tablas base multi-club, Teams, resolver de club activo y cambio de club protegido.
- [x] Entrega 1: CRUD inicial de clubes y disciplinas con Policies.
- [x] Entrega 1: pruebas de cambio de club y aislamiento de membresías.
- [x] CRUD de disciplinas con activación/desactivación y componentes de formulario estilo shadcn local.
- [x] CRUD de deportistas con onboarding modal, foto privada, datos físicos opcionales y estado activo/inactivo.
- [x] Inscripciones con onboarding modal, edición, activación, suspensión y cancelación.
- [x] Mensualidades, pagos, generación idempotente de cargos y suspensión por vencimiento.
- [x] Reactivación de inscripciones al registrar pagos.
- [x] Generación inmediata del cargo del periodo actual al activar una inscripción.
- [x] Día de vencimiento inicial basado en la fecha de inicio, editable y compatible con meses cortos.
- [x] Formateo amigable de fechas y horas en zona `America/Bogota`.
- [x] Medios de pago por club: cuentas bancarias, Nequi y llaves con activación/desactivación.
- [x] Infraestructura de correos de bienvenida, recordatorios y reporte CSV preparada y desactivada por defecto.
- [x] React Hot Toast para confirmaciones y feedback CRUD.
- [x] Portal del deportista con historial de mensualidades pagadas, fechas de vencimiento y medios de pago activos.
- [x] Comprobantes de pago privados: envío por mensualidad, revisión administrativa, aprobación/rechazo y registro auditado del pago.
- [x] Módulo independiente `Mis pagos` para el deportista, separado de la vista de inscripciones y accesible desde la navegación del portal.
- [x] Centro global de documentación por rol, módulo y componente, con filtros y un recorrido general más 10 Hyperframes individuales renderizados.
- [x] Vista guiada contextual con Driver.js, botón flotante `Visita guiada`, recorridos para todos los módulos autenticados y persistencia de finalización por usuario y módulo.
- [x] Hyperframes dinámicos sin Playwright: cursor, escritura progresiva, validación, loader, actualización de estados y toast de confirmación en los 10 recorridos individuales.
- [x] Contrato reutilizable para módulos futuros: skill `nexo-club-guided-tours`, reglas de AGENTS y arquitectura para guías Driver.js específicas por contenido, rol, flujo y estado.
- [x] Registro público de clubes con datos esenciales, cuenta inactiva y solicitud pendiente de aprobación.
- [x] Flujo de superadmin para aprobar/rechazar solicitudes; la aprobación crea el club y activa al administrador principal.
- [x] Correos de recepción y activación de solicitudes de club, condicionados a `NEXO_NOTIFICATIONS_ENABLED=true` y SMTP configurado.

## Siguiente fase

Implementar historial de medidas, tests físicos, mesociclos, macrociclos, entrenadores y grupos de entrenamiento.

## Decisiones pendientes antes de facturación

- Política de cobro de inscripción a mitad de mes: completo, proporcional o siguiente período.
- Estrategia de asignación de roles de Spatie por club (Teams) y flujo UX para cambiar de club.
