# Arquitectura NEXO CLUB

## Contexto

NEXO CLUB será un monolito modular Laravel + Inertia + React/TypeScript. La aplicación tendrá una única base de código y separará cada dominio por modelos, acciones, policies, requests y páginas Inertia.

## Módulos previstos

- **Identity & Access:** autenticación Breeze, verificación de correo, roles y permisos con Spatie.
- **Clubs:** clubes, membresías de usuarios y contexto de club activo.
- **Athletes:** deportistas, acudientes, datos físicos básicos y fotos privadas.
- **Enrollments:** inscripciones abiertas, estados de activación y tarifas mensuales.
- **Billing:** cargos mensuales, pagos y suspensión/reactivación por mora.
- **Payment submissions:** comprobantes privados enviados por deportistas, pendientes de revisión administrativa y vinculados a un cargo mensual.
- **Notifications:** notificaciones internas, correo, colas y trazabilidad de entregas.
- **Reporting:** cartera, exportaciones y métricas limitadas al club activo.
- **Guided tours:** recorridos contextuales Driver.js para cada componente Inertia autenticado. La finalización se guarda por usuario y módulo en `guided_tours`.

## Aislamiento multi-club

Las entidades de negocio tendrán `club_id` y las consultas se construirán desde un contexto de club derivado de la sesión/membresía del usuario. El frontend nunca podrá seleccionar libremente el `club_id` de una operación. Policies y scopes se aplicarán también a descargas y endpoints de exportación.

Spatie Permission está instalado y el modelo `User` usa `HasRoles`. En la fase de clubes se habilitará el modo Teams de Spatie con un identificador de contexto por club, después de definir la experiencia de cambio de club y sus políticas de pertenencia.

En la Entrega 1 Teams queda activado con `team_id` como contexto de permisos. `ActiveClubResolver` valida la membresía activa antes de usar el club guardado en sesión y `ResolveActiveClub` actualiza el contexto de Spatie en cada petición protegida.

## Modelo financiero

Una obligación (`monthly_charges`) es distinta de un pago (`payments`). El MVP vincula un pago a un cargo mensual; `payment_allocations` queda preparado para pagos parciales y un pago aplicado a varias obligaciones. Los importes son enteros en COP; cada cargo conserva su valor histórico.

## Tareas asíncronas

La generación mensual se ejecuta con Scheduler y es idempotente mediante una restricción única por inscripción y período. Los recordatorios por correo/WhatsApp y Jobs de notificación quedan para la siguiente fase.

## PWA y privacidad

La PWA precachea recursos estáticos y no almacena datos financieros ni perfiles sensibles en cachés públicos. El MVP no habilita operaciones financieras offline. La infraestructura de correo de bienvenida, recordatorios de vencimiento y reportes CSV diarios está preparada, pero permanece desactivada hasta configurar SMTP y activar explícitamente `NEXO_NOTIFICATIONS_ENABLED=true`; Reverb/WebSockets queda como una extensión posterior.

## Decisiones iniciales

- Laravel 12.12.2: última línea compatible con PHP 8.2 disponible en el entorno.
- MariaDB/MySQL en producción; SQLite se conserva como opción local para pruebas rápidas.
- La plataforma usa actualmente `America/Bogota` como zona horaria global, configurada mediante `APP_TIMEZONE`.
- Cada club puede registrar varios medios de pago en `club_payment_methods`: cuentas bancarias, Nequi, Bre-B y llaves. Los registros pertenecen al club activo y pueden activarse o desactivarse.
- Los campos sensibles de `club_payment_methods` (`account_number`, `account_holder`, `holder_document`) se cifran en reposo. El rol `admin` los gestiona y visualiza completos; `superadmin` solo ve una representación enmascarada, como `****12`.
- La infraestructura de correos está preparada pero apagada por defecto con `NEXO_NOTIFICATIONS_ENABLED=false`; requiere SMTP antes de activarse.
- Los comprobantes se guardan en el disco privado local (`storage/app/private`) y solo se descargan mediante rutas autenticadas del deportista propietario o del equipo autorizado del club. Aprobar un comprobante crea el `payment`, marca el cargo como pagado y reactiva una inscripción suspendida dentro de una transacción.
- La zona horaria del club se conserva como dato configurable para soportar posteriormente clubes en distintas regiones.
- La vista guiada no usa almacenamiento local como fuente de verdad. `GuidedTour` identifica la página Inertia activa, muestra el botón flotante con `HelpCircle` y registra la bandera mediante `POST /guided-tours/{tourKey}/complete`; la tabla tiene unicidad por usuario y clave de módulo.
- El dashboard de cada rol (`Dashboard`, `Platform/Dashboard` y `Athletes/Portal`) inicia su tour automáticamente cuando la clave aún no está completada. El botón flotante permanece disponible para repetir cualquier tour.
- La política de cobro de inscripciones a mitad de mes se decidirá antes del módulo de facturación y se persistirá en la configuración del club.
- Las fotos privadas no se publican mediante `storage:link`; una ruta autenticada verifica sesión y club activo antes de entregar el archivo.
