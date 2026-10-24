# Reglas financieras previstas

Este documento fija las decisiones que deberán respetar las entregas de inscripciones, mensualidades y pagos.

- Los importes se almacenan como enteros en COP o decimales exactos; nunca `float`.
- Una obligación financiera, un pago recibido y una asignación de pago son entidades distintas.
- Las mensualidades deben conservar el valor histórico del período.
- La generación de cargos debe ser idempotente y estar protegida por una restricción única.
- `billing:generate-monthly-charges` crea un cargo por inscripción y período mediante la restricción única `enrollment_id + period`.
- Al activar una inscripción con fecha de inicio vigente, `EnrollmentController` crea inmediatamente el cargo del mes actual; la generación diaria cubre los periodos posteriores.
- Un cargo vencido no pagado marca la inscripción como `suspended`; registrar el pago puede reactivarla.
- Los pagos parciales se distribuyen mediante asignaciones y nunca pueden superar el saldo disponible.
- Los pagos confirmados no se eliminan físicamente; las anulaciones y correcciones se auditan.
- Las operaciones financieras usan transacciones y bloqueos de fila cuando exista riesgo de concurrencia.
- No se integrará una pasarela hasta disponer de credenciales y configuración; la interfaz quedará preparada para Wompi u otro proveedor.
- Los datos para transferencia, Nequi, Bre-B y llaves se gestionan como medios de pago del club; no se mezclan con los cargos ni con los pagos registrados.
- Los datos sensibles de esos medios se cifran en reposo. El admin del club puede consultarlos completos para recibir pagos; el superadmin solo puede ver banco/proveedor, tipo y últimos dos dígitos.

## Implementación actual

La inscripción conserva `start_date` y no exige fecha final. `end_date` solo se establece al cancelar. El día de vencimiento se inicializa con el día de `start_date`, puede editarse entre 1 y 31, y se ajusta al último día disponible en meses cortos. El scheduler está registrado diariamente a las 00:10 en `routes/console.php`.

La activación no depende del scheduler para mostrar el primer cargo. Para una inscripción con fecha de inicio futura no se crea el cargo hasta que la fecha sea vigente.

## Correos preparados, desactivados por defecto

- `NEXO_NOTIFICATIONS_ENABLED=false` evita envíos mientras no exista SMTP configurado.
- Al activarse, una inscripción puede enviar correo de bienvenida al deportista.
- `billing:send-notifications` envía recordatorio un día antes y aviso el día del vencimiento.
- El mismo comando envía a los administradores un CSV diario de pendientes únicamente cuando existen cargos pendientes o vencidos.
- El scheduler ejecuta este comando diariamente a las 08:00.
- Los correos incluyen enlaces absolutos a `/login` y `/mensualidades`. La aplicación muestra allí las cuentas bancarias, Nequi y llaves autorizadas; nunca se incluyen credenciales bancarias en la URL ni en parámetros del correo.

## Decisión pendiente

La política de inscripción a mitad de mes será configurable por club: `full_month`, `prorated` o `next_period`. No se debe hardcodear una única opción en el dominio financiero.
