# Roles y permisos de NEXO CLUB

NEXO CLUB usa roles asociados al club activo mediante Spatie Laravel Permission con equipos (`teams`). La autorización real siempre debe validarse en Laravel con middleware, Policies y reglas de aislamiento por `club_id`.

## Roles del sistema

| Rol | Alcance | Responsabilidad |
|---|---|---|
| `superadmin` | Global | Administra la plataforma, clubes, administradores y auditoría. |
| `admin` | Club activo | Gestiona la operación completa de su club. |
| `contador` | Club activo | Gestiona mensualidades, pagos y consultas financieras permitidas. |
| `usuario` | Club activo | Consulta información operativa con acceso limitado. |
| `deportista` | Club activo | Consulta su propio perfil, inscripciones y estado de pagos. |

Al crear un deportista con correo electrónico, el sistema crea automáticamente una cuenta con rol `deportista`, la asocia al club activo y muestra una contraseña temporal de un solo uso. El deportista entra por `/login` y es enviado a `/mi-dashboard`. El portal solo expone sus propios datos, inscripciones, cargos, pagos y estadísticas demostrativas; puede actualizar sus datos personales, pero no administrar el club.

Si el correo queda vacío, se crea únicamente el perfil sin login. Si el correo ya pertenece a una cuenta `admin`, `contador` o `superadmin`, la creación se detiene. Las cuentas genéricas `usuario` creadas previamente por un administrador sí pueden ser reutilizadas por `AthleteAccessSeeder`: se les asigna `deportista`, se vinculan al perfil y se genera una nueva contraseña temporal.

### Regularización de accesos existentes

`database/seeders/AthleteAccessSeeder.php` recorre perfiles sin `user_id`, reutiliza cuentas genéricas `usuario` que coincidan por correo o crea una cuenta nueva, asigna el rol `deportista`, asocia el usuario al club y muestra la contraseña temporal en consola. Omite perfiles sin correo, cuentas administrativas y perfiles ya vinculados.

## Permisos disponibles

### Plataforma y clubes

```text
dashboard.view
clubs.view
clubs.create
clubs.update
clubs.delete
```

### Deportistas y disciplinas

```text
athletes.view
athletes.create
athletes.update
athletes.delete
disciplines.view
disciplines.create
disciplines.update
disciplines.delete
```

### Inscripciones y facturación

```text
enrollments.view
enrollments.create
enrollments.update
enrollments.delete
billing.view
billing.manage
payment_methods.view
payment_methods.manage
enrollments.own.view
billing.own.view
```

### Equipo y auditoría

```text
team.view
team.manage
audit_logs.view
athletes.portal.view
athletes.portal.update
```

## Permisos por rol

### Superadmin

Tiene todos los permisos globales. Puede crear, editar, activar, desactivar y eliminar clubes; crear y eliminar administradores; y consultar la auditoría global.

### Administrador (`admin`)

Puede gestionar el club activo, sus deportistas, disciplinas, inscripciones, mensualidades, pagos, medios de pago y usuarios `contador`/`usuario` del equipo.

No puede crear ni eliminar administradores principales. Esa operación pertenece al superadmin.

### Contador (`contador`)

Puede consultar el dashboard, clubes, deportistas, disciplinas e inscripciones, además de gestionar mensualidades y pagos y consultar medios de pago.

No puede administrar deportistas, disciplinas, usuarios ni configuración global.

### Usuario (`usuario`)

Tiene acceso de consulta al dashboard, club activo, deportistas, disciplinas, inscripciones y mensualidades permitidas. No puede crear, editar, eliminar ni administrar usuarios o configuración financiera.

### Deportista (`deportista`)

Es un rol de acceso limitado para un deportista con cuenta vinculada. Puede consultar y actualizar únicamente su propio perfil, consultar sus inscripciones y consultar el estado de sus mensualidades. No puede ver otros deportistas ni administrar el club.

## Aislamiento por club

Todo usuario operativo debe estar asociado a uno o más clubes mediante la tabla de membresías. Si el usuario cambia el club activo, las consultas, permisos y datos deben resolverse nuevamente para ese club.

Nunca se deben listar usuarios, deportistas, pagos o inscripciones de otro club. El módulo Equipo debe mostrar únicamente usuarios operativos (`contador` y `usuario`) asociados al `activeClub`; los deportistas se gestionan en Deportistas y acceden a `/mi-dashboard`. El superadmin se gestiona desde `/platform` y no debe mezclarse con los miembros operativos del club.

## Seeders

### Seeder de permisos

```text
database/seeders/PermissionSeeder.php
```

Este seeder crea los permisos globales, crea los roles por club cuando existen clubes, asocia los permisos a cada rol y crea el rol global `superadmin` para producción.

### Seeder del superadmin

```text
database/seeders/SuperadminUserSeeder.php
```

Usa estas variables de entorno:

```env
SUPERADMIN_NAME="Superadmin NEXO CLUB"
SUPERADMIN_EMAIL=superadmin@tu-dominio.com
SUPERADMIN_PASSWORD=contraseña-segura
```

### Comandos para producción

Después de ejecutar las migraciones:

```bash
php artisan db:seed --class=PermissionSeeder --force
php artisan db:seed --class=SuperadminUserSeeder --force
```

No ejecutar en producción los seeders de datos demo:

```text
DemoClubSeeder
AdminUserSeeder
UsuarioUserSeeder
ContadorUserSeeder
ClubMembersSeeder
```

## Backend y frontend

Ocultar un elemento del menú en React mejora la experiencia, pero no protege el recurso. Cada ruta y acción debe validarse en backend mediante `platform.admin`, `active.club`, Policies y `hasRole`, `hasAnyRole` o `can` cuando corresponda.

Ejemplo:

```php
abort_unless($request->user()->hasAnyRole(['admin', 'contador']), 403);
$this->authorize('update', $club);
```

Cuando se agregue un módulo nuevo, primero se debe definir su permiso, asignarlo al rol correspondiente en `PermissionSeeder` y después proteger la ruta y el controlador. La creación del perfil deportivo no asigna automáticamente el rol `deportista`; una cuenta debe vincularse explícitamente para habilitar el acceso.
