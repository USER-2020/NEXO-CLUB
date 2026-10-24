# Configuración de NEXO CLUB en producción

Esta guía deja una instalación limpia: sin clubes ni usuarios demo, con permisos y un único superadmin inicial.

## 1. Configurar `.env`

Usa valores reales y secretos seguros:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexo_club
DB_USERNAME=usuario_produccion
DB_PASSWORD=contraseña_segura

SUPERADMIN_NAME="Superadmin NEXO CLUB"
SUPERADMIN_EMAIL=superadmin@tu-dominio.com
SUPERADMIN_PASSWORD=contraseña_temporal_segura
```

Después de modificar el archivo:

```bash
php artisan config:clear
php artisan config:cache
```

## 2. Ejecutar las migraciones

Verifica primero que la base de datos exista y que el usuario tenga permisos de `CREATE`, `ALTER`, `INDEX` y `REFERENCES`.

```bash
php artisan migrate --force
```

## 3. Crear permisos y roles

Este seeder crea los permisos granulares y los asocia a:

```text
superadmin
admin
contador
usuario
```

Ejecuta:

```bash
php artisan db:seed --class=PermissionSeeder --force
```

## 4. Crear el superadmin inicial

Ejecuta:

```bash
php artisan db:seed --class=SuperadminUserSeeder --force
```

Para crear acceso a deportistas existentes que tengan correo y todavía no estén vinculados a una cuenta (incluidas cuentas genéricas `usuario` creadas desde Equipo), primero aplica todas las migraciones:

```bash
php artisan migrate --force
php artisan db:seed --class=AthleteAccessSeeder --force
```

La migración `2026_10_24_260000_add_user_id_to_athletes_table.php` crea la columna nullable `athletes.user_id`. Si el seeder muestra `Unknown column 'user_id'`, la base de datos todavía no tiene esa migración aplicada. Verifica el estado con:

```bash
php artisan migrate:status
```

No ejecutes el seeder hasta que la migración aparezca como `Ran`. El seeder ahora detiene la ejecución con un mensaje explícito si la columna aún no existe.

### Cómo funciona `AthleteAccessSeeder`

El archivo se encuentra en `database/seeders/AthleteAccessSeeder.php` y sirve para regularizar deportistas que fueron creados antes de habilitar el acceso automático al sistema.

El proceso:

1. Busca deportistas sin `user_id`, siempre dentro de su club.
2. Omite perfiles que no tengan correo electrónico.
3. Busca una cuenta existente con el mismo correo.
4. Si encuentra una cuenta con rol genérico `usuario`, la reutiliza, le asigna el rol `deportista` y elimina su rol genérico para que acceda al portal correcto.
5. Si no encuentra una cuenta, crea un usuario nuevo con el nombre y correo del deportista.
6. Asocia el usuario al club con estado activo.
7. Asigna el rol `deportista` del club y guarda el `user_id` en el perfil.
8. Genera una contraseña temporal nueva y la muestra en la salida de consola.

Por seguridad, no reutiliza ni modifica cuentas con roles `admin`, `contador` o `superadmin`, ni perfiles que ya estén asociados a otro usuario. El seeder tampoco envía correos: las credenciales deben entregarse por un canal seguro y la contraseña debe cambiarse después del primer ingreso.

La ejecución es segura para repetirla: los deportistas ya vinculados quedan fuera por tener `user_id`. Antes de ejecutarlo, confirma que las migraciones estén aplicadas y que los correos de los deportistas sean correctos. Ejemplo de salida:

```text
ACCESO | Juan Pérez | juan@ejemplo.com | contraseña temporal: ************
Accesos creados: 2. Accesos vinculados: 1. Sin correo: 1. Conflictos: 0.
```

Después de iniciar sesión en `/login`, el deportista es enviado a `/mi-dashboard`, donde solo consulta sus datos, inscripciones, mensualidades, pagos y estadísticas demo, y puede actualizar sus datos personales.

Las gráficas actuales usan datos fake y quedan preparadas para conectarse después con sesiones y asistencias reales.

Las credenciales se toman de:

```env
SUPERADMIN_NAME=
SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=
```

Después del primer inicio de sesión, cambia la contraseña temporal.

## Despliegue automático en Hostinger

El proyecto incluye dos workflows:

- `.github/workflows/ci.yml`: ejecuta migraciones de prueba, tests PHP y compilación frontend en cada push y pull request.
- `.github/workflows/deploy-hostinger.yml`: después de que `CI` termina correctamente para un push a `main`, compila PHP y Vite, crea un tag/release `deploy-<commit>` y deja disponible el paquete. Actualmente no se conecta a Hostinger ni ejecuta migraciones remotas; esa integración se agregará cuando el servidor esté configurado.

### Configuración inicial

1. En Hostinger, habilita SSH y confirma que PHP CLI 8.2+ esté disponible.
2. Configura el dominio para apuntar al directorio `public` de Laravel. Por ejemplo, si `HOSTINGER_APP_PATH` es `/home/usuario/apps/nexo-club`, el document root debe ser `/home/usuario/apps/nexo-club/public`.
3. Crea manualmente el `.env` de producción en `HOSTINGER_APP_PATH`. Nunca lo subas al repositorio.
4. Crea una llave SSH exclusiva para GitHub Actions y agrega su clave pública al `~/.ssh/authorized_keys` del usuario de Hostinger.
5. En GitHub, crea un environment llamado `production` y agrega estos secrets:

```text
HOSTINGER_HOST       # hostname SSH de Hostinger
HOSTINGER_USER       # usuario SSH
HOSTINGER_SSH_KEY    # clave privada completa, formato OpenSSH
HOSTINGER_PORT       # opcional; por defecto 65002
HOSTINGER_APP_PATH   # ruta absoluta del proyecto Laravel
```

El workflow preserva `.env`, `storage` y la base de datos del servidor. Antes del primer despliegue, ejecuta una vez en Hostinger:

```bash
cd /home/usuario/apps/nexo-club
php artisan storage:link
php artisan migrate --force
```

Cada push exitoso a `main` crea automáticamente el release/tag. También puede lanzarse desde **Actions → Release NEXO CLUB → Run workflow**. Hostinger no participa todavía en este workflow.

### Recomendaciones de seguridad

- Protege la rama `main` y exige que `CI` pase antes de hacer merge.
- Usa el environment `production` con aprobación manual si el proyecto lo requiere.
- No guardes `APP_KEY`, credenciales de base de datos, SMTP ni la clave SSH en el repositorio.
- Haz backup de la base de datos antes de migraciones destructivas; el workflow ejecuta `migrate --force`, pero no realiza backups automáticamente.

## 5. Seeders que no deben ejecutarse en producción

No ejecutes estos seeders porque crean datos demo:

```text
DemoClubSeeder
AdminUserSeeder
UsuarioUserSeeder
ContadorUserSeeder
ClubMembersSeeder
```

En producción, el superadmin debe crear desde la plataforma los clubes, administradores y usuarios reales.

## 6. Configurar correo electrónico

Para habilitar notificaciones reales, configura SMTP:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.tu-proveedor.com
MAIL_PORT=587
MAIL_USERNAME=correo@tu-dominio.com
MAIL_PASSWORD=contraseña-smtp
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=correo@tu-dominio.com
MAIL_FROM_NAME="NEXO CLUB"

NEXO_NOTIFICATIONS_ENABLED=true
```

Si se usan colas, deja activo el worker:

```bash
php artisan queue:work --tries=3
```

Y programa el scheduler:

```bash
php artisan schedule:work
```

## 7. Verificación final

Comprueba que:

- El superadmin puede iniciar sesión en `/platform`.
- No existen clubes demo.
- Los permisos están asociados a los roles.
- El superadmin puede crear el primer club.
- El administrador del club puede acceder únicamente a su club.
- `APP_DEBUG=false` está activo.
- Los correos permanecen deshabilitados hasta tener SMTP probado.

## Resumen de seeders para producción

```bash
php artisan db:seed --class=PermissionSeeder --force
php artisan db:seed --class=SuperadminUserSeeder --force
```
