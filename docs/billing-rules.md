# Reglas financieras previstas

Este documento fija las decisiones que deberán respetar las entregas de inscripciones, mensualidades y pagos.

- Los importes se almacenan como enteros en COP o decimales exactos; nunca `float`.
- Una obligación financiera, un pago recibido y una asignación de pago son entidades distintas.
- Las mensualidades deben conservar el valor histórico del período.
- La generación de cargos debe ser idempotente y estar protegida por una restricción única.
- `billing:generate-monthly-charges` crea un cargo por inscripción y período mediante la restricción única `enrollment_id + period`.
- Al activar una inscripción con fecha de inicio vigente, `EnrollmentController` crea inmediatamente el cargo del mes actual; la generación diaria cubre los periodos posteriores.
- El primer pago de una inscripción pendiente fija el inicio del período en la fecha real de registro/aprobación del pago. El siguiente cobro se calcula desde esa fecha según `monthly`, `biweekly`, `quarterly`, `semiannual` o `annual`; no se muestra nuevamente la fecha del cargo inicial pagado.
- Un cargo vencido no pagado marca la inscripción como `suspended`; registrar el pago puede reactivarla.
- `billing:generate-monthly-charges` calcula `due_date` con `enrollments.due_day`, limitado al último día del mes. Los cargos existentes conservan su fecha histórica.
- Los pagos parciales se distribuyen mediante asignaciones y nunca pueden superar el saldo disponible.
- Los pagos confirmados no se eliminan físicamente; las anulaciones y correcciones se auditan.
- Las operaciones financieras usan transacciones y bloqueos de fila cuando exista riesgo de concurrencia.
- No se integrará una pasarela hasta disponer de credenciales y configuración; la interfaz quedará preparada para Wompi u otro proveedor.
- Los datos para transferencia, Nequi, Bre-B y llaves se gestionan como medios de pago del club; no se mezclan con los cargos ni con los pagos registrados.
- Los datos sensibles de esos medios se cifran en reposo. El admin del club puede consultarlos completos para recibir pagos; el superadmin solo puede ver banco/proveedor, tipo y últimos dos dígitos.

## Implementación actual

La inscripción conserva `start_date` y no exige fecha final. `end_date` solo se establece al cancelar. El día de vencimiento se inicializa con el día de `start_date`, puede editarse entre 1 y 31, y se ajusta al último día disponible en meses cortos. El scheduler está registrado diariamente a las 00:10 en `routes/console.php`.

La activación no depende del scheduler para mostrar el primer cargo. Para una inscripción con fecha de inicio futura no se crea el cargo hasta que la fecha sea vigente.

Recaudos muestra el inicio y el fin del período cubierto por cada cargo. El generador toma el día siguiente al fin del último período como inicio del próximo. Editar el inicio, la periodicidad o el día de vencimiento de la inscripción conserva los períodos y las fechas de los cargos existentes.

### Cambios de fecha y cobros existentes

| Fecha o estado | Efecto en un cobro recurrente |
| --- | --- |
| Fecha de inicio de la inscripción | La inscripción es elegible para el corte desde esa fecha. Si todavía carece de cargos, el generador toma esa fecha como inicio del primer período. |
| Fecha del primer pago de una inscripción pendiente | El registro o la aprobación del pago fija el inicio y la vigencia del primer período pagado. Los pagos posteriores conservan el período de su cargo. |
| Fin del último período | El siguiente período comienza al día siguiente. El corte crea el cargo cuando llega esa fecha y la inscripción está activa. |
| Día de vencimiento configurado | El generador lo aplica en el mes de inicio del nuevo período, con ajuste al último día del mes cuando corresponda. Los avisos consultan la fecha guardada en **Vence** en Recaudos. |
| Inscripción suspendida | El corte diario la omite. El aviso de suspensión puede salir cuando hayan pasado cinco días calendario desde que quedó suspendida. |

- Si el período pagado termina el **16 de noviembre**, el siguiente comienza el **17**. Con la inscripción activa y el vencimiento configurado en **18**, el corte genera el cargo el 17, con vencimiento el **18 de noviembre**. Si sigue pendiente, el comando de ese día lo incluye en los avisos.
- Si el último período pagado va del **7 de noviembre al 6 de diciembre**, cambiar la fecha de inicio de la inscripción al 17 de octubre y el vencimiento al 18 conserva ese período. La próxima generación corresponde al **7 de diciembre** y el nuevo cargo vence el **18 de diciembre** si la inscripción está activa.

Actualmente, configurar un día de vencimiento anterior al inicio del nuevo período dentro de ese mes puede generar un cargo ya vencido. Una reactivación manual desde Inscripciones también puede crear un cargo desde la fecha de inicio guardada, así que verifica el saldo y la vigencia en Recaudos antes de reactivar.

## Correos preparados, desactivados por defecto

- La campana del administrador consulta los cobros pendientes y vencidos de las inscripciones activas y suspendidas del club activo al cargar la página. El contador y el importe abarcan todos esos cobros y la lista muestra hasta 50, con los vencidos primero.
- `NEXO_NOTIFICATIONS_ENABLED=false` evita envíos mientras no exista SMTP configurado.
- Al activarse, una inscripción puede enviar correo de bienvenida al deportista.
- `billing:send-notifications` envía recordatorio un día antes y aviso el día del vencimiento mientras la inscripción siga activa.
- Los administradores reciben un reporte de los cargos pendientes o vencidos de inscripciones activas. El correo lista el deportista, la disciplina, el vencimiento, el valor y el estado. Si el deportista tiene teléfono, cada fila incluye un botón para abrir su chat de WhatsApp. El Excel `.xlsx` adjunto incluye también el período.
- A partir del quinto día desde `suspended_at`, el mismo comando envía la notificación de suspensión al deportista y a los administradores activos del club. Las ejecuciones siguientes omiten esa suspensión cuando el envío ya quedó registrado en `suspension_notified_at`.
- Registrar o aprobar un pago limpia `suspension_notified_at`, reactiva la inscripción y permite enviar el correo de activación.
- El scheduler ejecuta este comando diariamente a las 08:00.
- Cada ejecución imprime en consola la fecha procesada, el total de destinatarios deportistas y administradores y sus correos únicos. Si no hay destinatarios, muestra `Correos: ninguno`.
- Los correos incluyen enlaces absolutos a `/login` y `/mensualidades`. La aplicación muestra allí las cuentas bancarias, Nequi y llaves autorizadas; nunca se incluyen credenciales bancarias en la URL ni en parámetros del correo.

## Decisión pendiente

La política de inscripción a mitad de mes será configurable por club: `full_month`, `prorated` o `next_period`. No se debe hardcodear una única opción en el dominio financiero.
