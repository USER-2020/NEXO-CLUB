# Matriz de permisos — Entrega 1

## Roles compatibles

Se conservan los roles existentes y su contexto previsto:

| Rol | Alcance inicial |
|---|---|
| `superadmin` | Crear clubes y operar capacidades globales explícitas |
| `admin` | Administrar configuración, disciplinas, deportistas, inscripciones y miembros operativos |
| `usuario` | Acceso operativo limitado según el módulo |
| `contador` | Acceso financiero y registro de pagos |

## Reglas implementadas

- Un usuario solo ve clubes con membresía `active`.
- El club activo se resuelve desde la sesión y se valida contra la membresía en cada request.
- El cambio de club usa POST protegido por CSRF.
- `club_id` enviado por frontend no se acepta como autoridad: el controlador obtiene el club desde `ActiveClubResolver`.
- Las disciplinas se consultan, crean, actualizan y desactivan dentro del club activo.
- El administrador gestiona perfiles, fotos privadas y estado de deportistas.
- El administrador crea, edita, activa, suspende y cancela inscripciones.
- Cargos y pagos se limitan al club activo; el contador opera el módulo financiero.
- El superadmin administra clubes y administradores desde el panel global, no reemplaza al administrador operativo del club.
- Solo el superadmin puede consultar el módulo global de logs de auditoría.
- Las Policies `ClubPolicy` y `DisciplinePolicy` respaldan las decisiones de autorización.

## Pendiente

- Crear permisos nominales (`clubs.manage`, `disciplines.manage`, etc.) en lugar de depender solo de nombres de rol.
- Completar roles `club_admin`, `trainer`, `guardian`, `accountant` y `member` sin eliminar los cuatro roles existentes.
- Añadir pruebas de permisos distintos para el mismo usuario en dos clubes.
- Separar las capacidades globales de `superadmin` del contexto ordinario de club con una estrategia explícita y auditada.
