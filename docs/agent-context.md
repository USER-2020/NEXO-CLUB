# NEXO CLUB — contexto para otro agente

Este documento es el handoff operativo del proyecto. Léelo antes de modificar el repositorio.

## Producto

NEXO CLUB es una PWA para administrar clubes deportivos: deportistas, acudientes, inscripciones, mensualidades, pagos, cartera, comunicaciones y reportes. La propuesta de producto es: **“Conectamos deportistas, clubes y progreso”**.

El proyecto completó la base multi-club y el primer flujo operativo: autenticación, clubes, membresías, disciplinas, deportistas, inscripciones, mensualidades, pagos, medios de pago del club y contexto de club activo están implementados. La infraestructura de notificaciones está preparada, pero permanece desactivada por configuración.

## Stack instalado

- Laravel 12.12.2, PHP 8.2+, Eloquent y Blade como host de Inertia.
- Inertia Laravel 2 + React 18 + TypeScript + Vite.
- Laravel Breeze para autenticación, recuperación y verificación de correo.
- Tailwind CSS, Lucide React, Framer Motion, Recharts, React Hook Form, Zod y `vite-plugin-pwa`.
- Spatie Laravel Permission 6.25 conectado mediante `HasRoles` en `App\Models\User`.
- MySQL/MariaDB es el destino de producción; SQLite se puede usar localmente para verificaciones aisladas.

## Comandos de verificación

```bash
npm run build
php artisan test
vendor/bin/pint --test
php artisan migrate:fresh --seed
```

Si MySQL local no está disponible, usar temporalmente:

```bash
DB_CONNECTION=sqlite DB_DATABASE=database/database.sqlite php artisan migrate:fresh --seed
```

No cambies el `.env` del usuario para hacer esta verificación.

## Estructura relevante

- `resources/js/Pages/Welcome.tsx`: landing pública con hero, mockup de dashboard y animaciones Framer Motion.
- `resources/js/Pages/Dashboard.tsx`: dashboard inicial con datos vacíos reales y estados de onboarding.
- `resources/js/Layouts/AuthenticatedLayout.tsx`: sidebar, header, selector de club visual, navegación móvil y navegación inferior.
- `resources/js/Layouts/GuestLayout.tsx`: layout visual compartido por login, registro y recuperación.
- `resources/js/Pages/Auth/Login.tsx`: login NEXO estilizado.
- `resources/js/Pages/Profile/Edit.tsx`: perfil y seguridad con tarjetas oscuras NEXO.
- `resources/js/Pages/Athletes/Index.tsx`: lista, onboarding modal, edición, activación/desactivación y foto privada.
- `resources/js/Pages/Enrollments/Index.tsx`: lista, onboarding modal, edición y estados de ciclo de vida.
- `resources/js/Pages/Memberships/Index.tsx`: mensualidades, medios de pago activos, cargos vencidos y registro de pagos.
- `resources/js/Pages/Platform/AuditLogs.tsx`: auditoría global de accesos y operaciones.
- `resources/js/Components/ui/`: inputs, selects y date pickers con estilo shadcn local. Los selects usan posicionamiento fijo para mostrarse por encima de modales y contenedores con overflow.
- `resources/js/Components/GuidedTour.tsx`: botón flotante y recorridos Driver.js por componente Inertia; el estado se persiste por usuario en `guided_tours`.
- `skills/nexo-club-guided-tours/SKILL.md`: contrato obligatorio para crear guías Driver.js de módulos nuevos con contenido, roles, pasos, estados y video reales.
- `resources/js/lib/dates.ts`: formateo amigable de fechas y horas con la zona horaria global `America/Bogota`.
- `resources/css/app.css`: tokens base y clases `.nexo-card` / `.nexo-eyebrow`.
- `tailwind.config.js`: colores `nexo.lime`, `nexo.ink`, `nexo.surface`, `nexo.muted` y sombra lima.
- `vite.config.js`: React + Laravel Vite + PWA manifest/service worker.
- `docs/architecture.md`: decisiones de arquitectura.
- `docs/database-schema.md`: esquema creado en la Entrega 1 y tablas futuras.
- `docs/permissions-matrix.md`: reglas de autorización actuales y pendientes.
- `docs/billing-rules.md`: invariantes financieras y reglas del flujo de cobros actual.
- `docs/progress.md`: registro de avances y decisiones pendientes.
- `AGENTS.md`: convenciones del repositorio.

## Roles y usuarios de prueba

`DatabaseSeeder` crea estos roles: `superadmin`, `admin`, `usuario` y `contador`. Cada usuario se crea mediante un seeder independiente y solo fuera de producción:

| Rol | Email | Contraseña |
|---|---|---|
| superadmin | `superadmin@nexo.club` | `NexoSuper2026!` |
| admin | `admin@nexo.club` | `NexoAdmin2026!` |
| usuario | `usuario@nexo.club` | `NexoUsuario2026!` |
| contador | `contador@nexo.club` | `NexoContador2026!` |

Seeders: `SuperadminUserSeeder`, `AdminUserSeeder`, `UsuarioUserSeeder`, `ContadorUserSeeder`.

## Identidad visual

- Lima deportivo: `#B8F34B`.
- Fondo: `#0B1220`.
- Superficie: `#151E2E`.
- Texto principal: `#F8FAFC`.
- Muted: `#94A3B8`.
- Estados: éxito `#22C55E`, warning `#F59E0B`, danger `#EF4444`.
- Inter como tipografía.
- Diseño mobile-first, con sidebar desktop, navegación inferior móvil, tarjetas táctiles, estados de loading/empty/error y foco visible.

## Decisiones de seguridad y dominio

- Backend como autoridad: el frontend no decide permisos ni `club_id`.
- Toda entidad de negocio debe aislarse por club cuando corresponda.
- Los medios de pago almacenan cuenta, titular y documento con casts cifrados de Laravel. El administrador del club puede verlos completos; el superadmin solo recibe valores enmascarados y no puede modificarlos desde esta pantalla.
- Las Policies y las validaciones backend también aplican a exportaciones.
- Los movimientos financieros confirmados no se eliminan físicamente.
- Pagos y obligaciones son entidades distintas; `payment_allocations` permitirá pagos parciales y pagos aplicados a varias obligaciones.
- Los importes financieros serán enteros en COP o decimales exactos, nunca `float`.
- No cachear información financiera o datos personales sensibles en la PWA.
- `OperationProgressModal` está montado en `resources/js/app.tsx` para sobrevivir a la navegación Inertia. Se usa únicamente para INSERT y asociaciones nuevas: muestra tres etapas; cada etapa permanece 5 segundos, el último paso queda visible y el proceso completo se mantiene visible al menos 16 segundos. El Toast se muestra después del modal.
- Todo nuevo INSERT debe declarar su operación y mensajes propios en `OperationProgressModal`, respetando la secuencia clic → loader específico → backend → cierre → Toast. Los `UPDATE`, `DELETE` y cambios de estado usan Toast y confirmación, sin este loader.
- Secuencia para mantenimiento: INSERT → clic → loader específico → backend → cierre → Toast; UPDATE/DELETE/cambio de estado → clic → confirmación si aplica → backend → Toast.
- Agregar un medio de pago usa una operación propia: registra, protege los datos bancarios y activa el medio para pagos.
- Los correos de facturación enlazan a la aplicación (`/login` y `/mensualidades`); no deben transportar números de cuenta, llaves ni otros datos bancarios en URLs.
- Las fotos de deportistas se guardan en `storage/app/private` y solo se entregan mediante una ruta autenticada del club activo.
- `audit_logs` registra CRUD, inicios/cierres de sesión e intentos fallidos con actor, club, IP y valores anteriores/nuevos.
- En producción se ejecutan únicamente `PermissionSeeder` y `SuperadminUserSeeder`; los demás seeders incluidos en `DatabaseSeeder` son para desarrollo/demo.
- `PermissionSeeder` prepara también el rol `deportista`, con permisos limitados a su propio perfil, inscripciones y mensualidades. Al crear un deportista con correo se crea y vincula automáticamente su cuenta; sin correo queda como perfil interno. No aparece en Equipo por defecto.

## Flujo operativo implementado

1. El administrador registra al deportista. El perfil es permanente y no requiere fecha final.
2. Crea una inscripción asociando deportista, disciplina, fecha de inicio, mensualidad y día de vencimiento.
3. La inscripción usa los estados `pending`, `active`, `suspended` y `cancelled`.
4. Al activar una inscripción cuya fecha de inicio ya llegó, se crea inmediatamente el cargo del periodo actual.
5. `billing:generate-monthly-charges` crea los cargos mensuales siguientes de forma idempotente; no genera cargos antes de `start_date`.
6. El día de vencimiento se toma inicialmente de la fecha de inicio, puede cambiarse entre 1 y 31 y se ajusta al último día del mes cuando corresponde.
7. Un cargo vencido no pagado suspende la inscripción; registrar el pago puede reactivarla.
8. El scheduler corre con `php artisan schedule:work` en desarrollo o cron en producción, diariamente a las 00:10.

El perfil incluye tipo de documento (tarjeta de identidad, cédula de ciudadanía, pasaporte u otro) y número de documento. Los datos físicos actuales son opcionales: estatura, peso, talla de ropa y talla de calzado. Tests, medidas históricas, mesociclos y macrociclos serán módulos posteriores.

## Trabajo pendiente prioritario

1. Añadir historial de medidas, tests físicos y seguimiento de progreso.
2. Implementar entrenadores, grupos, horarios, sesiones y asistencias.
3. Mejorar Billing con pagos parciales, asignaciones, cartera y auditoría.
4. Activar notificaciones internas/correo/Jobs cuando exista SMTP y aprobación funcional; la base de bienvenida, recordatorios y reporte CSV ya está preparada.
5. Crear reportes, exportaciones autorizadas y pruebas adicionales de aislamiento multi-club.

## Decisiones pendientes

- Política para inscripciones a mitad de mes: cobro completo, proporcional o siguiente período.
- Flujo de cambio de club y contexto de roles con Spatie Teams.
- Configuración final de MySQL, correo y workers para producción.

## Handoff recomendado

Antes de una nueva fase, revisar `docs/architecture.md`, `docs/progress.md` y este archivo. Después inspeccionar `git status`, confirmar que no existen cambios del usuario que deban preservarse y ejecutar las verificaciones del proyecto.
